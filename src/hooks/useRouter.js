import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useRouter() {
  const location = useLocation()
  const rrNavigate = useNavigate()

  const navigate = useCallback(
    (nextPath) => {
      const current = `${location.pathname}${location.search}`
      if (current === nextPath) {
        return
      }
      rrNavigate(nextPath)
    },
    [location.pathname, location.search, rrNavigate],
  )

  const replace = useCallback(
    (nextPath) => {
      const current = `${location.pathname}${location.search}`
      if (current === nextPath) {
        return
      }
      rrNavigate(nextPath, { replace: true })
    },
    [location.pathname, location.search, rrNavigate],
  )

  return {
    pathname: location.pathname,
    search: location.search,
    navigate,
    replace,
  }
}
