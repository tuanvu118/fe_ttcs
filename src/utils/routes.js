export const PATHS = {
  home: '/',
  qr: '/qr',
  event: '/events',
  units: '/units',
  qrScan: '/qr-scan',
  about: '/news',
  club: '/units',
  login: '/login',
  profile: '/profile',
  admin: '/admin',
  manage: '/admin',
  manageUnits: '/admin',
  manageAdmin: '/admin',
  logout: '/logout',
}

/** Panel query cho /manage/admin — thay cho các path /manage/admin/user|units|semester cũ */
export const MANAGE_ADMIN_PANELS = {
  users: 'users',
  units: 'units',
  semesters: 'semesters',
  events: 'events',
  reports: 'reports',
  promotions: 'promotions',
}

const ADMIN_PANEL_IDS = new Set(Object.values(MANAGE_ADMIN_PANELS))
const STAFF_UNIT_PANEL_IDS = new Set(['members', 'reports', 'events', 'promotions'])

export const USER_ROLES = {
  admin: 'admin',
  manager: 'manager',
  staff: 'staff',
  user: 'user',
}

export const ROLE_LABELS = {
  [USER_ROLES.admin]: 'Quản trị viên',
  [USER_ROLES.manager]: 'Quản lý',
  [USER_ROLES.staff]: 'Nhân sự đơn vị',
  [USER_ROLES.user]: 'Người dùng',
}

export const ROLE_DASHBOARD_PATHS = {
  [USER_ROLES.admin]: PATHS.admin,
  [USER_ROLES.manager]: PATHS.admin,
  [USER_ROLES.staff]: PATHS.admin,
}

export const UNIT_TYPES = {
  lck: 'LCK',
  clb: 'CLB',
  system: 'SYSTEM',
}

const MANAGE_USER_ROLES = [USER_ROLES.admin, USER_ROLES.manager]
const MANAGE_PATHS = new Set([PATHS.manage, PATHS.manageUnits, PATHS.manageAdmin])
const CLUB_DETAIL_PATTERN = /^\/units\/([^/]+)$/

export const primaryNavigation = [
  { path: PATHS.home, label: 'Trang chủ' },
  { path: PATHS.event, label: 'Sự kiện' },
  { path: PATHS.about, label: 'Bảng tin' },
  { path: PATHS.club, label: 'Đơn vị' },
]

const routeMeta = {
  [PATHS.home]: { title: 'Trang chủ' },
  [PATHS.qr]: { title: 'QR Điểm danh' },
  [PATHS.event]: { title: 'Sự kiện' },
  [PATHS.qrScan]: { title: 'Quét QR', requiresAuth: true },
  [PATHS.about]: { title: 'Bảng tin' },
  [PATHS.club]: { title: 'Đơn vị' },
  [PATHS.login]: { title: 'Đăng nhập' },
  [PATHS.profile]: { title: 'Hồ sơ', requiresAuth: true },
  [PATHS.manage]: {
    title: 'Quản trị',
    requiresAuth: true,
  },
  [PATHS.manageUnits]: {
    title: 'Quản trị đơn vị',
    requiresAuth: true,
  },
  [PATHS.manageAdmin]: {
    title: 'Quản trị hệ thống',
    requiresAuth: true,
  },
  [PATHS.logout]: { title: 'Đăng xuất', requiresAuth: true },
}

export function buildClubDetailPath(unitId) {
  return `${PATHS.club}/${unitId}`
}

export function getClubUnitIdFromPath(pathname) {
  const matchedPath = pathname.match(CLUB_DETAIL_PATTERN)
  return matchedPath?.[1] ?? null
}

export function isClubDetailPath(pathname) {
  return Boolean(getClubUnitIdFromPath(pathname))
}

export function getRouteMeta(pathname) {
  if (routeMeta[pathname]) {
    return routeMeta[pathname]
  }

  if (isClubDetailPath(pathname)) {
    return {
      title: 'Chi tiết đơn vị',
    }
  }

  return null
}

export function isManagePath(pathname) {
  return MANAGE_PATHS.has(pathname)
}

export function parseManageQuery(search = '', pathname = '') {
  const params = new URLSearchParams(search || '')
  const unitId = params.get('unit') || ''
  const rawPanel = params.get('panel')

  if (pathname === PATHS.manageAdmin) {
    const panel =
      rawPanel && ADMIN_PANEL_IDS.has(rawPanel) ? rawPanel : MANAGE_ADMIN_PANELS.users
    return { unitId, panel }
  }

  if (pathname === PATHS.manageUnits) {
    const panel = rawPanel && STAFF_UNIT_PANEL_IDS.has(rawPanel) ? rawPanel : 'members'
    return { unitId, panel }
  }

  return {
    unitId,
    panel: rawPanel || 'members',
  }
}

function normalizeScopedRole(roleName) {
  if (typeof roleName !== 'string') {
    return null
  }

  const normalizedRole = roleName.trim().toLowerCase()
  return Object.values(USER_ROLES).includes(normalizedRole) ? normalizedRole : null
}

function getHighestManageRole(roleNames = []) {
  const normalizedRoles = roleNames
    .map((roleName) => normalizeScopedRole(roleName))
    .filter(Boolean)

  if (normalizedRoles.includes(USER_ROLES.admin)) {
    return USER_ROLES.admin
  }

  if (normalizedRoles.includes(USER_ROLES.manager)) {
    return USER_ROLES.manager
  }

  if (normalizedRoles.includes(USER_ROLES.staff)) {
    return USER_ROLES.staff
  }

  return null
}

export function getManageRoleForUnit(user, unitId) {
  if (!unitId) {
    return null
  }

  // Nếu là Admin tổng -> Có quyền tại mọi đơn vị
  if (user?.role === USER_ROLES.admin) {
    return USER_ROLES.admin
  }

  const roleItem = (user?.roles || []).find((item) => item?.unit_id === unitId)
  return getHighestManageRole(roleItem?.roles || [])
}

export function getManageOptionsFromUser(user) {
  const options = []
  ;(user?.roles || []).forEach((item) => {
    if (!item?.unit_id || !Array.isArray(item?.roles)) {
      return
    }

    const roles = item.roles.map((r) => normalizeScopedRole(r)).filter(Boolean)

    // Nếu có Admin hoặc Manager -> cấp quyền Admin context
    if (roles.includes(USER_ROLES.admin)) {
      options.push({ unitId: item.unit_id, role: USER_ROLES.admin })
    } else if (roles.includes(USER_ROLES.manager)) {
      options.push({ unitId: item.unit_id, role: USER_ROLES.manager })
    }

    // Nếu có Staff -> cấp quyền Unit context
    if (roles.includes(USER_ROLES.staff)) {
      options.push({ unitId: item.unit_id, role: USER_ROLES.staff })
    }
  })
  return options
}

export function hasManageAccess(user) {
  return getManageOptionsFromUser(user).length > 0
}

export function getDashboardPathForRole(role) {
  return ROLE_DASHBOARD_PATHS[role] ?? null
}

export function isRoleAllowed(role, allowedRoles = []) {
  return allowedRoles.includes(role)
}

export function canManageUsers(role) {
  return MANAGE_USER_ROLES.includes(role)
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS[USER_ROLES.user]
}
