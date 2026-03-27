import { useEffect, useMemo, useState } from 'react'
import { getManagedUnits } from '../service/unitService'
import { PATHS, USER_ROLES } from '../utils/routes'
import UnitLogo from './units/UnitLogo'

const STAFF_FETCH_LIMIT = 100

function IconBox({ icon }) {
  return <span className="admin-shell-icon-box">{icon}</span>
}

function renderIcon(type) {
  switch (type) {
    case 'users':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 18.5a4 4 0 0 1 8 0v1h-8v-1Zm9 1v-.75a3.5 3.5 0 0 1 6.77-1.28c.15.37.23.77.23 1.18v.85h-7Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'units':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 9.5 12 5l8 4.5v9L12 23l-8-4.5v-9Zm8 2.5v11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 10 12 14l7.5-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'semesters':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 3v3M17 3v3M5 8h14M6 5h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function getStaffUnitIds(user) {
  return [
    ...new Set(
      (user?.roles || [])
        .filter(
          (roleItem) =>
            roleItem?.unit_id &&
            Array.isArray(roleItem?.roles) &&
            roleItem.roles.some(
              (roleName) => String(roleName).trim().toUpperCase() === 'STAFF',
            ),
        )
        .map((roleItem) => roleItem.unit_id),
    ),
  ]
}

function buildStaffPath(unitId, panel) {
  const params = new URLSearchParams()

  if (unitId) {
    params.set('unit', unitId)
  }

  params.set('panel', panel === 'overview' ? 'overview' : 'members')
  const query = params.toString()

  return query ? `${PATHS.units}?${query}` : PATHS.units
}

function AdminShell({
  currentPath,
  dashboardPath,
  navigate,
  role,
  user,
  accessToken,
  search,
  children,
}) {
  const canManageUsers = role === USER_ROLES.admin || role === USER_ROLES.manager
  const canManageSemesters = role === USER_ROLES.admin || role === USER_ROLES.manager
  const canManageUnits =
    role === USER_ROLES.admin || role === USER_ROLES.manager || role === USER_ROLES.staff
  const isStaffOnUnits = role === USER_ROLES.staff && currentPath === PATHS.units
  const staffUnitIds = useMemo(() => getStaffUnitIds(user), [user])
  const [staffUnits, setStaffUnits] = useState([])
  const [isLoadingStaffUnits, setIsLoadingStaffUnits] = useState(false)

  const selectedUnitId = useMemo(() => {
    const params = new URLSearchParams(search || '')
    return params.get('unit') || ''
  }, [search])

  const activePanel = useMemo(() => {
    const params = new URLSearchParams(search || '')
    return params.get('panel') === 'overview' ? 'overview' : 'members'
  }, [search])

  const menuItems = [
    {
      key: 'dashboard',
      path: dashboardPath,
      label: 'Quản lý người dùng',
      description: 'Danh sách tài khoản hệ thống',
      icon: 'users',
      isVisible: Boolean(dashboardPath) && canManageUsers,
    },
    {
      key: 'units',
      path: PATHS.units,
      label: 'Quản lý đơn vị',
      description: 'Danh sách đơn vị và CLB',
      icon: 'units',
      isVisible: canManageUnits,
    },
    {
      key: 'semesters',
      path: PATHS.semesters,
      label: 'Quản lý học kỳ',
      description: 'Cấu hình học kỳ hiện hành',
      icon: 'semesters',
      isVisible: canManageSemesters,
    },
  ].filter((item) => item.isVisible)

  useEffect(() => {
    if (!isStaffOnUnits) {
      return
    }

    let isCancelled = false

    async function loadStaffUnits() {
      setIsLoadingStaffUnits(true)

      try {
        const firstResponse = await getManagedUnits(
          { skip: 0, limit: STAFF_FETCH_LIMIT },
          accessToken,
        )
        const items = [...firstResponse.items]

        let loaded = items.length
        while (loaded < firstResponse.total) {
          const nextResponse = await getManagedUnits(
            { skip: loaded, limit: STAFF_FETCH_LIMIT },
            accessToken,
          )

          if (!nextResponse.items.length) {
            break
          }

          items.push(...nextResponse.items)
          loaded += nextResponse.items.length
        }

        if (!isCancelled) {
          setStaffUnits(items.filter((item) => staffUnitIds.includes(item.id)))
        }
      } catch {
        if (!isCancelled) {
          setStaffUnits([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStaffUnits(false)
        }
      }
    }

    loadStaffUnits()

    return () => {
      isCancelled = true
    }
  }, [isStaffOnUnits, accessToken, staffUnitIds.join('|')])

  useEffect(() => {
    if (!isStaffOnUnits || isLoadingStaffUnits || !staffUnits.length) {
      return
    }

    if (!selectedUnitId || !staffUnits.some((unitItem) => unitItem.id === selectedUnitId)) {
      navigate(buildStaffPath(staffUnits[0].id, activePanel))
    }
  }, [isStaffOnUnits, isLoadingStaffUnits, staffUnits, selectedUnitId, activePanel, navigate])

  return (
    <section className="admin-shell">
      <aside className="admin-shell-sidebar">
        <nav className="admin-shell-menu" aria-label="Điều hướng quản trị">
          {menuItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path === PATHS.units && currentPath.startsWith(`${PATHS.units}/`))

            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? 'admin-shell-menu-item active' : 'admin-shell-menu-item'}
                onClick={() => navigate(item.path)}
              >
                <IconBox icon={renderIcon(item.icon)} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {isStaffOnUnits && (
          <section className="admin-shell-staff-panel">
            <h4>Không gian đơn vị</h4>

            {isLoadingStaffUnits ? (
              <p>Đang tải đơn vị...</p>
            ) : staffUnits.length ? (
              <div className="admin-shell-staff-unit-list">
                {staffUnits.map((unitItem) => (
                  <button
                    key={unitItem.id}
                    type="button"
                    className={
                      selectedUnitId === unitItem.id
                        ? 'admin-shell-staff-unit active'
                        : 'admin-shell-staff-unit'
                    }
                    onClick={() => navigate(buildStaffPath(unitItem.id, activePanel))}
                  >
                    <UnitLogo logo={unitItem.logo} name={unitItem.name} size="small" />
                    <div>
                      <strong>{unitItem.name || 'Chưa cập nhật'}</strong>
                      <span>{unitItem.type || 'Đơn vị'}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p>Chưa có đơn vị được phân công.</p>
            )}

            {selectedUnitId ? (
              <div className="admin-shell-staff-action-list">
                <button
                  type="button"
                  className={
                    activePanel === 'members'
                      ? 'admin-shell-staff-action active'
                      : 'admin-shell-staff-action'
                  }
                  onClick={() => navigate(buildStaffPath(selectedUnitId, 'members'))}
                >
                  Quản lý thành viên
                </button>
              </div>
            ) : null}
          </section>
        )}
      </aside>

      <div className="admin-shell-content">
        <main className="admin-shell-main">{children}</main>
      </div>
    </section>
  )
}

export default AdminShell
