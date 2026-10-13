import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hashClientIp } from './_lib/ip'
import { callSheets } from './_lib/sheets'
import { validateNomination } from './_lib/validate'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const validated = validateNomination(req.body ?? {})
  if (validated.error || !validated.data) {
    return res.status(400).json({ error: validated.error })
  }

  try {
    const result = await callSheets({
      action: 'nominate',
      ...validated.data,
      ip_hash: hashClientIp(req),
    })

    if (result.ok === false) {
      const status = result.error?.includes('Too many') || result.error?.includes('Daily') ? 429 : 400
      return res.status(status).json({ error: result.error || 'Could not submit nomination. Try again.' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong. Try again.' })
  }
}
