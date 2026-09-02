import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const HOURLY_LIMIT = 3
const DAILY_LIMIT = 10
const RATE_LIMIT_SALT = Deno.env.get('RATE_LIMIT_SALT') ?? 'bangalore-hotlist'

type Gender = 'man' | 'woman' | 'other'

interface NominationPayload {
  nominee_name?: string
  gender?: Gender
  twitter_or_linkedin?: string
  reason?: string
  nominator_name?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}:${RATE_LIMIT_SALT}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeSocialLink(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  return `https://${trimmed}`
}

function isValidSocialLink(value: string): boolean {
  try {
    const url = new URL(normalizeSocialLink(value))
    const host = url.hostname.toLowerCase()
    return (
      host.includes('twitter.com') ||
      host.includes('x.com') ||
      host.includes('linkedin.com') ||
      host === 't.co'
    )
  } catch {
    return false
  }
}

function validatePayload(body: NominationPayload) {
  const nominee_name = body.nominee_name?.trim() ?? ''
  const nominator_name = body.nominator_name?.trim() ?? ''
  const reason = body.reason?.trim() ?? ''
  const social = body.twitter_or_linkedin?.trim() ?? ''
  const gender = body.gender

  if (!nominee_name || !nominator_name || !reason || !social || !gender) {
    return { error: 'All fields are required.' }
  }

  if (!['man', 'woman', 'other'].includes(gender)) {
    return { error: 'Invalid gender.' }
  }

  if (normalizeName(nominee_name) === normalizeName(nominator_name)) {
    return { error: 'You can’t nominate yourself — pick someone else.' }
  }

  if (!isValidSocialLink(social)) {
    return { error: 'Add a valid Twitter or LinkedIn link.' }
  }

  return {
    data: {
      nominee_name,
      nominator_name,
      reason,
      gender,
      twitter_or_linkedin: normalizeSocialLink(social),
      status: 'pending' as const,
      votes: 0,
    },
  }
}

async function isRateLimited(
  supabase: ReturnType<typeof createClient>,
  ipHash: string,
): Promise<'hour' | 'day' | null> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: hourCount, error: hourError } = await supabase
    .from('nomination_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo)

  if (hourError) throw hourError
  if ((hourCount ?? 0) >= HOURLY_LIMIT) return 'hour'

  const { count: dayCount, error: dayError } = await supabase
    .from('nomination_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', dayAgo)

  if (dayError) throw dayError
  if ((dayCount ?? 0) >= DAILY_LIMIT) return 'day'

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as NominationPayload
    const validated = validatePayload(body)
    if ('error' in validated) {
      return jsonResponse({ error: validated.error }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const ipHash = await hashIp(getClientIp(req))
    const limited = await isRateLimited(supabase, ipHash)

    if (limited === 'hour') {
      return jsonResponse(
        { error: 'Too many nominations from your connection. Try again in an hour.' },
        429,
      )
    }

    if (limited === 'day') {
      return jsonResponse(
        { error: 'Daily nomination limit reached. Try again tomorrow.' },
        429,
      )
    }

    const { error: insertError } = await supabase
      .from('nominations')
      .insert(validated.data)

    if (insertError) {
      console.error(insertError)
      return jsonResponse({ error: 'Could not submit nomination. Try again.' }, 500)
    }

    const { error: rateError } = await supabase
      .from('nomination_rate_limits')
      .insert({ ip_hash: ipHash })

    if (rateError) {
      console.error(rateError)
    }

    return jsonResponse({ ok: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Something went wrong. Try again.' }, 500)
  }
})
