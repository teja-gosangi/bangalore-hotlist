import { hashClientIp } from './_lib/ip'
import { callSheets } from './_lib/sheets'
import { validateNomination } from './_lib/validate'

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
    }

    const body = await request.json().catch(() => ({}))
    const validated = validateNomination(body ?? {})
    if (validated.error || !validated.data) {
      return Response.json({ error: validated.error }, { status: 400 })
    }

    try {
      const result = await callSheets({
        action: 'nominate',
        ...validated.data,
        ip_hash: hashClientIp(request),
      })

      if (result.ok === false) {
        const status = result.error?.includes('Too many') || result.error?.includes('Daily') ? 429 : 400
        return Response.json({ error: result.error || 'Could not submit nomination. Try again.' }, { status })
      }

      return Response.json({ ok: true })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
    }
  },
}
