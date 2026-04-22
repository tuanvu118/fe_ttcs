import {
  Buildings,
  CalendarBlank,
  CalendarDots,
  CaretDown,
  ChartBar,
  Megaphone,
  Users,
  UsersThree,
} from '@phosphor-icons/react'
import { formatUnitType } from '../utils/unitUtils'
import { MANAGE_ADMIN_PANELS, PATHS, USER_ROLES } from '../utils/routes'
import { buildAdminPath, buildStaffPath } from './adminPaths'
import styles from './adminShell.module.css'

const DEFAULT_UNIT_LOGO = '/HuyHieuDoan.png'
const actionIconSize = 20

function unitTypePrefixLabel(type) {
  if (!type || typeof type !== 'string') {
    return ''
  }
  return formatUnitType(type.trim().toUpperCase())
}

function manageRoleOptionLabel(role) {
  if (role === USER_ROLES.admin) return 'Quản trị'
  if (role === USER_ROLES.manager) return 'Thành viên'
  if (role === USER_ROLES.staff) return 'Quản lý đơn vị'
  return role || ''
}

function unitLogoSrc(unitId, unitLogoById, manageableUnits, unitRecord) {
  if (!unitId) {
    return DEFAULT_UNIT_LOGO
  }
  const fromList = manageableUnits.find((u) => u.id === unitId)?.logo?.trim() || ''
  const fromRecord = unitRecord?.id === unitId ? (unitRecord.logo || '').trim() : ''
  const hasDetail = Object.prototype.hasOwnProperty.call(unitLogoById, unitId)
  const fromDetail = hasDetail ? (unitLogoById[unitId] || '').trim() : null
  if (fromDetail) return fromDetail
  if (hasDetail) return fromList || DEFAULT_UNIT_LOGO
  if (fromList) return fromList
  if (fromRecord) return fromRecord
  return DEFAULT_UNIT_LOGO
}

const staffActions = [
  { key: 'members', label: 'Quản lý thành viên', Icon: UsersThree },
  { key: 'reports', label: 'Quản lý báo cáo', Icon: ChartBar },
  { key: 'promotions', label: 'Truyền thông', Icon: Megaphone },
  { key: 'tasks', label: 'Quản lý sự kiện được giao', Icon: CalendarBlank },
]

const adminActions = [
  { panel: MANAGE_ADMIN_PANELS.users, label: 'Quản lý người dùng', Icon: Users },
  { panel: MANAGE_ADMIN_PANELS.units, label: 'Quản lý đơn vị', Icon: Buildings },
  { panel: MANAGE_ADMIN_PANELS.semesters, label: 'Quản lý học kì', Icon: CalendarDots },
  { panel: MANAGE_ADMIN_PANELS.events, label: 'Quản lý sự kiện', Icon: CalendarBlank },
  { panel: MANAGE_ADMIN_PANELS.reports, label: 'Quản lý báo cáo', Icon: ChartBar },
  { panel: MANAGE_ADMIN_PANELS.promotions, label: 'Phê duyệt Tin tức', Icon: Megaphone },
]

