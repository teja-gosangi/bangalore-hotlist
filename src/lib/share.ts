export function getSiteOrigin(): string {
  const configured = import.meta.env.VITE_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://hotlist.meant2bae.com'
}

export async function shareOrCopy(text: string, url: string): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text, url })
      return 'shared'
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') throw err
    }
  }

  await navigator.clipboard.writeText(`${text}\n${url}`)
  return 'copied'
}

export function nominateShareText(): string {
  return 'Bangalore Hot List is live — nominate someone who belongs on the list.'
}

export function voteShareText(nomineeName: string): string {
  return `Vote for ${nomineeName} on the Bangalore Hot List.`
}
