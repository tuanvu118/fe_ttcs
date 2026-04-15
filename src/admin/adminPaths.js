import { MANAGE_ADMIN_PANELS, PATHS } from '../utils/routes'

/** Path ngắn /admin, /admin/:unit, /admin/:unit/:panel */
export const ADMIN_PATH_REGEX = /^\/admin(?:\/([^/]+)(?:\/([^/]+))?)?$/

function adminPathSegments(pathname) {
  if (!pathname.startsWith('/admin')) {
    return null
  }
  const rest = pathname.replace(/^\/admin\/?/, '')
  if (!rest) {
    return []
  }
  return rest.split('/').filter(Boolean)
}

export function isAdminPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false
  }
  if (pathname === '/admin' || pathname === '/admin/') {
    return true
  }
  if (!pathname.startsWith('/admin/')) {
    return false
  }
  const segments = adminPathSegments(pathname)
  if (!segments || segments.length <= 2) {
    return true
  }
  if (
    segments.length === 3 &&
    segments[1] === MANAGE_ADMIN_PANELS.events &&
    segments[2] === 'create'
  ) {
    return true
  }
  if (
    segments.length === 4 &&
    segments[1] === MANAGE_ADMIN_PANELS.events &&
    (segments[2] === 'p' || segments[2] === 'u')
  ) {
    return true
  }
  if (
    segments.length === 5 &&
    segments[1] === MANAGE_ADMIN_PANELS.events &&
    (segments[2] === 'p' || segments[2] === 'u') &&
    segments[4] === 'edit'
  ) {
    return true
  }
  return false
}

/**
 * @returns {{ unitId: string, panel: string, eventDetail: null | { scope: 'p'|'u', eventId: string } }}
 */
export function parseAdminPath(pathname = '') {
  const segments = adminPathSegments(pathname)
  if (!segments || segments.length === 0) {
    return { unitId: '', panel: '', eventDetail: null }
  }
  const unitId = segments[0]
  if (
    segments.length >= 4 &&
    segments[1] === MANAGE_ADMIN_PANELS.events &&
    (segments[2] === 'p' || segments[2] === 'u')
  ) {
    return {
      unitId,
      panel: MANAGE_ADMIN_PANELS.events,
      eventDetail: { scope: segments[2], eventId: segments[3] },
    }
  }
  const panel = segments[1] || ''
  return { unitId, panel, eventDetail: null }
}

/** SK → /admin/:unitId/events/p/:id; HTSK/HTTT → .../u/:id */
export function buildAdminEventDetailPath(unitId, eventId, eventType) {
  if (!unitId || !eventId) {
    return PATHS.admin
  }
  const scope = eventType === 'SK' ? 'p' : 'u'
  return `${PATHS.admin}/${unitId}/events/${scope}/${eventId}`
}

export function buildStaffPath(unitId, panel = 'members') {
  if (!unitId) {
    return PATHS.admin
  }
  return `${PATHS.admin}/${unitId}/${panel}`
}

export function buildAdminPath(unitId, panel = MANAGE_ADMIN_PANELS.users) {
  if (!unitId) {
    return PATHS.admin
  }
  return `${PATHS.admin}/${unitId}/${panel}`
}
