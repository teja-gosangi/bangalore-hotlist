import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callSheets } from './_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nomineeId = String(req.body?.nominee_id ?? '').trim()
  if (!nomineeId) {
    return res.status(400).json({ error: 'Nominee is required.' })
  }

  try {
    const result = await callSheets({ action: 'vote', nominee_id: nomineeId })
    if (result.ok === false) {
      return res.status(400).json({ error: result.error || 'Could not record vote. Try again.' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Could not record vote. Try again.' })
  }
}
