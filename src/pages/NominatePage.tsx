import { useState } from 'react'
import { Layout } from '../components/Layout'
import { GENDER_OPTIONS, SITE_TITLE } from '../constants'
import type { Gender } from '../constants'
import { supabase } from '../lib/supabase'
import {
  getSiteOrigin,
  nominateShareText,
  shareOrCopy,
} from '../lib/share'
import {
  isSelfNomination,
  isValidSocialLink,
  normalizeSocialLink,
} from '../lib/validation'

export function NominatePage() {
  const [nomineeName, setNomineeName] = useState('')
  const [gender, setGender] = useState<Gender>('man')
  const [socialLink, setSocialLink] = useState('')
  const [reason, setReason] = useState('')
  const [nominatorName, setNominatorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [shareHint, setShareHint] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedNominee = nomineeName.trim()
    const trimmedNominator = nominatorName.trim()
    const trimmedReason = reason.trim()
    const trimmedSocial = socialLink.trim()

    if (!trimmedNominee || !trimmedNominator || !trimmedReason || !trimmedSocial) {
      setError('All fields are required.')
      return
    }

    if (isSelfNomination(trimmedNominee, trimmedNominator)) {
      setError('You can’t nominate yourself — pick someone else.')
      return
    }

    if (!isValidSocialLink(trimmedSocial)) {
      setError('Add a valid Twitter or LinkedIn link.')
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('nominations').insert({
      nominee_name: trimmedNominee,
      gender,
      twitter_or_linkedin: normalizeSocialLink(trimmedSocial),
      reason: trimmedReason,
      nominator_name: trimmedNominator,
      status: 'pending',
    })

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSubmitted(true)
  }

  async function handleShareNominate() {
    setShareHint(null)
    try {
      const result = await shareOrCopy(
        nominateShareText(),
        `${getSiteOrigin()}/`,
      )
      setShareHint(result === 'shared' ? 'Shared.' : 'Link copied.')
    } catch {
      // user cancelled share sheet
    }
  }

  function resetForm() {
    setNomineeName('')
    setGender('man')
    setSocialLink('')
    setReason('')
    setNominatorName('')
    setSubmitted(false)
    setError(null)
    setShareHint(null)
  }

  return (
    <Layout>
      <div className="page-card">
        <h1 className="page-title">{SITE_TITLE}</h1>
        <p className="page-subtitle">
          Who belongs on this list? Nominate someone else — you can’t nominate yourself.
        </p>

        {submitted ? (
          <div className="confirmation">
            <p className="confirmation-lead">
              Thanks — we’ll review nominations before voting opens.
            </p>
            <div className="confirmation-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Nominate another person
              </button>
              <button type="button" className="btn btn-primary" onClick={handleShareNominate}>
                Share nominations
              </button>
            </div>
            {shareHint && <p className="hint">{shareHint}</p>}
          </div>
        ) : (
          <form className="nominate-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="field-label">Nominee’s full name</span>
              <input
                type="text"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder="Their full name"
                required
              />
            </label>

            <fieldset className="field">
              <span className="field-label">Gender</span>
              <div className="gender-toggle">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gender-option${gender === opt.value ? ' is-active' : ''}`}
                    onClick={() => setGender(opt.value)}
                    aria-pressed={gender === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="field">
              <span className="field-label">Twitter or LinkedIn</span>
              <input
                type="url"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="https://x.com/… or linkedin.com/in/…"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Why should they be on the list?</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="One reason they belong on this list, beyond being single"
                rows={4}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Your name</span>
              <input
                type="text"
                value={nominatorName}
                onChange={(e) => setNominatorName(e.target.value)}
                placeholder="So we know who nominated them"
                required
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit nomination'}
            </button>
          </form>
        )}
      </div>
    </Layout>
  )
}
