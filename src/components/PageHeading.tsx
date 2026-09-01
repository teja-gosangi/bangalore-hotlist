import { Link } from 'react-router-dom'
import { LOGO_URL, SITE_TITLE } from '../constants'

export function PageHeading() {
  return (
    <div className="page-heading">
      <h1 className="page-title">{SITE_TITLE}</h1>
      <Link to="/" className="page-heading-logo" aria-label="Meant2Bae home">
        <img src={LOGO_URL} alt="Meant2Bae" className="logo" />
      </Link>
    </div>
  )
}
