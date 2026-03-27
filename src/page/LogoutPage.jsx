import { useEffect } from 'react'
import { PATHS } from '../utils/routes'

function LogoutPage({ onLogout, replace }) {
  useEffect(() => {
    async function runLogout() {
      await onLogout()
      replace(PATHS.home)
    }

    runLogout()
  }, [onLogout, replace])

  return (
    <section className="page-card">
      <h1>Đăng xuất</h1>
    </section>
  )
}

export default LogoutPage
