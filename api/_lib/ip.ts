import { createHash } from 'node:crypto'

export function hashClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const salt = process.env.RATE_LIMIT_SALT ?? 'bangalore-hotlist'
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex')
}
