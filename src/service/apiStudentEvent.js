import { apiRequest } from './apiClient'
import { getStoredAuthSession } from './authSession'

/**
 * Fetch list of valid public events for students
 */
export async function getValidPublicEvents(params = {}) {
  const { semesterId } = params
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const query = semesterId ? `?semester_id=${semesterId}` : ''
  return apiRequest(`/events/valid${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

/**
 * Fetch student's registered events
 */
export async function getMyRegistrations() {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  if (!accessToken) return []
  
  return apiRequest('/events/me/registrations', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    authToken: accessToken,
  })
}

/**
 * Get basic event info for any student/guest
 */
export async function getEventPublicDetail(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest(`/events/${eventId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

/**
 * Get detailed event info including user registration status
 */
export async function getMyEventRegistrationDetail(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  if (!accessToken) return null

  return apiRequest(`/events/${eventId}/my-registration`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    authToken: accessToken,
  })
}

/**
 * Register for a public event
 */
export async function registerPublicEvent(eventId, answers = []) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest(`/events/${eventId}/register_public_event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
    authToken: accessToken,
  })
}

/**
 * Cancel registration
 */
export async function cancelRegistration(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest(`/events/${eventId}/register`, {
    method: 'DELETE',
    authToken: accessToken,
  })
}
