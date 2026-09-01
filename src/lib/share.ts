export function getSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://hotlist.meant2bae.com'
}

export async function shareOrCopy(
  text: string,
  url: string,
  title?: string,
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') throw err
    }
  }

  await navigator.clipboard.writeText(`${text}\n${url}`)
  return 'copied'
}

export function buildNominateShareMessage(url: string): string {
  return `I just nominated someone for Bangalore's Hot List 👀 Who's on yours? ${url}`
}

export async function shareNominationInvite(url: string): Promise<'shared' | 'copied'> {
  const message = buildNominateShareMessage(url)

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: message })
      return 'shared'
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') throw err
    }
  }

  await navigator.clipboard.writeText(message)
  return 'copied'
}

export function voteShareText(nomineeName: string): string {
  return `Vote for ${nomineeName} on Bangalore's HOT LIST.`
}
