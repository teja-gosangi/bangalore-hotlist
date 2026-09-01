import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { GENDER_SECTIONS, SITE_TITLE } from '../constants'
import type { Nomination } from '../types'
import { supabase } from '../lib/supabase'
import { getSiteOrigin, shareOrCopy, voteShareText } from '../lib/share'
import {
  formatVotingOpensLabel,
  hasVotedFor,
  isAfterVotingEnd,
  isBeforeVotingStart,
  isFinalListLive,
  isVotingOpen,
  markVoted,
} from '../lib/voting'

function NomineeCard({
  nominee,
  votingEnabled,
  highlighted,
  onVoted,
}: {
  nominee: Nomination
  votingEnabled: boolean
  highlighted: boolean
  onVoted: (id: string) => void
}) {
  const [voting, setVoting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [alreadyVoted, setAlreadyVoted] = useState(hasVotedFor(nominee.id))
  const [shareHint, setShareHint] = useState<string | null>(null)

  async function handleVote() {
    setVoteError(null)
    setVoting(true)

    const { error } = await supabase.rpc('vote_for_nominee', { nominee_id: nominee.id })

    setVoting(false)

    if (error) {
      setVoteError('Could not record vote. Try again.')
      return
    }

    markVoted(nominee.id)
    setAlreadyVoted(true)
    onVoted(nominee.id)
  }

  async function handleShare() {
    setShareHint(null)
    const url = `${getSiteOrigin()}/vote?highlight=${nominee.id}`
    try {
      const result = await shareOrCopy(voteShareText(nominee.nominee_name), url)
      setShareHint(result === 'shared' ? 'Shared.' : 'Link copied.')
    } catch {
      // cancelled
    }
  }

  return (
    <article
      id={`nominee-${nominee.id}`}
      className={`nominee-card${highlighted ? ' is-highlighted' : ''}`}
    >
      <div className="nominee-header">
        <h3 className="nominee-name">{nominee.nominee_name}</h3>
        <span className="vote-count" aria-label={`${nominee.votes} votes`}>
          {nominee.votes}
        </span>
      </div>

      <p className="nominee-reason">{nominee.reason}</p>

      <a
        href={nominee.twitter_or_linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="nominee-link"
      >
        Twitter / LinkedIn
      </a>

      <div className="nominee-actions">
        {votingEnabled && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleVote}
            disabled={alreadyVoted || voting}
          >
            {alreadyVoted ? 'Voted' : voting ? 'Voting…' : 'Vote'}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={handleShare}>
          Share
        </button>
      </div>

      {voteError && <p className="form-error">{voteError}</p>}
      {shareHint && <p className="hint">{shareHint}</p>}
    </article>
  )
}

export function VotePage() {
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [nominees, setNominees] = useState<Nomination[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const scrolledRef = useRef(false)

  const loadNominees = useCallback(async () => {
    setLoading(true)
    setFetchError(null)

    const { data, error } = await supabase
      .from('nominations')
      .select('*')
      .eq('status', 'approved')
      .order('votes', { ascending: false })

    if (error) {
      setFetchError(error.message)
      setNominees([])
    } else {
      setNominees((data as Nomination[]) ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadNominees()
  }, [loadNominees])

  useEffect(() => {
    if (!highlightId || loading || scrolledRef.current) return

    const el = document.getElementById(`nominee-${highlightId}`)
    if (!el) return

    scrolledRef.current = true
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [highlightId, loading, nominees])

  const beforeStart = isBeforeVotingStart()
  const votingOpen = isVotingOpen()
  const afterEnd = isAfterVotingEnd()
  const finalLive = isFinalListLive()
  const hasApproved = nominees.length > 0
  const showPlaceholder = beforeStart || !hasApproved
  const votingEnabled = votingOpen && hasApproved

  function handleVoted(id: string) {
    setNominees((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, votes: n.votes + 1 } : n))
        .sort((a, b) => b.votes - a.votes),
    )
  }

  const grouped = GENDER_SECTIONS.map((section) => ({
    ...section,
    items: nominees.filter((n) => n.gender === section.key),
  }))

  return (
    <Layout showVoteNav={votingOpen && hasApproved}>
      <div className="page-card vote-page">
        <h1 className="page-title">{SITE_TITLE}</h1>

        {afterEnd && finalLive && hasApproved && !showPlaceholder && (
          <>
            <p className="status-banner status-final">Final hot list</p>
            <p className="page-subtitle">The votes are in. Here’s who made the list.</p>
          </>
        )}

        {votingEnabled && (
          <p className="page-subtitle">Vote for your picks — one vote per person per browser.</p>
        )}

        {showPlaceholder && (
          <div className="vote-placeholder">
            <p className="placeholder-lead">Voting opens {formatVotingOpensLabel()}</p>
            {!beforeStart && !hasApproved && (
              <p className="placeholder-sub">Approved nominees will appear here once voting starts.</p>
            )}
            {beforeStart && (
              <p className="placeholder-sub">
                Nominations are open now —{' '}
                <a href="/">nominate someone</a>.
              </p>
            )}
          </div>
        )}

        {loading && <p className="hint">Loading…</p>}
        {fetchError && <p className="form-error">{fetchError}</p>}

        {!showPlaceholder && !loading && (
          <div className="gender-sections">
            {grouped.map((section) => (
              <section key={section.key} className="gender-section">
                <h2 className="section-title">{section.title}</h2>
                {section.items.length === 0 ? (
                  <p className="hint">No nominees in this category yet.</p>
                ) : (
                  <div className="nominee-list">
                    {section.items.map((nominee) => (
                      <NomineeCard
                        key={nominee.id}
                        nominee={nominee}
                        votingEnabled={votingEnabled}
                        highlighted={highlightId === nominee.id}
                        onVoted={handleVoted}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {afterEnd && hasApproved && !showPlaceholder && (
          <p className="status-banner status-closed bottom">Voting closed</p>
        )}
      </div>
    </Layout>
  )
}
