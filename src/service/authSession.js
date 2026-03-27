import { USER_ROLES } from '../utils/routes'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'

const AUTH_STORAGE_KEY = 'dtn_auth_session'
const ROLE_PRIORITY = [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.staff]

function normalizeRole(role) {
  if (typeof role !== 'string') {
    return null
  }

  const normalizedRole = role.trim().toLowerCase()

  if (normalizedRole.includes('admin')) {
    return USER_ROLES.admin
  }

  if (normalizedRole.includes('manager')) {
    return USER_ROLES.manager
  }

  if (normalizedRole.includes('staff')) {
    return USER_ROLES.staff
  }

  if (normalizedRole.includes('user')) {
    return USER_ROLES.user
  }

  return null
}

function decodeBase64Url(value) {
  if (!value || typeof atob !== 'function') {
    return null
  }

  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + ((4 - (normalizedValue.length % 4 || 4)) % 4),
    '=',
  )

  try {
    const binary = atob(paddedValue)
    const bytes = Array.from(binary, (character) =>
      `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
    ).join('')

    return decodeURIComponent(bytes)
  } catch {
    return null
  }
}

function decodeTokenPayload(accessToken) {
  if (typeof accessToken !== 'string') {
    return null
  }

  const [, payload] = accessToken.split('.')

  if (!payload) {
    return null
  }

  try {
    const decodedPayload = decodeBase64Url(payload)
    return decodedPayload ? JSON.parse(decodedPayload) : null
  } catch {
    return null
  }
}

function collectRoles(source, accumulator = []) {
  if (!source) {
    return accumulator
  }

  if (typeof source === 'string') {
    accumulator.push(source)
    return accumulator
  }

  if (Array.isArray(source)) {
    source.forEach((item) => collectRoles(item, accumulator))
    return accumulator
  }

  if (typeof source === 'object') {
    collectRoles(source.role, accumulator)
    collectRoles(source.roles, accumulator)
    collectRoles(source.authorities, accumulator)
  }

  return accumulator
}

function extractRoleFromClaims(tokenClaims) {
  const normalizedRoles = collectRoles([
    tokenClaims?.role,
    tokenClaims?.roles,
    tokenClaims?.authorities,
  ])
    .map(normalizeRole)
    .filter(Boolean)

  return (
    ROLE_PRIORITY.find((role) => normalizedRoles.includes(role)) ||
    USER_ROLES.user
  )
}

export function buildAuthSession(session) {
  if (!session?.accessToken) {
    return session ?? null
  }

  const tokenClaims = decodeTokenPayload(session.accessToken)

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken || '',
    tokenType: session.tokenType || 'bearer',
    tokenClaims,
    tokenRole: extractRoleFromClaims(tokenClaims),
  }
}

export function getStoredAuthSession() {
  return buildAuthSession(readStorage(AUTH_STORAGE_KEY))
}

export function writeAuthSession(session) {
  const nextSession = buildAuthSession(session)

  if (!nextSession) {
    clearAuthSession()
    return null
  }

  writeStorage(AUTH_STORAGE_KEY, nextSession)
  notifyAuthChanged()
  return nextSession
}

export function clearAuthSession() {
  removeStorage(AUTH_STORAGE_KEY)
  notifyAuthChanged()
}

export function subscribeAuthChange(listener) {
  function handleStorageEvent() {
    listener(getStoredAuthSession())
  }

  window.addEventListener('storage', handleStorageEvent)

  return () => {
    window.removeEventListener('storage', handleStorageEvent)
  }
}

function notifyAuthChanged() {
  window.dispatchEvent(new StorageEvent('storage'))
}
