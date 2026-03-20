import { readStorage, removeStorage, writeStorage } from '../utils/storage'
import { apiRequest } from './apiClient'

const AUTH_STORAGE_KEY = 'dtn_auth_session'

export function getStoredAuthSession() {
  return readStorage(AUTH_STORAGE_KEY)
}

export async function loginUser({ studentId, password }) {
  const body = new URLSearchParams({
    username: studentId.trim(),
    password,
    grant_type: 'password',
  })

  const token = await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const authSession = {
    accessToken: token.access_token,
    tokenType: token.token_type || 'bearer',
  }

  writeStorage(AUTH_STORAGE_KEY, authSession)
  notifyAuthChanged()
  return authSession
}

export async function fetchCurrentUser(authSession) {
  if (!authSession?.accessToken) {
    return null
  }

  const currentUser = await apiRequest('/users/me', {
    method: 'GET',
    authToken: authSession.accessToken,
  })

  return {
    id: currentUser.id,
    username: currentUser.student_id,
    fullName: currentUser.full_name,
    email: currentUser.email,
    studentId: currentUser.student_id,
    className: currentUser.class_name,
    courseCode: currentUser.course_code,
    avatarUrl: currentUser.avatar_url,
    dateOfBirth: currentUser.date_of_birth,
    role: currentUser.role || 'user',
  }
}

export function logoutUser() {
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
