/** Voting window — also update supabase/migrations/001_nominations.sql vote_for_nominee() */
export const VOTING_START = '2026-09-05T05:00:00+05:30' // Sat 5 Sep, 5:00 AM IST
export const VOTING_END = '2026-09-06T17:00:00+05:30' // Sun 6 Sep, 5:00 PM IST (36h window)
export const FINAL_LIST_AT = VOTING_END

export const SITE_TITLE = "Bangalore's HOT LIST"

export const PAGE_INTRO =
  "Single, emotionally available, kicking ass at work, life beyond work, takes care of themselves. You can't nominate yourself."
export const LOGO_URL = '/logo-reverse.png'

export const GENDER_OPTIONS = [
  { value: 'man' as const, label: 'Man' },
  { value: 'woman' as const, label: 'Woman' },
  { value: 'other' as const, label: 'Other' },
]

export type Gender = 'man' | 'woman' | 'other'

export const GENDER_SECTIONS: { key: Gender; title: string }[] = [
  { key: 'man', title: 'Men' },
  { key: 'woman', title: 'Women' },
  { key: 'other', title: 'Other' },
]
