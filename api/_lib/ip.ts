import { createHash } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'

export function hashClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const ip =
    forwardedValue?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  const salt = process.env.RATE_LIMIT_SALT ?? 'bangalore-hotlist'
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex')
}
