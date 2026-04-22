import { useEffect, useState } from 'react'
import { getUnitDetail } from '../../service/unitService'

function UserRoleList({ roles }) {
  const [unitNameById, setUnitNameById] = useState({})

  useEffect(() => {
    let isCancelled = false

    async function loadUnitNames() {
      if (!roles?.length) {
        setUnitNameById({})
        return
      }

      const uniqueUnitIds = [...new Set(roles.map((roleItem) => roleItem.unit_id).filter(Boolean))]

      if (!uniqueUnitIds.length) {
        setUnitNameById({})
        return
      }

      const entries = await Promise.all(
        uniqueUnitIds.map(async (unitId) => {
          try {
            const unitDetail = await getUnitDetail(unitId)
            return [unitId, unitDetail?.name || unitId]
          } catch {
            return [unitId, unitId]
          }
        }),
      )

      if (!isCancelled) {
        setUnitNameById(Object.fromEntries(entries))
      }
    }

    loadUnitNames()

    return () => {
      isCancelled = true
    }
  }, [roles])

  if (!roles?.length) {
    return <p className="user-muted-copy">Không có role</p>
  }

  return (
    <div className="user-role-group">
      {roles.map((roleItem) => (
        <div key={`${roleItem.unit_id}-${roleItem.roles.join('-')}`} className="user-role-card">
          <div className="user-role-badges">
            {roleItem.roles.length ? (
              roleItem.roles.map((roleCode) => (
                <span key={`${roleItem.unit_id}-${roleCode}`} className="user-role-badge">
                  {roleCode}
                </span>
              ))
            ) : (
              <span className="user-role-badge">Không có role</span>
            )}
          </div>
          <span className="user-role-unit">
            — {unitNameById[roleItem.unit_id] || roleItem.unit_id || 'Chưa có đơn vị'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default UserRoleList
