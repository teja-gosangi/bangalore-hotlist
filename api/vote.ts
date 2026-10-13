import { callSheets } from './_lib/sheets'

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
    }

    const body = (await request.json().catch(() => ({}))) as { nominee_id?: unknown }
    const nomineeId = String(body.nominee_id ?? '').trim()
    if (!nomineeId) {
      return Response.json({ error: 'Nominee is required.' }, { status: 400 })
    }

    try {
      const result = await callSheets({ action: 'vote', nominee_id: nomineeId })
      if (result.ok === false) {
        return Response.json({ error: result.error || 'Could not record vote. Try again.' }, { status: 400 })
      }
      return Response.json({ ok: true })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Could not record vote. Try again.' }, { status: 500 })
    }
  },
}
