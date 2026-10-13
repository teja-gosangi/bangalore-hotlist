import { callSheets } from './_lib/sheets.js'

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } })
    }

    try {
      const result = await callSheets({ action: 'list' })
      if (result.ok === false) {
        return Response.json({ error: result.error || 'Could not load nominees.' }, { status: 500 })
      }
      return Response.json({ ok: true, nominees: result.nominees ?? [] })
    } catch (err) {
      console.error(err)
      return Response.json({ error: 'Could not load nominees.' }, { status: 500 })
    }
  },
}
