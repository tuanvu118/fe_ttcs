import { USER_ROLES } from '../utils/routes'
import {
  clearAuthSession,
  getStoredAuthSession,
  subscribeAuthChange,
  writeAuthSession,
} from './authSession'
import { apiRequest } from './apiClient'

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

function getFirstAvailableValue(...values) {
  return (
    values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
  )
}

function normalizeCurrentUserPayload(currentUser) {
  if (!currentUser) {
    return {}
  }

  if (typeof currentUser === 'string') {
    return currentUser.includes('@')
      ? { email: currentUser }
      : { full_name: currentUser }
  }

  if (typeof currentUser !== 'object') {
    return {}
  }

  return currentUser.user || currentUser.data || currentUser.profile || currentUser
}

function normalizeRoleArray(roleValues) {
  if (!Array.isArray(roleValues)) {
    return []
  }

  return roleValues
    .flatMap((roleValue) => {
      if (typeof roleValue === 'string') {
        return [roleValue]
      }

      if (Array.isArray(roleValue)) {
        return roleValue.filter((item) => typeof item === 'string')
      }

      if (roleValue && typeof roleValue === 'object') {
        return normalizeRoleArray(roleValue.roles)
      }

      return []
    })
    .filter(Boolean)
}

function normalizeUnitRoles(source) {
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((roleItem) => {
      if (!roleItem || typeof roleItem !== 'object' || Array.isArray(roleItem)) {
        return null
      }

      return {
        unit_id: roleItem.unit_id || roleItem.unitId || '',
        roles: normalizeRoleArray(roleItem.roles),
      }
    })
    .filter((roleItem) => roleItem && (roleItem.unit_id || roleItem.roles.length))
}

export { getStoredAuthSession, subscribeAuthChange }

export async function loginUser({ studentId, password }) {
  const body = new URLSearchParams({
    username: studentId.trim(),
    password,
  })

  const token = await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    skipAuthRefresh: true,
  })

  return writeAuthSession({
    accessToken: token?.access_token || '',
    refreshToken: token?.refresh_token || '',
    tokenType: token?.token_type || 'bearer',
  })
}

export async function fetchCurrentUser(authSession) {
  if (!authSession?.accessToken) {
    return null
  }

  const currentUser = await apiRequest('/users/me', {
    method: 'GET',
    authToken: authSession.accessToken,
  })
  const tokenClaims = authSession.tokenClaims || {}
  const profilePayload = normalizeCurrentUserPayload(currentUser)
  const roles = normalizeUnitRoles(profilePayload.roles || tokenClaims.roles)

  return {
    id: getFirstAvailableValue(profilePayload.id, profilePayload.user_id, tokenClaims.sub),
    username: getFirstAvailableValue(
      profilePayload.username,
      profilePayload.student_id,
      profilePayload.studentId,
      tokenClaims.student_id,
      tokenClaims.preferred_username,
    ),
    fullName: getFirstAvailableValue(
      profilePayload.full_name,
      profilePayload.fullName,
      profilePayload.name,
      tokenClaims.full_name,
      tokenClaims.name,
    ),
    email: getFirstAvailableValue(
      profilePayload.email,
      profilePayload.mail,
      tokenClaims.email,
    ),
    studentId: getFirstAvailableValue(
      profilePayload.student_id,
      profilePayload.studentId,
      profilePayload.username,
      tokenClaims.student_id,
      tokenClaims.preferred_username,
    ),
    className: getFirstAvailableValue(
      profilePayload.class_name,
      profilePayload.className,
      profilePayload.class,
      tokenClaims.class_name,
      tokenClaims.className,
    ),
    courseCode: getFirstAvailableValue(
      profilePayload.course_code,
      profilePayload.courseCode,
      profilePayload.course,
      tokenClaims.course_code,
      tokenClaims.courseCode,
    ),
    avatarUrl: getFirstAvailableValue(
      profilePayload.avatar_url,
      profilePayload.avatarUrl,
      tokenClaims.avatar_url,
      tokenClaims.avatarUrl,
    ),
    dateOfBirth: getFirstAvailableValue(
      profilePayload.date_of_birth,
      profilePayload.dateOfBirth,
      tokenClaims.date_of_birth,
      tokenClaims.dateOfBirth,
    ),
    roles,
    role:
      authSession.tokenRole ||
      normalizeRole(profilePayload.role) ||
      USER_ROLES.user,
  }
}

export async function logoutUser(options = {}) {
  const authSession = getStoredAuthSession()

  try {
    if (!options.skipServer && authSession?.refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: authSession.refreshToken,
        }),
        skipAuthRefresh: true,
      })
    }
  } finally {
    clearAuthSession()
  }
}
