import type { Nomination } from '../types'

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const parsed = (await res.json()) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    // ignore parse errors
  }
  return fallback
}

export async function submitNomination(payload: {
  nominee_name: string
  gender: Nomination['gender']
  twitter_or_linkedin: string
  reason: string
  nominator_name: string
}): Promise<{ error?: string }> {
  const res = await fetch('/api/nominate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) return { error: await readError(res, 'Could not submit nomination. Try again.') }
  return {}
}

export async function fetchApprovedNominees(): Promise<Nomination[]> {
  const res = await fetch('/api/nominees')
  if (!res.ok) {
    throw new Error(await readError(res, 'Could not load nominees.'))
  }
  const data = (await res.json()) as { nominees?: Nomination[] }
  return data.nominees ?? []
}

export async function voteForNominee(nomineeId: string): Promise<{ error?: string }> {
  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nominee_id: nomineeId }),
  })

  if (!res.ok) return { error: await readError(res, 'Could not record vote. Try again.') }
  return {}
}
