import type { Gender } from './constants'

export interface Nomination {
  id: string
  nominee_name: string
  gender: Gender
  twitter_or_linkedin: string
  reason: string
  nominator_name: string
  votes: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
