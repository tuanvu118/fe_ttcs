import { useCallback, useEffect, useState } from 'react'
import {
  fetchCurrentUser,
  getStoredAuthSession,
  loginUser,
  logoutUser,
  subscribeAuthChange,
} from '../service/authService'
import {
  USER_ROLES,
  canManageUsers,
  getDashboardPathForRole,
  getRoleLabel,
} from '../utils/routes'

function normalizeRole(role) {
  if (typeof role !== 'string') {
    return USER_ROLES.user
  }

  const normalizedRole = role.trim().toLowerCase()

  return Object.values(USER_ROLES).includes(normalizedRole)
    ? normalizedRole
    : USER_ROLES.user
}

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
          setUser(
            currentUser
              ? {
                  ...currentUser,
                  role: normalizeRole(currentUser.role || authSession?.tokenRole),
                }
              : null,
          )
        }
      } catch {
        await logoutUser({ skipServer: true })

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

  const logout = useCallback(async (options = {}) => {
    await logoutUser(options)
    setAuthSession(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    setAuthSession((currentSession) =>
      currentSession?.accessToken ? { ...currentSession } : currentSession,
    )
  }, [])

  const role = normalizeRole(user?.role || authSession?.tokenRole)

  return {
    user,
    role,
    roleLabel: getRoleLabel(role),
    dashboardPath: getDashboardPathForRole(role),
    accessToken: authSession?.accessToken || '',
    refreshToken: authSession?.refreshToken || '',
    isAuthenticated: Boolean(authSession?.accessToken),
    isAdmin: role === USER_ROLES.admin,
    isManager: role === USER_ROLES.manager,
    isStaff: role === USER_ROLES.staff,
    canManageUsers: canManageUsers(role),
    isLoadingUser,
    login,
    logout,
    refreshUser,
  }
}
