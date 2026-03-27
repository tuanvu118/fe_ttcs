import { useCallback, useMemo, useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('popstate', callback)

  return () => {
    window.removeEventListener('popstate', callback)
  }
}

function getSnapshot() {
  return `${window.location.pathname || '/'}${window.location.search || ''}`
}

export function useRouter() {
  const location = useSyncExternalStore(subscribe, getSnapshot, () => '/')
  const parsedLocation = useMemo(() => {
    const queryIndex = location.indexOf('?')

    if (queryIndex === -1) {
      return {
        pathname: location || '/',
        search: '',
      }
    }

    return {
      pathname: location.slice(0, queryIndex) || '/',
      search: location.slice(queryIndex),
    }
  }, [location])

  const navigate = useCallback((nextPath) => {
    const currentPath = `${window.location.pathname}${window.location.search}`

    if (currentPath === nextPath) {
      return
    }

    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  const replace = useCallback((nextPath) => {
    const currentPath = `${window.location.pathname}${window.location.search}`

    if (currentPath === nextPath) {
      return
    }

    window.history.replaceState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  return {
    pathname: parsedLocation.pathname,
    search: parsedLocation.search,
    navigate,
    replace,
  }
}
