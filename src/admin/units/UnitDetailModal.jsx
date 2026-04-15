import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import NotificationPopup from '../../components/NotificationPopup'
import UserAvatar from '../../components/users/UserAvatar'
import UnitFormModal from '../../components/units/UnitFormModal'
import UnitLogo from '../../components/units/UnitLogo'
import UnitMemberModal from '../../components/units/UnitMemberModal'
import UnitTypeBadge from '../../components/units/UnitTypeBadge'
import {
  addUnitMember,
  deleteUnit,
  getUnitById,
  getUnitMembers,
  removeUnitMember,
  updateUnit,
} from '../../service/unitService'
import { USER_ROLES } from '../../utils/routes'
import { getValidationMessage } from '../../utils/userUtils'
import {
  canManageUnitMembers,
  canViewUnitMembers,
  formatJoinedAt,
  getUnitIntroduction,
} from '../../utils/unitUtils'
import styles from './adminUnits.module.css'

const DEFAULT_MEMBER_LIMIT = 10

function UnitDetailModal({
  unitId,
  accessToken,
  role,
  roleLabel,
  user,
  onClose,
  onSessionExpired,
  onUnitDeleted,
}) {
  const [unit, setUnit] = useState(null)
  const [membersResult, setMembersResult] = useState({
    items: [],
    total: 0,
    skip: 0,
    limit: DEFAULT_MEMBER_LIMIT,
  })
  const [memberFilters, setMemberFilters] = useState({
    full_name: '',
    email: '',
    student_id: '',
    class_name: '',
  })
  const [memberQuery, setMemberQuery] = useState({
    skip: 0,
    limit: DEFAULT_MEMBER_LIMIT,
    full_name: '',
    email: '',
    student_id: '',
    class_name: '',
  })
  const [isLoadingUnit, setIsLoadingUnit] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const isAdmin = role === USER_ROLES.admin
  const canManageMembers = canManageUnitMembers(role, user, unitId)
  const canViewMembers = canViewUnitMembers(role, user, unitId)
  const canEditUnit = isAdmin
  const canDeleteUnit = isAdmin

  const memberCurrentPage = Math.floor(membersResult.skip / Math.max(membersResult.limit, 1)) + 1
  const memberTotalPages = Math.max(
    Math.ceil(membersResult.total / Math.max(membersResult.limit, 1)),
    1,
  )
  const canGoPreviousMembers = membersResult.skip > 0
  const canGoNextMembers = membersResult.skip + membersResult.limit < membersResult.total

  useEffect(() => {
    if (!unitId) {
      return
    }
    loadUnit()
  }, [accessToken, unitId])

  useEffect(() => {
    if (!unitId) {
      return
    }

    if (!canViewMembers) {
      setMembersResult({
        items: [],
        total: 0,
        skip: 0,
        limit: DEFAULT_MEMBER_LIMIT,
      })
      return
    }

    loadMembers(memberQuery)
  }, [accessToken, canViewMembers, memberQuery, unitId])

  async function loadUnit() {
    setIsLoadingUnit(true)
    try {
      const nextUnit = await getUnitById(unitId, accessToken)
      setUnit(nextUnit)
    } catch (error) {
      handleApiError(error, 'Không thể tải chi tiết đơn vị.', true)
    } finally {
      setIsLoadingUnit(false)
    }
  }

  async function loadMembers(params) {
    setIsLoadingMembers(true)
    try {
      const response = await getUnitMembers(unitId, params, accessToken)
      setMembersResult({
        items: response.items,
        total: response.total,
        skip: response.skip,
        limit: response.limit || DEFAULT_MEMBER_LIMIT,
      })
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách thành viên.')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  async function handleEditUnit(form) {
    setIsSubmitting(true)
    try {
      const nextUnit = await updateUnit(unitId, form, accessToken)
      setUnit(nextUnit)
      setIsEditOpen(false)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật đơn vị thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUnit() {
    setIsSubmitting(true)
    try {
      await deleteUnit(unitId, accessToken)
      setIsDeleteOpen(false)
      onUnitDeleted?.(unitId)
      onClose()
    } catch (error) {
      handleApiError(error, 'Xóa đơn vị thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddMember(form) {
    setIsSubmitting(true)
    try {
      await addUnitMember(unitId, form, accessToken)
      setIsAddMemberOpen(false)
      const nextQuery = { ...memberQuery, skip: 0 }
      setMemberQuery(nextQuery)
      await loadMembers(nextQuery)
    } catch (error) {
      const detailPayload = error?.payload?.detail
      const detailText = Array.isArray(detailPayload)
        ? detailPayload.map((item) => item?.msg || '').join(' ')
        : String(detailPayload || '')
      const errorText = `${error?.message || ''} ${detailText}`.toUpperCase()
      const isActiveSemesterMissing =
        errorText.includes('ACTIVE_SEMESTER_NOT_FOUND') || errorText.includes('ACTIVE SEMESTER')
      const isAlreadyInUnit =
        errorText.includes('ALREADY') ||
        errorText.includes('EXIST') ||
        errorText.includes('IN UNIT') ||
        errorText.includes('DUPLICATE')

      if (error?.status === 403) {
        setNotice({
          title: 'Không có quyền',
          message: 'Bạn không có quyền thực hiện thao tác này',
        })
        return
      }

      if (error?.status === 404 && isActiveSemesterMissing) {
        setNotice({
          title: 'Chưa có kỳ hoạt động',
          message: 'Hiện chưa có kỳ đang hoạt động',
        })
        return
      }

      if (error?.status === 404) {
        setNotice({
          title: 'Không tìm thấy sinh viên',
          message: 'Không tìm thấy sinh viên với mã này',
        })
        return
      }

      if (error?.status === 400 && isAlreadyInUnit) {
        setNotice({
          title: 'Thành viên đã tồn tại',
          message: 'Sinh viên đã thuộc đơn vị trong kỳ hiện tại',
        })
        return
      }

      handleApiError(error, getValidationMessage(error, 'Thêm thành viên thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove?.user_id) {
      return
    }

    setIsSubmitting(true)
    try {
      await removeUnitMember(
        unitId,
        memberToRemove.user_id,
        accessToken,
        memberToRemove.semester_id || undefined,
      )
      setMemberToRemove(null)

      const fallbackSkip =
        membersResult.items.length <= 1 && memberQuery.skip > 0
          ? Math.max(memberQuery.skip - memberQuery.limit, 0)
          : memberQuery.skip

      const nextQuery = { ...memberQuery, skip: fallbackSkip }
      setMemberQuery(nextQuery)
      await loadMembers(nextQuery)
    } catch (error) {
      handleApiError(error, 'Xóa thành viên khỏi đơn vị thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleApiError(error, fallbackMessage, shouldCloseAfterNotice = false) {
    if (error?.status === 401) {
      setNotice({
        title: 'Phiên đăng nhập hết hạn',
        message: 'Vui lòng đăng nhập lại để tiếp tục.',
        onClose: onSessionExpired,
      })
      return
    }

    if (error?.status === 403) {
      setNotice({
        title: 'Không có quyền',
        message: 'Bạn không có quyền thực hiện thao tác này.',
      })
      return
    }

    if (error?.status === 404) {
      setNotice({
        title: 'Không tìm thấy dữ liệu',
        message: 'Đơn vị hoặc người dùng bạn cần thao tác không tồn tại.',
        onClose: shouldCloseAfterNotice ? onClose : undefined,
      })
      return
    }

    if (error?.status === 400 || error?.status === 422) {
      setNotice({
        title: 'Dữ liệu chưa hợp lệ',
        message: getValidationMessage(error, fallbackMessage),
      })
      return
    }

    setNotice({
      title: 'Có lỗi xảy ra',
      message: fallbackMessage || error?.message || 'Yêu cầu thất bại.',
    })
  }

  function handleMemberFilterSubmit(event) {
    event.preventDefault()
    setMemberQuery((currentQuery) => ({
      ...currentQuery,
      skip: 0,
      full_name: memberFilters.full_name.trim(),
      email: memberFilters.email.trim(),
      student_id: memberFilters.student_id.trim(),
      class_name: memberFilters.class_name.trim(),
    }))
  }

  function handleResetMemberFilters() {
    const emptyFilters = {
      full_name: '',
      email: '',
      student_id: '',
      class_name: '',
    }
    setMemberFilters(emptyFilters)
    setMemberQuery({
      skip: 0,
      limit: DEFAULT_MEMBER_LIMIT,
      ...emptyFilters,
    })
  }

  function handleMemberPageChange(direction) {
    const nextSkip =
      direction === 'next'
        ? memberQuery.skip + memberQuery.limit
        : Math.max(memberQuery.skip - memberQuery.limit, 0)
    setMemberQuery((currentQuery) => ({ ...currentQuery, skip: nextSkip }))
  }

  return (
    <div className={styles.detailModalBackdrop} role="presentation" onClick={onClose}>
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => {
          const callback = notice?.onClose
          setNotice(null)
          callback?.()
        }}
      />

      <UnitFormModal
        isOpen={isEditOpen}
        mode="edit"
        title="Cập nhật đơn vị"
        submitLabel="Lưu thay đổi"
        initialValues={unit}
        isSubmitting={isSubmitting}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditUnit}
      />

      <UnitMemberModal
        isOpen={isAddMemberOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMember}
      />

      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        title="Xóa thành viên khỏi đơn vị"
        message={`Bạn có chắc muốn xóa "${memberToRemove?.full_name || ''}" khỏi đơn vị này không?`}
        confirmLabel="Xóa thành viên"
        danger
        isSubmitting={isSubmitting}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Xóa đơn vị"
        message={`Bạn có chắc muốn xóa đơn vị "${unit?.name || ''}" không?`}
        confirmLabel="Xóa đơn vị"
        danger
        isSubmitting={isSubmitting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteUnit}
      />

      <section
        className={styles.detailModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.detailModalHeader}>
          <h2 id="unit-detail-modal-title">Chi tiết đơn vị</h2>
          <button
            type="button"
            className="notification-popup-close"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn vị"
          >
            ×
          </button>
        </header>

        <div className={styles.detailModalBody}>
          {isLoadingUnit ? (
            <section className="page-card">Đang tải chi tiết đơn vị...</section>
          ) : !unit?.id ? (
            <section className="page-card unit-empty-state">
              <h2>Không tìm thấy đơn vị</h2>
              <p>Đơn vị không tồn tại hoặc đã bị xóa.</p>
            </section>
          ) : (
            <>
              <div className="page-card unit-detail-hero-card">
                <div className="unit-detail-hero">
                  <UnitLogo logo={unit.logo} name={unit.name} size="large" />
                  <div className="unit-detail-copy">
                    <span className="dashboard-badge">{roleLabel}</span>
                    <h1>{unit.name || 'Chưa cập nhật'}</h1>
                    <div className="unit-detail-meta">
                      <UnitTypeBadge type={unit.type} />
                    </div>
                    <p>{getUnitIntroduction(unit)}</p>
                  </div>
                </div>

                {(canEditUnit || canDeleteUnit) && (
                  <div className="unit-detail-actions">
                    {canEditUnit && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setIsEditOpen(true)}
                      >
                        Chỉnh sửa đơn vị
                      </button>
                    )}
                    {canDeleteUnit && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        Xóa đơn vị
                      </button>
                    )}
                  </div>
                )}
              </div>

              {canViewMembers ? (
                <section className="page-card unit-members-card">
                  <div className="unit-members-header">
                    <div>
                      <h2>Danh sách thành viên đơn vị</h2>
                      <p>Đang dùng học kỳ active của backend.</p>
                    </div>
                    {canManageMembers && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setIsAddMemberOpen(true)}
                      >
                        Thêm thành viên
                      </button>
                    )}
                  </div>

                  <form className="unit-member-filter-grid" onSubmit={handleMemberFilterSubmit}>
                    <label className="field">
                      <span>Họ tên</span>
                      <input
                        type="text"
                        value={memberFilters.full_name}
                        onChange={(event) =>
                          setMemberFilters((current) => ({
                            ...current,
                            full_name: event.target.value,
                          }))
                        }
                        placeholder="Lọc theo họ tên"
                      />
                    </label>

                    <label className="field">
                      <span>Email</span>
                      <input
                        type="text"
                        value={memberFilters.email}
                        onChange={(event) =>
                          setMemberFilters((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="Lọc theo email"
                      />
                    </label>

                    <label className="field">
                      <span>Mã sinh viên</span>
                      <input
                        type="text"
                        value={memberFilters.student_id}
                        onChange={(event) =>
                          setMemberFilters((current) => ({
                            ...current,
                            student_id: event.target.value,
                          }))
                        }
                        placeholder="Lọc theo mã sinh viên"
                      />
                    </label>

                    <label className="field">
                      <span>Lớp</span>
                      <input
                        type="text"
                        value={memberFilters.class_name}
                        onChange={(event) =>
                          setMemberFilters((current) => ({
                            ...current,
                            class_name: event.target.value,
                          }))
                        }
                        placeholder="Lọc theo lớp"
                      />
                    </label>

                    <div className="unit-member-filter-actions">
                      <button type="submit" className="secondary-button">
                        Áp dụng
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleResetMemberFilters}
                      >
                        Xóa lọc
                      </button>
                    </div>
                  </form>

                  {isLoadingMembers ? (
                    <p>Đang tải danh sách thành viên...</p>
                  ) : membersResult.items.length ? (
                    <div className="unit-member-table-shell">
                      <table className="unit-member-table">
                        <thead>
                          <tr>
                            <th>Thành viên</th>
                            <th>Mã sinh viên</th>
                            <th>Lớp</th>
                            <th>Semester ID</th>
                            <th>Tham gia lúc</th>
                            {canManageMembers && <th>Thao tác</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {membersResult.items.map((member) => (
                            <tr key={`${member.user_id}-${member.semester_id}`}>
                              <td>
                                <div className="unit-member-name">
                                  <UserAvatar
                                    avatarUrl={member.avatar_url}
                                    fullName={member.full_name}
                                    size="small"
                                  />
                                  <div>
                                    <strong>{member.full_name || 'Chưa cập nhật'}</strong>
                                    <span>{member.email || 'Chưa cập nhật'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{member.student_id || 'Chưa cập nhật'}</td>
                              <td>{member.class_name || 'Chưa cập nhật'}</td>
                              <td>{member.semester_id || 'Active'}</td>
                              <td>{formatJoinedAt(member.joined_at)}</td>
                              {canManageMembers && (
                                <td>
                                  <button
                                    type="button"
                                    className="danger-button unit-action-button"
                                    onClick={() => setMemberToRemove(member)}
                                  >
                                    Xóa thành viên
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="unit-table-footer">
                        <button
                          type="button"
                          className="secondary-button unit-page-button"
                          onClick={() => handleMemberPageChange('previous')}
                          disabled={!canGoPreviousMembers}
                        >
                          Trước
                        </button>
                        <span>
                          Trang {memberCurrentPage} / {memberTotalPages}
                        </span>
                        <button
                          type="button"
                          className="secondary-button unit-page-button"
                          onClick={() => handleMemberPageChange('next')}
                          disabled={!canGoNextMembers}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="unit-empty-state">
                      <h3>Chưa có thành viên</h3>
                      <p>Danh sách thành viên của đơn vị đang trống với bộ lọc hiện tại.</p>
                    </div>
                  )}
                </section>
              ) : (
                <section className="page-card unit-content-note">
                  <h2>Thông tin đơn vị</h2>
                  <p>
                    Danh sách thành viên chỉ hiển thị cho tài khoản có quyền theo quy định của hệ
                    thống.
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default UnitDetailModal
