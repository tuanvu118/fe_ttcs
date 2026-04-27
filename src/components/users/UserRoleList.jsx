import { useEffect, useMemo, useState } from 'react'
import { getUnitDetail } from '../../service/unitService'
import { isSystemUnit } from '../../utils/unitUtils'

function UserRoleList({ roles }) {
  const [unitNameById, setUnitNameById] = useState({})
  const [hiddenUnitIds, setHiddenUnitIds] = useState(new Set())
  const [isResolvingUnits, setIsResolvingUnits] = useState(false)

  const visibleRoles = useMemo(
    () => roles?.filter((roleItem) => !hiddenUnitIds.has(roleItem.unit_id)) || [],
    [hiddenUnitIds, roles],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadUnitNames() {
      if (!roles?.length) {
        setUnitNameById({})
        setHiddenUnitIds(new Set())
        setIsResolvingUnits(false)
        return
      }

      const uniqueUnitIds = [...new Set(roles.map((roleItem) => roleItem.unit_id).filter(Boolean))]

      if (!uniqueUnitIds.length) {
        setUnitNameById({})
        setHiddenUnitIds(new Set())
        setIsResolvingUnits(false)
        return
      }

      setIsResolvingUnits(true)

      const entries = await Promise.all(
        uniqueUnitIds.map(async (unitId) => {
          try {
            const unitDetail = await getUnitDetail(unitId)
            return {
              unitId,
              name: unitDetail?.name || unitId,
              isHidden: isSystemUnit(unitDetail),
            }
          } catch {
            return {
              unitId,
              name: unitId,
              isHidden: false,
            }
          }
        }),
      )

      if (!isCancelled) {
        setUnitNameById(Object.fromEntries(entries.map((entry) => [entry.unitId, entry.name])))
        setHiddenUnitIds(
          new Set(entries.filter((entry) => entry.isHidden).map((entry) => entry.unitId)),
        )
        setIsResolvingUnits(false)
      }
    }

    loadUnitNames()

    return () => {
      isCancelled = true
    }
  }, [roles])

  if (roles?.length && isResolvingUnits) {
    return <p className="user-muted-copy">Đang tải quyền đơn vị...</p>
  }

  if (!visibleRoles.length) {
    return <p className="user-muted-copy">Không có quyền đơn vị nào để hiển thị.</p>
  }

  return (
    <div className="user-role-group">
      {visibleRoles.map((roleItem) => (
        <div key={`${roleItem.unit_id}-${roleItem.roles.join('-')}`} className="user-role-card">
          <div className="user-role-badges">
            {roleItem.roles.length ? (
              roleItem.roles.map((roleCode) => (
                <span key={`${roleItem.unit_id}-${roleCode}`} className="user-role-badge">
                  {roleCode}
                </span>
              ))
            ) : (
              <span className="user-role-badge">Không có quyền</span>
            )}
          </div>
          <span className="user-role-unit">
            - {unitNameById[roleItem.unit_id] || roleItem.unit_id || 'Chưa có đơn vị'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default UserRoleList
