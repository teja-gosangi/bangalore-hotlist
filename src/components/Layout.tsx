import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LOGO_URL } from '../constants'
import { isVotingOpen } from '../lib/voting'

interface LayoutProps {
  children: ReactNode
  showVoteNav?: boolean
}

export function Layout({ children, showVoteNav = false }: LayoutProps) {
  const location = useLocation()
  const voteNavVisible = showVoteNav && isVotingOpen()

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo-link" aria-label="Meant2Bae home">
            <img src={LOGO_URL} alt="Meant2Bae" className="logo" />
          </Link>
          {voteNavVisible && location.pathname !== '/vote' && (
            <Link to="/vote" className="header-nav-link">Vote</Link>
          )}
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="site-footer">
        <span>© Meant2Bae 2026</span>
        <a href="https://www.meant2bae.com" target="_blank" rel="noopener noreferrer">
          meant2bae.com
        </a>
      </footer>
    </div>
  )
}
