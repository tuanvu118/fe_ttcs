import { useCallback, useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('popstate', callback)

  return () => {
    window.removeEventListener('popstate', callback)
  }
}

function getSnapshot() {
  return window.location.pathname || '/'
}

export function useRouter() {
  const pathname = useSyncExternalStore(subscribe, getSnapshot, () => '/')

  const navigate = useCallback((nextPath) => {
    if (window.location.pathname === nextPath) {
      return
    }

    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  const replace = useCallback((nextPath) => {
    if (window.location.pathname === nextPath) {
      return
    }

    window.history.replaceState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  return { pathname, navigate, replace }
}
