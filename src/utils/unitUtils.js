import { UNIT_TYPES, USER_ROLES } from './routes'

const UNIT_TYPE_LABELS = {
  [UNIT_TYPES.lck]: 'Liên chi đoàn',
  [UNIT_TYPES.clb]: 'Câu lạc bộ',
  [UNIT_TYPES.system]: 'Hệ thống',
}

export const unitTypeOptions = Object.values(UNIT_TYPES).filter(
  (type) => type !== UNIT_TYPES.system,
)

export function formatUnitType(type) {
  return UNIT_TYPE_LABELS[type] || 'Chưa cập nhật'
}

export function getUnitInitials(name) {
  if (!name) {
    return 'DV'
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function getSearchableUnitText(unit) {
  return [unit?.name, unit?.type, unit?.introduction].filter(Boolean).join(' ').toLowerCase()
}

export function getUnitIntroduction(unit) {
  return unit?.introduction?.trim() || 'Chưa có thông tin giới thiệu'
}

export function isSystemUnit(unit) {
  const normalizedType = String(unit?.type || '').trim().toUpperCase()
  const normalizedName = String(unit?.name || '').trim().toUpperCase()

  return normalizedType === UNIT_TYPES.system || normalizedName === 'DEFAULT'
}

export function isPublicVisibleUnit(unit) {
  return !isSystemUnit(unit)
}

export function isStaffOfUnit(user, unitId) {
  return Boolean(
    user?.roles?.some(
      (roleItem) =>
        roleItem?.unit_id === unitId &&
        Array.isArray(roleItem?.roles) &&
        roleItem.roles.some((roleName) => String(roleName).trim().toUpperCase() === 'STAFF'),
    ),
  )
}

export function canManageUnitMembers(role, user, unitId) {
  if (role === USER_ROLES.admin || role === USER_ROLES.manager) {
    return true
  }

  if (role === USER_ROLES.staff) {
    return isStaffOfUnit(user, unitId)
  }

  return false
}

export function canViewUnitMembers(role, user, unitId) {
  return canManageUnitMembers(role, user, unitId)
}

export function formatJoinedAt(value) {
  if (!value) {
    return 'Chưa cập nhật'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Chưa cập nhật'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}
