import { FINAL_LIST_AT, VOTING_END, VOTING_START } from '../constants'

const VOTED_STORAGE_KEY = 'bangalore-hotlist-voted'

function parseInstant(iso: string): Date {
  return new Date(iso)
}

export function isBeforeVotingStart(now = new Date()): boolean {
  return now < parseInstant(VOTING_START)
}

export function isVotingOpen(now = new Date()): boolean {
  return now >= parseInstant(VOTING_START) && now < parseInstant(VOTING_END)
}

export function isAfterVotingEnd(now = new Date()): boolean {
  return now >= parseInstant(VOTING_END)
}

export function isFinalListLive(now = new Date()): boolean {
  return now >= parseInstant(FINAL_LIST_AT)
}

export function formatVotingOpensLabel(): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(parseInstant(VOTING_START))
}

export function getVotedIds(): string[] {
  try {
    const raw = localStorage.getItem(VOTED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function hasVotedFor(id: string): boolean {
  return getVotedIds().includes(id)
}

export function markVoted(id: string): void {
  const ids = getVotedIds()
  if (!ids.includes(id)) {
    localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify([...ids, id]))
  }
}
