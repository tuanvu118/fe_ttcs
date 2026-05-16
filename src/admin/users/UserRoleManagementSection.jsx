import { Badge, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import {
  assignRole,
  getRoles,
  getUserAssignments,
  removeAssignment,
} from '../../service/rbacService'
import { getSemesters } from '../../service/semesterService'
import { getManagedUnits, getUnitById } from '../../service/unitService'

import { formatDateTime, getValidationMessage } from '../../utils/userUtils'
import { getRoleLabelVi } from '../../utils/roleLabelUtils'
import { getDisplayUnitName } from '../../utils/unitLabelUtils'
import styles from './adminUsers.module.css'
import SemesterSelector from '../../components/semesters/SemesterSelector'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import { isSystemUnit } from '../../utils/unitUtils'

const INITIAL_ASSIGN_FORM = {
  role_id: '',
  unit_id: '',
  semester_id: '',
}

function getDisplayRoleLabel(roleCode) {
  return getRoleLabelVi(String(roleCode || 'USER').trim().toLowerCase())
}

const OFFICE_UNIT_LABEL = 'Văn Phòng đoàn'

function UserRoleManagementSection({ 
  userId, 
  accessToken, 
  onError, 
  onRoleChanged 
}) {

  const [roles, setRoles] = useState([])
  const [units, setUnits] = useState([])
  const [semesters, setSemesters] = useState([])
  const [assignments, setAssignments] = useState([])
  const [globalSemester] = useCurrentSemester()
  const [form, setForm] = useState(INITIAL_ASSIGN_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isResolvingNames, setIsResolvingNames] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignmentToRemove, setAssignmentToRemove] = useState(null)
  const visibleUnits = useMemo(
    () => units.filter((unitItem) => !isSystemUnit(unitItem)),
    [units],
  )
  const hiddenUnitIds = useMemo(
    () => new Set(units.filter((unitItem) => isSystemUnit(unitItem)).map((unitItem) => unitItem.id)),
    [units],
  )
  const visibleAssignments = useMemo(
    () => assignments.filter((item) => {
      const roleCode = String(item.role_code || '').trim().toUpperCase()
      // Luôn ẩn quyền USER
      if (roleCode === 'USER') return false
      
      // ADMIN và MANAGER luôn hiển thị
      if (roleCode === 'ADMIN' || roleCode === 'MANAGER') return true
      
      // Các quyền khác (như STAFF) thì kiểm tra xem đơn vị có bị ẩn không
      const isHiddenUnit = hiddenUnitIds.has(item.unit_id)
      return !isHiddenUnit
    }),
    [assignments, hiddenUnitIds],
  )



  const roleOptions = useMemo(
    () => {
      const seenRoleCodes = new Set()
      return roles
        .map((roleItem) => ({ value: roleItem.id, label: getDisplayRoleLabel(roleItem.code) }))
        .filter((roleOption) => {
          if (seenRoleCodes.has(roleOption.label)) {
            return false
          }
          seenRoleCodes.add(roleOption.label)
          return true
        })
    },
    [roles],
  )
  const selectedRoleCode = useMemo(() => {
    const selectedRole = roles.find((roleItem) => roleItem.id === form.role_id)
    return String(selectedRole?.code || '').trim().toUpperCase()
  }, [roles, form.role_id])

  const isOfficeOnlyRole = selectedRoleCode === 'ADMIN' || selectedRoleCode === 'MANAGER'
  const isNonOfficeRole = selectedRoleCode === 'STAFF' || selectedRoleCode === 'USER'

  const unitOptions = useMemo(
    () => {
      const mappedUnits = units.map((unitItem) => {
        const label = getDisplayUnitName(unitItem.name) || unitItem.id
        return {
          value: unitItem.id,
          label,
          isOfficeUnit: label === OFFICE_UNIT_LABEL,
        }
      })

      if (isOfficeOnlyRole) {
        return mappedUnits.filter((item) => item.isOfficeUnit).map(({ value, label }) => ({ value, label }))
      }

      if (isNonOfficeRole) {
        return mappedUnits.filter((item) => !item.isOfficeUnit).map(({ value, label }) => ({ value, label }))
      }

      return mappedUnits.map(({ value, label }) => ({ value, label }))
    },
    [units, isOfficeOnlyRole, isNonOfficeRole],
  )
  const semesterOptions = useMemo(
    () =>
      semesters.map((semesterItem) => ({
        value: semesterItem.id,
        label: semesterItem.name
          ? `${semesterItem.name} (${semesterItem.academic_year})`
          : semesterItem.id,
      })),
    [semesters],
  )
  const getUnitDisplayName = (id, roleCode) => {
    const rc = String(roleCode || '').trim().toUpperCase()
    if (rc === 'ADMIN' || rc === 'MANAGER') return 'Đoàn Thanh Niên'
    
    const targetId = String(id || '')
    
    // Sau đó mới tìm trong state local
    const localUnit = units.find(u => String(u.id) === targetId)
    if (localUnit && localUnit.name && localUnit.name !== localUnit.id) {
      return getDisplayUnitName(localUnit.name)
    }
    
    return targetId || 'N/A'
  }

  const getSemesterDisplayName = (id) => {
    const targetId = String(id || '')
    const sem = semesters.find(s => String(s.id) === targetId)
    if (sem && sem.name) {
      return `${sem.name} (${sem.academic_year})`
    }
    return targetId || 'Học kỳ hiện hành'
  }



  useEffect(() => {
    loadCatalogData()
  }, [userId, accessToken])

  useEffect(() => {
    loadAssignments()
  }, [userId, accessToken, globalSemester?.id])


  useEffect(() => {
    if (!assignments || !accessToken) {
      if (!isLoading) setIsResolvingNames(false)
      return
    }

    async function resolveMissingNames() {
      setIsResolvingNames(true)
      try {
        const missingUnitIds = [...new Set(assignments.map(a => a.unit_id))]
          .filter(id => id && !units.some(u => u.id === id && u.name !== u.id))
        
        if (missingUnitIds.length > 0) {
          const newUnits = await Promise.all(
            missingUnitIds.map(async (id) => {
              try {
                const u = await getUnitById(id, accessToken)
                return { id, name: u.name, type: u.type || 'CLB' }
              } catch {
                return null
              }
            })
          )
          const validNewUnits = newUnits.filter(Boolean)
          if (validNewUnits.length > 0) {
            setUnits(prev => {
              const existingIds = new Set(prev.map(u => u.id))
              const filteredNew = validNewUnits.filter(nu => !existingIds.has(nu.id))
              return [...prev, ...filteredNew]
            })
          }
        }

        const missingSemIds = [...new Set(assignments.map(a => a.semester_id))]
          .filter(id => id && !semesters.some(s => s.id === id))
        
        if (missingSemIds.length > 0) {
          try {
            const resp = await getSemesters({ skip: 0, limit: 100 }, accessToken)
            if (resp?.items) {
              setSemesters(prev => {
                const existingIds = new Set(prev.map(s => s.id))
                const newItems = resp.items.filter(s => !existingIds.has(s.id))
                return [...prev, ...newItems]
              })
            }
          } catch (err) {
            console.error("Failed to fetch missing semesters", err)
          }
        }
      } finally {
        setIsResolvingNames(false)
      }
    }

    resolveMissingNames()
  }, [assignments, accessToken])



  async function loadCatalogData() {
    setIsLoading(true)

    try {
      const nextRoles = await getRoles(accessToken)
      setRoles(nextRoles)

      const unitResponse = await getManagedUnits({ skip: 0, limit: 100 }, accessToken)
      setUnits(unitResponse.items || [])

      const semesterResponse = await getSemesters({ skip: 0, limit: 100 }, accessToken)
      setSemesters(semesterResponse.items || [])
    } catch (error) {
      console.error('Failed to load permission catalog data:', error)
      onError?.(error, 'Không thể tải danh mục phân quyền.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadAssignments() {
    setIsLoading(true)

    try {
      const assignmentResponse = await getUserAssignments(
        userId,
        accessToken,
        globalSemester?.id === 'all' ? undefined : globalSemester?.id,
      )
      const fetchedAssignments = assignmentResponse.items
      setAssignments(fetchedAssignments)


    } catch (error) {
      onError?.(error, 'Không thể tải danh sách phân quyền.')
    } finally {
      setIsLoading(false)
    }
  }


  async function handleAssignRole(event) {
    event.preventDefault()

    if (!form.role_id || !form.unit_id) {
      onError?.({ status: 422 }, 'Vui lòng chọn đầy đủ vai trò và đơn vị trước khi gán quyền.')
      return
    }

    setIsSubmitting(true)

    try {
      await assignRole(
        {
          target_user_id: userId,
          role_id: form.role_id,
          unit_id: form.unit_id,
          semester_id: form.semester_id || null,
        },
        accessToken,
      )
      setForm(INITIAL_ASSIGN_FORM)
      await loadAssignments()
      onRoleChanged?.()
    } catch (error) {
      onError?.(error, getValidationMessage(error, 'Gán quyền thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveAssignment() {
    if (!assignmentToRemove?.id) {
      return
    }

    setIsSubmitting(true)

    try {
      await removeAssignment(assignmentToRemove.id, accessToken, assignmentToRemove.user_id)
      setAssignmentToRemove(null)
      await loadAssignments()
      onRoleChanged?.()
    } catch (error) {
      onError?.(error, 'Gỡ quyền thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isResolvingNames) {
    return (
      <div className={styles.managementSection}>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          Đang tải dữ liệu phân quyền...
        </div>
      </div>
    )
  }

  return (
    <section className={styles.roleManagement}>
      <ConfirmDialog
        isOpen={Boolean(assignmentToRemove)}
        title="Gỡ quyền"
        message={`Bạn có chắc muốn gỡ phân quyền "${getDisplayRoleLabel(assignmentToRemove?.role_code)}" không?`}
        confirmLabel="Gỡ quyền"
        danger
        isSubmitting={isSubmitting}
        onClose={() => setAssignmentToRemove(null)}
        onConfirm={handleRemoveAssignment}
      />

      <div className={styles.roleManagementHeader}>
        <h4>Quản lý phân quyền</h4>
        <div className={styles.roleFilterField}>
          <SemesterSelector 
            allowAll={true} 
            variant="filter" 
            showLabel={false} 
            getPopupContainer={(trigger) => trigger.parentNode} 
          />
        </div>
      </div>

      <form className={styles.roleAssignForm} onSubmit={handleAssignRole}>
        <div className="field">
          <span>Vai trò</span>
          <Select
            className={styles.formSelect}
            value={form.role_id || undefined}
            placeholder="Chọn vai trò"
            onChange={(val) => setForm((f) => ({ ...f, role_id: val, unit_id: '' }))}
            options={roleOptions}
            showSearch
            optionFilterProp="label"
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </div>

        <div className="field">
          <span>Đơn vị</span>
          <Select
            className={styles.formSelect}
            value={form.unit_id || undefined}
            placeholder="Chọn đơn vị"
            onChange={(val) => setForm((f) => ({ ...f, unit_id: val }))}
            options={unitOptions}
            showSearch
            optionFilterProp="label"
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </div>

        <div className="field">
          <span>Học kỳ (tùy chọn)</span>
          <SemesterSelector
            allowAll={true}
            variant="field"
            showLabel={false}
            value={form.semester_id || 'all'}
            onChange={(id) =>
              setForm((currentForm) => ({
                ...currentForm,
                semester_id: id === 'all' ? '' : id,
              }))
            }
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </div>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gán quyền...' : 'Gán quyền'}
        </button>
      </form>

      {visibleAssignments.length ? (
        <div className={styles.assignmentShell}>
          <table className={styles.assignmentTable}>
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Đơn vị</th>
                <th>Học kỳ</th>
                <th>Tạo lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.map((assignmentItem) => (
                <tr key={assignmentItem.id}>
                  <td>
                    <span className="user-role-badge">{getDisplayRoleLabel(assignmentItem.role_code)}</span>
                  </td>
                  <td>
                    {getUnitDisplayName(assignmentItem.unit_id, assignmentItem.role_code)}
                  </td>

                  <td>{getSemesterDisplayName(assignmentItem.semester_id)}</td>


                  <td>{formatDateTime(assignmentItem.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className={`danger-button ${styles.roleRemoveButton}`}
                      onClick={() => setAssignmentToRemove(assignmentItem)}
                    >
                      Gỡ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className={styles.assignmentTotal}>Tổng phân quyền: {visibleAssignments.length}</span>
        </div>
      ) : (
        <p className={styles.mutedCopy}>Không có phân quyền nào.</p>
      )}
    </section>
  )
}

export default UserRoleManagementSection
