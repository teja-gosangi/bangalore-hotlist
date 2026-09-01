import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
      {voteNavVisible && location.pathname !== '/vote' && (
        <header className="site-header">
          <div className="header-inner">
            <Link to="/vote" className="header-nav-link">Vote</Link>
          </div>
        </header>
      )}

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
