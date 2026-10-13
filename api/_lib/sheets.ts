export type SheetsNomination = {
  id: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  nominee_name: string
  gender: 'man' | 'woman' | 'other'
  twitter_or_linkedin: string
  reason: string
  nominator_name: string
  votes: number
}

export type SheetsResponse = {
  ok?: boolean
  error?: string
  nominees?: SheetsNomination[]
}

export async function callSheets(body: Record<string, unknown>): Promise<SheetsResponse> {
  const url = process.env.SHEETS_WEBHOOK_URL
  const secret = process.env.SHEETS_WEBHOOK_SECRET
  if (!url || !secret) {
    return { ok: false, error: 'Sheets webhook is not configured.' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, secret }),
    redirect: 'follow',
  })

  const text = await res.text()
  try {
    return JSON.parse(text) as SheetsResponse
  } catch {
    const short = text.length > 300 ? `${text.slice(0, 300)}…` : text
    return {
      ok: false,
      error: short || `Sheets webhook returned ${res.status}`,
    }
  }
}
