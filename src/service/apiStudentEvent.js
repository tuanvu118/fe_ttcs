import { apiRequest } from './apiClient'
import { getStoredAuthSession } from './authSession'

/**
 * Fetch list of valid public events for students
 */
export async function getValidPublicEvents(params = {}) {
  const { semesterId, search, timeFilter, skip = 0, limit = 10 } = params
  const accessToken = getStoredAuthSession()?.accessToken || ''
  
  const queryParams = new URLSearchParams()
  if (semesterId) queryParams.append('semester_id', semesterId)
  if (search) queryParams.append('search', search)
  if (timeFilter) queryParams.append('timeFilter', timeFilter)
  queryParams.append('skip', skip)
  queryParams.append('limit', limit)
  
  return apiRequest(`/events/valid?${queryParams.toString()}`, {
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
export async function registerPublicEvent(eventId, answers = [], idempotencyKey = null) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest(`/events/${eventId}/register_public_event`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
    },
    body: JSON.stringify({ answers }),
    authToken: accessToken,
  })
}

/**
 * Register for a unit-restricted event
 */
export async function registerUnitEvent(eventId, unitId, idempotencyKey = null) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest(`/events/${eventId}/register_unit_event`, {
    method: 'POST',
    headers: { 
      'Accept': 'application/json',
      'X-Unit-Id': unitId,
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
    },
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

/**
 * Scan attendance QR with current location
 */
export async function scanAttendanceQr({ qrValue, latitude, longitude }) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  return apiRequest('/attendance/scan', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qr_value: qrValue,
      latitude,
      longitude,
    }),
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}
