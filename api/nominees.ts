import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callSheets } from './_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await callSheets({ action: 'list' })
    if (result.ok === false) {
      return res.status(500).json({ error: result.error || 'Could not load nominees.' })
    }
    return res.status(200).json({ ok: true, nominees: result.nominees ?? [] })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Could not load nominees.' })
  }
}
