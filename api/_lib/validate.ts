export type Gender = 'man' | 'woman' | 'other'

export type NominationInput = {
  nominee_name: string
  nominator_name: string
  reason: string
  gender: Gender
  twitter_or_linkedin: string
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
    const host = new URL(normalizeSocialLink(value)).hostname.toLowerCase()
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

export function validateNomination(body: Partial<NominationInput>): {
  error?: string
  data?: NominationInput
} {
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
    },
  }
}
