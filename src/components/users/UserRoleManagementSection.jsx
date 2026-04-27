import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import {
  assignRole,
  getRoles,
  getUserAssignments,
  removeAssignment,
} from '../../service/rbacService'
import { getSemesters } from '../../service/semesterService'
import { getUnits } from '../../service/unitService'
import { formatDateTime, getValidationMessage } from '../../utils/userUtils'
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
  const [assignmentSemesterFilter, setAssignmentSemesterFilter] = useState('')
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
  }, [userId, accessToken, assignmentSemesterFilter])

  async function loadCatalogData() {
    setIsLoading(true)

    try {
      const [nextRoles, unitResponse, semesterResponse] = await Promise.all([
        getRoles(accessToken),
        getUnits({ skip: 0, limit: 100 }),
        getSemesters({ skip: 0, limit: 100 }, accessToken),
      ])

      setRoles(nextRoles)
      setUnits(unitResponse.items)
      setSemesters(semesterResponse.items)
    } catch (error) {
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
        assignmentSemesterFilter || undefined,
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
    <section className="user-role-management">
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

      <div className="user-role-management-header">
        <h4>Quản lý phân quyền</h4>
        <label className="field user-role-filter-field">
          <span>Lọc phân quyền theo học kỳ</span>
          <select
            value={assignmentSemesterFilter}
            onChange={(event) => setAssignmentSemesterFilter(event.target.value)}
          >
            <option value="">Học kỳ hiện hành</option>
            {semesterOptions.map((semesterOption) => (
              <option key={semesterOption.value} value={semesterOption.value}>
                {semesterOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="user-role-assign-form" onSubmit={handleAssignRole}>
        <label className="field">
          <span>Vai trò</span>
          <select
            value={form.role_id}
            onChange={(event) =>
              setForm((currentForm) => ({ ...currentForm, role_id: event.target.value }))
            }
          >
            <option value="">Chọn vai trò</option>
            {roleOptions.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Đơn vị</span>
          <select
            value={form.unit_id}
            onChange={(event) =>
              setForm((currentForm) => ({ ...currentForm, unit_id: event.target.value }))
            }
          >
            <option value="">Chọn đơn vị</option>
            {unitOptions.map((unitOption) => (
              <option key={unitOption.value} value={unitOption.value}>
                {unitOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Học kỳ (tùy chọn)</span>
          <select
            value={form.semester_id}
            onChange={(event) =>
              setForm((currentForm) => ({ ...currentForm, semester_id: event.target.value }))
            }
          >
            <option value="">Dùng học kỳ hiện hành</option>
            {semesterOptions.map((semesterOption) => (
              <option key={semesterOption.value} value={semesterOption.value}>
                {semesterOption.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Đang gán quyền...' : 'Gán quyền'}
        </button>
      </form>

      {isLoading ? (
        <p className="user-muted-copy">Đang tải danh sách phân quyền...</p>
      ) : visibleAssignments.length ? (
        <div className="user-role-assignment-shell">
          <table className="user-role-assignment-table">
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
                      className="danger-button user-role-remove-button"
                      onClick={() => setAssignmentToRemove(assignmentItem)}
                    >
                      Gỡ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className="user-role-assignment-total">Tổng phân quyền: {visibleAssignments.length}</span>
        </div>
      ) : (
        <p className="user-muted-copy">Không có phân quyền nào.</p>
      )}
    </section>
  )
}

export default UserRoleManagementSection
