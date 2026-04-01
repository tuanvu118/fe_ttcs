import { useEffect, useMemo, useState } from 'react'
import { getManagedUnits } from '../service/unitService'
import {
  PATHS,
  USER_ROLES,
  getManageOptionsFromUser,
  getManageRoleForUnit,
  parseManageQuery,
} from '../utils/routes'

const FETCH_LIMIT = 100

function buildStaffPath(unitId, panel = 'members') {
  const params = new URLSearchParams()
  params.set('unit', unitId)
  params.set('panel', panel)
  return `${PATHS.manageUnits}?${params.toString()}`
}

function buildAdminPath(unitId, nextPath = PATHS.manageAdminUsers) {
  const params = new URLSearchParams()
  params.set('unit', unitId)
  return `${nextPath}?${params.toString()}`
}

function AdminShell({
  currentPath,
  navigate,
  user,
  accessToken,
  search,
  children,
}) {
  const [manageableUnits, setManageableUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const manageOptions = useMemo(() => getManageOptionsFromUser(user), [user])
  const selectedUnitId = parseManageQuery(search).unitId
  const selectedPanel = parseManageQuery(search).panel
  const selectedUnitRole = getManageRoleForUnit(user, selectedUnitId)
  const selectedUnit = manageableUnits.find((unitItem) => unitItem.id === selectedUnitId)
  const canRenderSidebar = Boolean(selectedUnitId && selectedUnitRole)
  const isStaffSelected = selectedUnitRole === USER_ROLES.staff

  useEffect(() => {
    if (!accessToken) {
      setManageableUnits([])
      return
    }

    let isCancelled = false

    async function loadUnits() {
      setIsLoadingUnits(true)

      try {
        const firstResponse = await getManagedUnits({ skip: 0, limit: FETCH_LIMIT }, accessToken)
        const items = [...firstResponse.items]

        let loaded = items.length
        while (loaded < firstResponse.total) {
          const nextResponse = await getManagedUnits({ skip: loaded, limit: FETCH_LIMIT }, accessToken)

          if (!nextResponse.items.length) {
            break
          }

          items.push(...nextResponse.items)
          loaded += nextResponse.items.length
        }

        if (!isCancelled) {
          const allowedUnitIds = new Set(manageOptions.map((optionItem) => optionItem.unitId))
          setManageableUnits(items.filter((item) => allowedUnitIds.has(item.id)))
        }
      } catch {
        if (!isCancelled) {
          setManageableUnits([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingUnits(false)
        }
      }
    }

    loadUnits()

    return () => {
      isCancelled = true
    }
  }, [accessToken, manageOptions])

  useEffect(() => {
    if (!manageOptions.length || !manageableUnits.length) {
      return
    }

    const selectedOption = manageOptions.find((optionItem) => optionItem.unitId === selectedUnitId)

    if (!selectedOption) {
      const defaultOption = manageOptions[0]
      if (defaultOption.role === USER_ROLES.staff) {
        navigate(buildStaffPath(defaultOption.unitId, 'members'))
      } else {
        navigate(buildAdminPath(defaultOption.unitId, PATHS.manageAdminUsers))
      }
    }
  }, [manageOptions, manageableUnits, navigate, selectedUnitId])

  function handleSelectUnit(optionItem) {
    if (optionItem.role === USER_ROLES.staff) {
      navigate(buildStaffPath(optionItem.unitId, 'members'))
    } else {
      navigate(buildAdminPath(optionItem.unitId, PATHS.manageAdminUsers))
    }
    setIsDropdownOpen(false)
  }

  const staffActions = [
    { key: 'members', label: 'Quản lý thành viên' },
    { key: 'reports', label: 'Quản lý báo cáo' },
    { key: 'events', label: 'Quản lý sự kiện được giao' },
  ]

  const adminActions = [
    { key: PATHS.manageAdminUsers, label: 'Quản lý người dùng' },
    { key: PATHS.manageAdminUnits, label: 'Quản lý đơn vị' },
    { key: PATHS.manageAdminSemesters, label: 'Quản lý học kì' },
  ]

  return (
    <section className="admin-shell">
      <aside className="admin-shell-sidebar">
        <section className="admin-shell-unit-selector">
          <button
            type="button"
            className="admin-shell-unit-selector-button"
            onClick={() => setIsDropdownOpen((currentValue) => !currentValue)}
          >
            <div>
              <strong>{selectedUnit?.name || 'Chọn đơn vị quản trị'}</strong>
              <span>
                {selectedUnitRole === USER_ROLES.staff
                  ? 'Nhân sự đơn vị'
                  : selectedUnitRole === USER_ROLES.manager
                    ? 'Quản lý đơn vị'
                    : selectedUnitRole === USER_ROLES.admin
                      ? 'Quản trị đơn vị'
                      : 'Vui lòng chọn đơn vị'}
              </span>
            </div>
            <span className={isDropdownOpen ? 'admin-shell-dropdown-arrow open' : 'admin-shell-dropdown-arrow'}>
              v
            </span>
          </button>

          {isDropdownOpen && (
            <div className="admin-shell-unit-dropdown">
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
                        optionItem.unitId === selectedUnitId
                          ? 'admin-shell-unit-option active'
                          : 'admin-shell-unit-option'
                      }
                      onClick={() => handleSelectUnit(optionItem)}
                    >
                      <strong>{unitItem?.name || optionItem.unitId}</strong>
                      <span>{optionItem.role.toUpperCase()}</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </section>

        {canRenderSidebar && (
          <nav className="admin-shell-action-list" aria-label="Điều hướng quản trị">
            {isStaffSelected
              ? staffActions.map((actionItem) => (
                  <button
                    key={actionItem.key}
                    type="button"
                    className={
                      selectedPanel === actionItem.key
                        ? 'admin-shell-action-button active'
                        : 'admin-shell-action-button'
                    }
                    onClick={() => navigate(buildStaffPath(selectedUnitId, actionItem.key))}
                  >
                    {actionItem.label}
                  </button>
                ))
              : adminActions.map((actionItem) => (
                  <button
                    key={actionItem.key}
                    type="button"
                    className={
                      currentPath === actionItem.key
                        ? 'admin-shell-action-button active'
                        : 'admin-shell-action-button'
                    }
                    onClick={() => navigate(buildAdminPath(selectedUnitId, actionItem.key))}
                  >
                    {actionItem.label}
                  </button>
                ))}
          </nav>
        )}
      </aside>

      <div className="admin-shell-content">
        <main className="admin-shell-main">{children}</main>
      </div>
    </section>
  )
}

export default AdminShell
