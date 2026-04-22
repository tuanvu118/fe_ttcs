import { MANAGE_ADMIN_PANELS, PATHS } from '../utils/routes'

/** Path ngắn /admin, /admin/:unit, /admin/:unit/:panel */
export const ADMIN_PATH_REGEX = /^\/admin(?:\/([^/]+)(?:\/([^/]+))?)?$/

function adminPathSegments(pathname) {
  if (pathname.startsWith('/admin')) {
    const rest = pathname.replace(/^\/admin\/?/, '')
    if (!rest) return []
    return rest.split('/').filter(Boolean)
  }
  if (pathname.startsWith('/staff')) {
    const rest = pathname.replace(/^\/staff\/?/, '')
    if (!rest) return []
    return rest.split('/').filter(Boolean)
  }
  if (pathname.startsWith('/unit')) {
    const rest = pathname.replace(/^\/unit\/?/, '')
    if (!rest) return []
    return rest.split('/').filter(Boolean)
  }
  return null
}

export function isAdminPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false
  }
  const lowPath = pathname.toLowerCase()
  if (
    lowPath === '/admin' ||
    lowPath === '/admin/' ||
    lowPath === '/staff' ||
    lowPath === '/staff/' ||
    lowPath === '/unit' ||
    lowPath === '/unit/'
  ) {
    return true
  }
  
  if (lowPath.startsWith('/admin/') || lowPath.startsWith('/staff/') || lowPath.startsWith('/unit/')) {
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
  if (segments.length === 3 && segments[1] === MANAGE_ADMIN_PANELS.reports) {
    return { unitId, panel: MANAGE_ADMIN_PANELS.reports, reportId: segments[2] }
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
    return '/staff'
  }
  return `/staff/${unitId}/${panel}`
}

export function buildAdminPath(unitId, panel = MANAGE_ADMIN_PANELS.users) {
  if (!unitId) {
    return PATHS.admin
  }
  return `${PATHS.admin}/${unitId}/${panel}`
}