export default function AdminSideNav({
  currentPath,
  navigate,
  unitSelectorRef,
  isDropdownOpen,
  setIsDropdownOpen,
  selectedUnitId,
  selectedUnit,
  selectedUnitRole,
  selectedPanel,
  manageableUnits,
  manageOptions,
  isLoadingUnits,
  unitLogoById,
  canRenderSidebar,
  isStaffSelected,
  handleSelectUnit,
}) {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.unitSelector} ref={unitSelectorRef}>
        <button
          type="button"
          className={styles.unitSelectorButton}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          onClick={() => setIsDropdownOpen((currentValue) => !currentValue)}
        >
          <span className={styles.unitSelectorInner}>
            <img
              className={styles.logo}
              src={unitLogoSrc(selectedUnitId, unitLogoById, manageableUnits, selectedUnit)}
              alt=""
              decoding="async"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = DEFAULT_UNIT_LOGO
              }}
            />
            <div className={styles.unitSelectorText}>
              <strong className={styles.unitNameLine}>
                {selectedUnit?.type ? (
                  <span className={styles.unitTypePrefix}>{unitTypePrefixLabel(selectedUnit.type)}</span>
                ) : null}
                <span className={styles.unitNameCore}>
                  {selectedUnit?.name || 'Chọn đơn vị quản trị'}
                </span>
              </strong>
              <span>
                {selectedUnitRole === USER_ROLES.staff
                  ? 'Quản lý đơn vị'
                  : selectedUnitRole === USER_ROLES.manager
                    ? 'Văn phòng Đoàn'
                    : selectedUnitRole === USER_ROLES.admin
                      ? 'Quản trị viên'
                      : 'Vui lòng chọn đơn vị'}
              </span>
            </div>
          </span>
          <span
            className={isDropdownOpen ? `${styles.dropdownArrow} ${styles.dropdownArrowOpen}` : styles.dropdownArrow}
          >
            <CaretDown size={18} weight="bold" aria-hidden />
          </span>
        </button>

        {isDropdownOpen && (
          <div className={styles.unitDropdown}>
            {isLoadingUnits ? (
              <p>Đang tải đơn vị...</p>
            ) : (
              manageOptions.map((optionItem) => {
                const unitItem = manageableUnits.find((managed) => managed.id === optionItem.unitId)
                return (
                  <button
                    key={`${optionItem.unitId}-${optionItem.role}`}
                    type="button"
                    className={
                      optionItem.unitId === selectedUnitId && optionItem.role === selectedUnitRole
                        ? `${styles.unitOption} ${styles.unitOptionActive}`
                        : styles.unitOption
                    }
                    onClick={() => handleSelectUnit(optionItem)}
                  >
                    <img
                      className={`${styles.logo} ${styles.logoDropdown}`}
                      src={unitLogoSrc(optionItem.unitId, unitLogoById, manageableUnits)}
                      alt=""
                      decoding="async"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = DEFAULT_UNIT_LOGO
                      }}
                    />
                    <div className={styles.unitOptionText}>
                      <strong className={styles.unitNameLine}>
                        {unitItem?.type ? (
                          <span className={styles.unitTypePrefix}>
                            {unitTypePrefixLabel(unitItem.type)}
                          </span>
                        ) : null}
                        <span className={styles.unitNameCore}>
                          {unitItem?.name || optionItem.unitId}
                        </span>
                      </strong>
                      <span>{manageRoleOptionLabel(optionItem.role)}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </section>

      {canRenderSidebar && (
        <nav className={styles.actionList} aria-label="Điều hướng quản trị">
          {isStaffSelected
            ? staffActions.map((actionItem) => {
              const ActionIcon = actionItem.Icon
              return (
                <button
                  key={actionItem.key}
                  type="button"
                  className={
                    selectedPanel === actionItem.key
                      ? `${styles.actionButton} ${styles.actionButtonActive}`
                      : styles.actionButton
                  }
                  onClick={() => navigate(buildStaffPath(selectedUnitId, actionItem.key))}
                >
                  <ActionIcon size={actionIconSize} weight="regular" aria-hidden />
                  <span>{actionItem.label}</span>
                </button>
              )
            })
            : adminActions.map((actionItem) => {
              const ActionIcon = actionItem.Icon
              return (
                <button
                  key={actionItem.panel}
                  type="button"
                  className={
                    currentPath.startsWith(PATHS.admin) && selectedPanel === actionItem.panel
                      ? `${styles.actionButton} ${styles.actionButtonActive}`
                      : styles.actionButton
                  }
                  onClick={() => navigate(buildAdminPath(selectedUnitId, actionItem.panel))}
                >
                  <ActionIcon size={actionIconSize} weight="regular" aria-hidden />
                  <span>{actionItem.label}</span>
                </button>
              )
            })}
        </nav>
      )}
    </aside>
  )
}
