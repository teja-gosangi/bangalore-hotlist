export async function callSheets(body) {
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
    return JSON.parse(text)
  } catch {
    const short = text.length > 300 ? `${text.slice(0, 300)}…` : text
    return {
      ok: false,
      error: short || `Sheets webhook returned ${res.status}`,
    }
  }
}
