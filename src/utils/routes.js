export const PATHS = {
  home: '/',
  event: '/event',
  about: '/about',
  club: '/club',
  login: '/login',
  register: '/register',
  profile: '/profile',
  admin: '/admin',
  manager: '/manager',
  staff: '/staff',
  units: '/units',
  semesters: '/semesters',
  logout: '/logout',
}

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
  [USER_ROLES.manager]: PATHS.manager,
  [USER_ROLES.staff]: PATHS.units,
}

export const UNIT_TYPES = {
  lck: 'LCK',
  clb: 'CLB',
  system: 'SYSTEM',
}

const MANAGE_USER_ROLES = [USER_ROLES.admin, USER_ROLES.manager]
const MANAGE_UNIT_ROLES = [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.staff]
const UNIT_DETAIL_PATTERN = /^\/units\/([^/]+)$/
const CLUB_DETAIL_PATTERN = /^\/club\/([^/]+)$/

export const primaryNavigation = [
  { path: PATHS.home, label: 'Trang chủ' },
  { path: PATHS.event, label: 'Sự kiện' },
  { path: PATHS.about, label: 'Cổng thông tin' },
  { path: PATHS.club, label: 'Câu lạc bộ' },
]

const routeMeta = {
  [PATHS.home]: { title: 'Trang chủ' },
  [PATHS.event]: { title: 'Sự kiện' },
  [PATHS.about]: { title: 'Cổng thông tin' },
  [PATHS.club]: { title: 'Câu lạc bộ' },
  [PATHS.login]: { title: 'Đăng nhập' },
  [PATHS.register]: {
    title: 'Tạo người dùng',
    requiresAuth: true,
    allowedRoles: MANAGE_USER_ROLES,
  },
  [PATHS.profile]: { title: 'Hồ sơ', requiresAuth: true },
  [PATHS.admin]: {
    title: 'Quản trị Admin',
    requiresAuth: true,
    allowedRoles: [USER_ROLES.admin],
  },
  [PATHS.manager]: {
    title: 'Quản trị Manager',
    requiresAuth: true,
    allowedRoles: [USER_ROLES.manager],
  },
  [PATHS.staff]: {
    title: 'Quản trị Staff',
    requiresAuth: true,
    allowedRoles: [USER_ROLES.staff],
  },
  [PATHS.units]: {
    title: 'Đơn vị',
    requiresAuth: true,
    allowedRoles: MANAGE_UNIT_ROLES,
  },
  [PATHS.semesters]: {
    title: 'Học kỳ',
    requiresAuth: true,
  },
  [PATHS.logout]: { title: 'Đăng xuất', requiresAuth: true },
}

export function buildUnitDetailPath(unitId) {
  return `${PATHS.units}/${unitId}`
}

export function buildClubDetailPath(unitId) {
  return `${PATHS.club}/${unitId}`
}

export function getUnitIdFromPath(pathname) {
  const matchedPath = pathname.match(UNIT_DETAIL_PATTERN)
  return matchedPath?.[1] ?? null
}

export function getClubUnitIdFromPath(pathname) {
  const matchedPath = pathname.match(CLUB_DETAIL_PATTERN)
  return matchedPath?.[1] ?? null
}

export function isUnitDetailPath(pathname) {
  return Boolean(getUnitIdFromPath(pathname))
}

export function isClubDetailPath(pathname) {
  return Boolean(getClubUnitIdFromPath(pathname))
}

export function getRouteMeta(pathname) {
  if (routeMeta[pathname]) {
    return routeMeta[pathname]
  }

  if (isUnitDetailPath(pathname)) {
    return {
      title: 'Chi tiết đơn vị',
      requiresAuth: true,
      allowedRoles: MANAGE_UNIT_ROLES,
    }
  }

  if (isClubDetailPath(pathname)) {
    return {
      title: 'Chi tiết câu lạc bộ',
    }
  }

  return null
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
