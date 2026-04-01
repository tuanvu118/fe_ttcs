export const PATHS = {
  home: '/',
  event: '/event',
  about: '/about',
  club: '/club',
  login: '/login',
  register: '/register',
  profile: '/profile',
  manage: '/manage',
  manageUnits: '/manage/units',
  manageAdmin: '/manage/admin',
  manageAdminUnits: '/manage/admin/units',
  manageAdminUsers: '/manage/admin/user',
  manageAdminSemesters: '/manage/admin/semester',
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
  [USER_ROLES.admin]: PATHS.manage,
  [USER_ROLES.manager]: PATHS.manage,
  [USER_ROLES.staff]: PATHS.manage,
}

export const UNIT_TYPES = {
  lck: 'LCK',
  clb: 'CLB',
  system: 'SYSTEM',
}

const MANAGE_USER_ROLES = [USER_ROLES.admin, USER_ROLES.manager]
const MANAGE_UNIT_ROLES = [USER_ROLES.admin, USER_ROLES.manager, USER_ROLES.staff]
const MANAGE_PATHS = new Set([
  PATHS.manage,
  PATHS.manageUnits,
  PATHS.manageAdmin,
  PATHS.manageAdminUnits,
  PATHS.manageAdminUsers,
  PATHS.manageAdminSemesters,
])
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
  [PATHS.manageAdminUsers]: {
    title: 'Quản lý người dùng',
    requiresAuth: true,
  },
  [PATHS.manageAdminUnits]: {
    title: 'Quản lý đơn vị',
    requiresAuth: true,
  },
  [PATHS.manageAdminSemesters]: {
    title: 'Quản lý học kỳ',
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

export function isManagePath(pathname) {
  return MANAGE_PATHS.has(pathname)
}

export function parseManageQuery(search = '') {
  const params = new URLSearchParams(search || '')
  return {
    unitId: params.get('unit') || '',
    panel: params.get('panel') || 'members',
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

  const roleItem = (user?.roles || []).find((item) => item?.unit_id === unitId)
  return getHighestManageRole(roleItem?.roles || [])
}

export function getManageOptionsFromUser(user) {
  return (user?.roles || [])
    .map((item) => {
      if (!item?.unit_id || !Array.isArray(item?.roles)) {
        return null
      }

      const manageRole = getHighestManageRole(item.roles)
      if (!manageRole) {
        return null
      }

      return { unitId: item.unit_id, role: manageRole }
    })
    .filter(Boolean)
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
