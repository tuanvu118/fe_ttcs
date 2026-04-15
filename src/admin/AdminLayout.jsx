import { useEffect, useMemo, useRef, useState } from 'react'
import { getManagedUnits, getUnitById } from '../service/unitService'
import { MANAGE_ADMIN_PANELS, PATHS, USER_ROLES, getManageOptionsFromUser, getManageRoleForUnit } from '../utils/routes'
import AdminSideNav from './AdminSideNav'
import { buildAdminPath, buildStaffPath, parseAdminPath } from './adminPaths'
import styles from './adminShell.module.css'

const FETCH_LIMIT = 100

export default function AdminLayout({ currentPath, navigate, user, accessToken, children }) {
  const [manageableUnits, setManageableUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [unitLogoById, setUnitLogoById] = useState({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const unitSelectorRef = useRef(null)
  const manageOptions = useMemo(() => getManageOptionsFromUser(user), [user])
  const managedUnitIdsKey = useMemo(() => {
    const ids = [...new Set(manageOptions.map((o) => o.unitId))].filter(Boolean)
    ids.sort()
    return ids.join('|')
  }, [manageOptions])
  const { unitId: selectedUnitId, panel: selectedPanelRaw } = parseAdminPath(currentPath)
  const isUnitContext = currentPath.startsWith('/unit/')
  const selectedUnitRole = isUnitContext
    ? USER_ROLES.staff
    : getManageRoleForUnit(user, selectedUnitId)
  const selectedPanel =
    selectedPanelRaw || (isUnitContext ? 'members' : MANAGE_ADMIN_PANELS.users)
  const selectedUnit = manageableUnits.find((unitItem) => unitItem.id === selectedUnitId)
  const canRenderSidebar = Boolean(selectedUnitId && selectedUnitRole)
  const isStaffSelected = isUnitContext

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
    if (!accessToken || !managedUnitIdsKey) {
      setUnitLogoById({})
      return
    }

    const ids = managedUnitIdsKey.split('|').filter(Boolean)
    let isCancelled = false

    async function loadLogos() {
      const entries = await Promise.all(
        ids.map(async (unitId) => {
          try {
            const unit = await getUnitById(unitId, accessToken)
            return [unitId, unit.logo || '']
          } catch {
            return [unitId, '']
          }
        }),
      )

      if (!isCancelled) {
        setUnitLogoById(Object.fromEntries(entries))
      }
    }

    loadLogos()

    return () => {
      isCancelled = true
    }
  }, [accessToken, managedUnitIdsKey])

  useEffect(() => {
    if (!manageOptions.length || !manageableUnits.length) {
      return
    }

    if (currentPath === PATHS.admin) {
      const defaultOption = manageOptions[0]
      if (defaultOption.role === USER_ROLES.staff) {
        navigate(buildStaffPath(defaultOption.unitId, 'members'))
      } else {
        navigate(buildAdminPath(defaultOption.unitId, MANAGE_ADMIN_PANELS.users))
      }
      return
    }

    const selectedOption = manageOptions.find((optionItem) => optionItem.unitId === selectedUnitId)
    if (!selectedOption) {
      const defaultOption = manageOptions[0]
      if (defaultOption.role === USER_ROLES.staff) {
        navigate(buildStaffPath(defaultOption.unitId, 'members'))
      } else {
        navigate(buildAdminPath(defaultOption.unitId, MANAGE_ADMIN_PANELS.users))
      }
    }
  }, [currentPath, manageOptions, manageableUnits, navigate, selectedUnitId])

  useEffect(() => {
    if (!isDropdownOpen) {
      return
    }

    function handlePointerDown(event) {
      if (unitSelectorRef.current && !unitSelectorRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isDropdownOpen])

  function handleSelectUnit(optionItem) {
    if (optionItem.role === USER_ROLES.staff) {
      navigate(buildStaffPath(optionItem.unitId, 'members'))
    } else {
      navigate(buildAdminPath(optionItem.unitId, MANAGE_ADMIN_PANELS.users))
    }
    setIsDropdownOpen(false)
  }

  return (
    <section className={styles.shell}>
      <AdminSideNav
        currentPath={currentPath}
        navigate={navigate}
        unitSelectorRef={unitSelectorRef}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        selectedUnitId={selectedUnitId}
        selectedUnit={selectedUnit}
        selectedUnitRole={selectedUnitRole}
        selectedPanel={selectedPanel}
        manageableUnits={manageableUnits}
        manageOptions={manageOptions}
        isLoadingUnits={isLoadingUnits}
        unitLogoById={unitLogoById}
        canRenderSidebar={canRenderSidebar}
        isStaffSelected={isStaffSelected}
        handleSelectUnit={handleSelectUnit}
      />
      <div className={styles.content}>
        <main className={styles.main}>{children}</main>
      </div>
    </section>
  )
}
