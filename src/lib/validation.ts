export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function isSelfNomination(nomineeName: string, nominatorName: string): boolean {
  return normalizeName(nomineeName) === normalizeName(nominatorName)
}

export function normalizeSocialLink(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  return `https://${trimmed}`
}

export function isValidSocialLink(value: string): boolean {
  const normalized = normalizeSocialLink(value)
  try {
    const url = new URL(normalized)
    const host = url.hostname.toLowerCase()
    return (
      host.includes('twitter.com') ||
      host.includes('x.com') ||
      host.includes('linkedin.com') ||
      host === 't.co'
    )
  } catch {
    return false
  }
}
