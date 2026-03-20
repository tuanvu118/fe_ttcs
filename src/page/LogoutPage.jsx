import { useEffect } from 'react'
import { PATHS } from '../utils/routes'

function LogoutPage({ onLogout, replace }) {
  useEffect(() => {
    onLogout()
    replace(PATHS.home)
  }, [onLogout, replace])

  return (
    <section className="page-card">
      <h1>Logout</h1>
    </section>
  )
}

export default LogoutPage
