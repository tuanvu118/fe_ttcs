import { useEffect, useState } from 'react'
import { 
  EnvelopeSimple, 
  Globe, 
  User, 
  CaretLeft,
  Info,
  Users
} from '@phosphor-icons/react'
import ConfirmDialog from '../components/ConfirmDialog'
import NotificationPopup from '../components/NotificationPopup'
import UnitFormModal from '../components/units/UnitFormModal'
import UnitLogo from '../components/units/UnitLogo'
import UnitMemberModal from '../components/units/UnitMemberModal'
import {
  addUnitMember,
  deleteUnit,
  getUnitById,
  getUnitMembers,
  removeUnitMember,
  updateUnit,
} from '../service/unitService'
import { PATHS, USER_ROLES } from '../utils/routes'
import { getValidationMessage } from '../utils/userUtils'
import {
  canManageUnitMembers,
  canViewUnitMembers,
} from '../utils/unitUtils'
import './UnitDetailPage.css'

const DEFAULT_MEMBER_LIMIT = 10

function UnitDetailPage({
  unitId,
  accessToken,
  role,
  roleLabel,
  user,
  navigate,
  onSessionExpired,
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
    loadUnit()
  }, [accessToken, unitId])

  useEffect(() => {
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
      navigate(PATHS.units)
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

  function handleApiError(error, fallbackMessage, shouldNavigateBack = false) {
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
        onClose: shouldNavigateBack ? () => navigate(PATHS.units) : undefined,
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

  if (isLoadingUnit) {
    return <section className="page-card">Đang tải chi tiết đơn vị...</section>
  }

  if (!unit?.id) {
    return (
      <section className="page-card unit-empty-state">
        <h2>Không tìm thấy đơn vị</h2>
        <p>Đơn vị không tồn tại hoặc đã bị xóa.</p>
        <button
          type="button"
          className="secondary-button unit-back-button"
          onClick={() => navigate(PATHS.units)}
        >
          Quay lại danh sách đơn vị
        </button>
      </section>
    )
  }

  return (
    <div className="unit-detail-container">
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

      {/* Hero Section */}
      <section className="unit-hero-section">
        <div className="unit-hero-banner">
          <img 
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80" 
            alt="University Campus" 
          />
        </div>
        <div className="unit-header-content">
          <div className="unit-logo-wrapper">
            <UnitLogo logo={unit.logo} name={unit.name} size="large" />
          </div>
          <div className="unit-identity">
            <span className="unit-category">
              {unit.type === 'clb' ? 'Câu lạc bộ' : unit.type === 'lck' ? 'Liên chi đoàn' : 'Đơn vị hệ thống'}
            </span>
            <h1 className="unit-name-title">{unit.name || 'Chưa cập nhật'}</h1>
            
            {(canEditUnit || canDeleteUnit) && (
              <div className="unit-admin-actions">
                {canEditUnit && (
                  <button type="button" className="primary-button" onClick={() => setIsEditOpen(true)}>
                    Chỉnh sửa đơn vị
                  </button>
                )}
                {canDeleteUnit && (
                  <button type="button" className="danger-button" onClick={() => setIsDeleteOpen(true)}>
                    Xóa đơn vị
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <div className="unit-content-layout">
        <main className="unit-main-column">
          <button
            type="button"
            className="unit-back-btn"
            onClick={() => navigate(PATHS.units)}
          >
            <CaretLeft size={20} weight="bold" /> Quay lại danh sách
          </button>

          <article>
            <h2 className="unit-section-title">
              <Info size={24} weight="bold" /> Mô tả chi tiết
            </h2>
            <div className="unit-description-text">
              {unit.introduction || 'Hiện chưa có mô tả chi tiết cho đơn vị này.'}
            </div>
          </article>

          {/* Members Section (Accessible for Admin/Staff) */}
          {canViewMembers && (
            <section className="unit-members-section">
              <div className="unit-section-title">
                <Users size={24} weight="bold" /> Quản lý thành viên
              </div>
              
              <div className="page-card">
                <div className="unit-members-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    Danh sách thành viên chính thức trong học kỳ hiện tại.
                  </p>
                  {canManageMembers && (
                    <button type="button" className="primary-button" onClick={() => setIsAddMemberOpen(true)}>
                      Thêm thành viên
                    </button>
                  )}
                </div>

                <form className="unit-member-filter-grid" onSubmit={handleMemberFilterSubmit} style={{ marginBottom: '1.5rem' }}>
                  <label className="field">
                    <span>Mã sinh viên</span>
                    <input
                      type="text"
                      value={memberFilters.student_id}
                      onChange={(e) => setMemberFilters(c => ({ ...c, student_id: e.target.value }))}
                      placeholder="Lọc theo mã SV"
                    />
                  </label>
                  <label className="field">
                    <span>Họ tên</span>
                    <input
                      type="text"
                      value={memberFilters.full_name}
                      onChange={(e) => setMemberFilters(c => ({ ...c, full_name: e.target.value }))}
                      placeholder="Lọc theo họ tên"
                    />
                  </label>
                  <div className="unit-member-filter-actions">
                    <button type="submit" className="secondary-button">Lọc</button>
                    <button type="button" className="secondary-button" onClick={handleResetMemberFilters}>Xóa</button>
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
                          <th>Mã SV</th>
                          <th>Lớp</th>
                          {canManageMembers && <th>Thao tác</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {membersResult.items.map((member) => (
                          <tr key={`${member.user_id}-${member.semester_id}`}>
                            <td>
                              <div className="unit-member-name">
                                <strong>{member.full_name}</strong>
                                <span>{member.email}</span>
                              </div>
                            </td>
                            <td>{member.student_id}</td>
                            <td>{member.class_name}</td>
                            {canManageMembers && (
                              <td>
                                <button
                                  type="button"
                                  className="danger-button unit-action-button"
                                  onClick={() => setMemberToRemove(member)}
                                >
                                  Xóa
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
                      <span>Trang {memberCurrentPage} / {memberTotalPages}</span>
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
                  <p className="unit-muted-copy">Chưa có thành viên nào.</p>
                )}
              </div>
            </section>
          )}
        </main>

        <aside className="unit-sidebar-column">
          <div className="unit-sidebar-card">
            <h3 className="unit-section-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Thông tin liên hệ
            </h3>
            <ul className="unit-info-list">
              <li className="unit-info-item">
                <EnvelopeSimple size={24} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Email chính thức</p>
                  <p>{unit.email || 'Chưa cập nhật'}</p>
                </div>
              </li>
              <li className="unit-info-item">
                <Globe size={24} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Mạng xã hội</p>
                  <p>
                    {unit.fb_url ? (
                      <a href={unit.fb_url} target="_blank" rel="noopener noreferrer" className="unit-info-link">
                        {unit.fb_url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    ) : (
                      'Chưa cập nhật'
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default UnitDetailPage
