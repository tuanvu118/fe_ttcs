import { useCallback, useEffect, useState } from 'react'
import {
  fetchCurrentUser,
  getStoredAuthSession,
  loginUser,
  logoutUser,
  subscribeAuthChange,
} from '../service/authService'

export function useAuth() {
  const [authSession, setAuthSession] = useState(() => getStoredAuthSession())
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(Boolean(authSession?.accessToken))

  useEffect(() => subscribeAuthChange(setAuthSession), [])

  useEffect(() => {
    let isCancelled = false

    async function loadCurrentUser() {
      if (!authSession?.accessToken) {
        setUser(null)
        setIsLoadingUser(false)
        return
      }

      setIsLoadingUser(true)

      try {
        const currentUser = await fetchCurrentUser(authSession)

        if (!isCancelled) {
          setUser(currentUser)
        }
      } catch {
        logoutUser()

        if (!isCancelled) {
          setUser(null)
          setAuthSession(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingUser(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      isCancelled = true
    }
  }, [authSession])

  const login = useCallback(async (credentials) => {
    const nextSession = await loginUser(credentials)
    setAuthSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setAuthSession(null)
    setUser(null)
  }, [])

  return {
    user,
    isAuthenticated: Boolean(authSession?.accessToken),
    isAdmin: user?.role === 'admin',
    isLoadingUser,
    login,
    logout,
  }
}
