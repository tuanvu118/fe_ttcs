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
import { getManagedUnits } from '../../service/unitService'
import { formatDateTime, getValidationMessage } from '../../utils/userUtils'
import styles from './adminUsers.module.css'
import SemesterSelector from '../../components/semesters/SemesterSelector'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import { isSystemUnit } from '../../utils/unitUtils'

const INITIAL_ASSIGN_FORM = {
  role_id: '',
  unit_id: '',
  semester_id: '',
}

function UserRoleManagementSection({ userId, accessToken, onError, onRoleChanged }) {
  const [roles, setRoles] = useState([])
  const [units, setUnits] = useState([])
  const [semesters, setSemesters] = useState([])
  const [assignments, setAssignments] = useState([])
  const [globalSemester] = useCurrentSemester()
  const [form, setForm] = useState(INITIAL_ASSIGN_FORM)
  const [isLoading, setIsLoading] = useState(true)
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
    () => assignments.filter((assignmentItem) => !hiddenUnitIds.has(assignmentItem.unit_id)),
    [assignments, hiddenUnitIds],
  )

  const roleOptions = useMemo(
    () => {
      const seenRoleCodes = new Set()
      return roles
        .map((roleItem) => ({ value: roleItem.id, label: roleItem.code }))
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
  const unitOptions = useMemo(
    () => visibleUnits.map((unitItem) => ({ value: unitItem.id, label: unitItem.name || unitItem.id })),
    [visibleUnits],
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
  const unitNameById = useMemo(
    () => Object.fromEntries(visibleUnits.map((unitItem) => [unitItem.id, unitItem.name || unitItem.id])),
    [visibleUnits],
  )
  const semesterNameById = useMemo(
    () =>
      Object.fromEntries(
        semesters.map((semesterItem) => [
          semesterItem.id,
          semesterItem.name
            ? `${semesterItem.name} (${semesterItem.academic_year})`
            : semesterItem.id,
        ]),
      ),
    [semesters],
  )

  useEffect(() => {
    loadCatalogData()
  }, [userId, accessToken])

  useEffect(() => {
    loadAssignments()
  }, [userId, accessToken, globalSemester?.id])

  async function loadCatalogData() {
    setIsLoading(true)

    try {
      // Fetch roles
      const nextRoles = await getRoles(accessToken)
      setRoles(nextRoles)

      // Fetch units with auth
      const unitResponse = await getManagedUnits({ skip: 0, limit: 100 }, accessToken)
      setUnits(unitResponse.items)

      // Fetch semesters for table display
      const semesterResponse = await getSemesters({ skip: 0, limit: 100 }, accessToken)
      setSemesters(semesterResponse.items)
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
      setAssignments(assignmentResponse.items)
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
      await removeAssignment(assignmentToRemove.id, accessToken)
      setAssignmentToRemove(null)
      await loadAssignments()
      onRoleChanged?.()
    } catch (error) {
      onError?.(error, 'Gỡ quyền thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.roleManagement}>
      <ConfirmDialog
        isOpen={Boolean(assignmentToRemove)}
        title="Gỡ quyền"
        message={`Bạn có chắc muốn gỡ phân quyền "${assignmentToRemove?.role_code || ''}" không?`}
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
            onChange={(val) => setForm((f) => ({ ...f, role_id: val }))}
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

      {isLoading ? (
        <p className={styles.mutedCopy}>Đang tải danh sách phân quyền...</p>
      ) : visibleAssignments.length ? (
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
                    <span className="user-role-badge">{assignmentItem.role_code || 'USER'}</span>
                  </td>
                  <td>{unitNameById[assignmentItem.unit_id] || 'Chưa cập nhật'}</td>
                  <td>{semesterNameById[assignmentItem.semester_id] || 'Học kỳ hiện hành'}</td>
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
