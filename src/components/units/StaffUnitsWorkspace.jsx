import { useEffect, useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import NotificationPopup from '../NotificationPopup'
import UserAvatar from '../users/UserAvatar'
import {
  addUnitMember,
  getUnitById,
  getUnitMembers,
  removeUnitMember,
} from '../../service/unitService'
import { formatJoinedAt, getUnitIntroduction } from '../../utils/unitUtils'
import UnitLogo from './UnitLogo'
import UnitMemberModal from './UnitMemberModal'
import UnitTypeBadge from './UnitTypeBadge'

const DEFAULT_MEMBER_LIMIT = 10

function StaffUnitsWorkspace({
  accessToken,
  selectedUnitId,
  activePanel,
  onSessionExpired,
}) {
  const [unitDetail, setUnitDetail] = useState(null)
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
  const [notice, setNotice] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)

  const memberCurrentPage = Math.floor(membersResult.skip / Math.max(membersResult.limit, 1)) + 1
  const memberTotalPages = Math.max(
    Math.ceil(membersResult.total / Math.max(membersResult.limit, 1)),
    1,
  )
  const canGoPreviousMembers = membersResult.skip > 0
  const canGoNextMembers = membersResult.skip + membersResult.limit < membersResult.total

  useEffect(() => {
    if (!selectedUnitId) {
      setUnitDetail(null)
      return
    }

    loadUnitDetail(selectedUnitId)
  }, [selectedUnitId, accessToken])

  useEffect(() => {
    if (!selectedUnitId || activePanel !== 'members') {
      return
    }

    loadMembers(selectedUnitId, memberQuery)
  }, [selectedUnitId, activePanel, memberQuery, accessToken])

  async function loadUnitDetail(unitId) {
    setIsLoadingDetail(true)

    try {
      const detail = await getUnitById(unitId, accessToken)
      setUnitDetail(detail)
    } catch (error) {
      handleApiError(error, 'Không thể tải thông tin đơn vị.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  async function loadMembers(unitId, params) {
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

  async function handleAddMember(form) {
    if (!selectedUnitId) {
      return
    }

    setIsSubmitting(true)

    try {
      await addUnitMember(selectedUnitId, form, accessToken)
      setIsAddMemberOpen(false)

      const nextQuery = { ...memberQuery, skip: 0 }
      setMemberQuery(nextQuery)
      await loadMembers(selectedUnitId, nextQuery)
    } catch (error) {
      const detailPayload = error?.payload?.detail
      const detailText = Array.isArray(detailPayload)
        ? detailPayload.map((item) => item?.msg || '').join(' ')
        : String(detailPayload || '')
      const errorText = `${error?.message || ''} ${detailText}`.toUpperCase()

      if (error?.status === 403) {
        setNotice({
          title: 'Không có quyền',
          message: 'Bạn không có quyền thực hiện thao tác này',
        })
        return
      }

      if (
        error?.status === 404 &&
        (errorText.includes('ACTIVE_SEMESTER_NOT_FOUND') || errorText.includes('ACTIVE SEMESTER'))
      ) {
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

      if (
        error?.status === 400 &&
        (errorText.includes('ALREADY') ||
          errorText.includes('EXIST') ||
          errorText.includes('IN UNIT') ||
          errorText.includes('DUPLICATE'))
      ) {
        setNotice({
          title: 'Thành viên đã tồn tại',
          message: 'Sinh viên đã thuộc đơn vị trong kỳ hiện tại',
        })
        return
      }

      handleApiError(error, 'Thêm thành viên thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember() {
    if (!selectedUnitId || !memberToRemove?.user_id) {
      return
    }

    setIsSubmitting(true)

    try {
      await removeUnitMember(
        selectedUnitId,
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
      await loadMembers(selectedUnitId, nextQuery)
    } catch (error) {
      handleApiError(error, 'Xóa thành viên thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleApiError(error, fallbackMessage) {
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
        message: 'Đơn vị hoặc dữ liệu thành viên không tồn tại.',
      })
      return
    }

    if (error?.status === 400 || error?.status === 422) {
      setNotice({
        title: 'Dữ liệu chưa hợp lệ',
        message: fallbackMessage,
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
    setMemberQuery((current) => ({
      ...current,
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

    setMemberQuery((current) => ({ ...current, skip: nextSkip }))
  }

  function renderMainContent() {
    if (!selectedUnitId) {
      return (
        <section className="page-card unit-empty-state">
          <h3>Chưa chọn đơn vị</h3>
          <p>Vui lòng chọn không gian đơn vị ở thanh bên trái để bắt đầu.</p>
        </section>
      )
    }

    if (isLoadingDetail || !unitDetail?.id) {
      return (
        <section className="page-card">
          <p>Đang tải thông tin đơn vị...</p>
        </section>
      )
    }

    if (activePanel === 'overview') {
      return (
        <section className="page-card unit-detail-hero-card">
          <div className="unit-detail-hero">
            <UnitLogo logo={unitDetail.logo} name={unitDetail.name} size="large" />
            <div className="unit-detail-copy">
              <span className="dashboard-badge">Nhân sự đơn vị</span>
              <h1>{unitDetail.name || 'Chưa cập nhật'}</h1>
              <div className="unit-detail-meta">
                <UnitTypeBadge type={unitDetail.type} />
              </div>
              <p>{getUnitIntroduction(unitDetail)}</p>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className="page-card unit-members-card">
        <div className="unit-members-header">
          <div>
            <h2>Danh sách thành viên đơn vị</h2>
            <p>Quản lý thành viên cho không gian đơn vị đã chọn.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => setIsAddMemberOpen(true)}>
            Thêm thành viên
          </button>
        </div>

        <form className="unit-member-filter-grid staff-member-filter-grid" onSubmit={handleMemberFilterSubmit}>
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
            <button type="button" className="secondary-button" onClick={handleResetMemberFilters}>
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
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {membersResult.items.map((member) => (
                  <tr key={`${member.user_id}-${member.semester_id}`}>
                    <td>
                      <div className="unit-member-name">
                        <UserAvatar avatarUrl={member.avatar_url} fullName={member.full_name} size="small" />
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
                    <td>
                      <button
                        type="button"
                        className="danger-button unit-action-button"
                        onClick={() => setMemberToRemove(member)}
                      >
                        Xóa thành viên
                      </button>
                    </td>
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
            <p>Danh sách thành viên đang trống với bộ lọc hiện tại.</p>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="staff-units-main">
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

      {renderMainContent()}
    </section>
  )
}

export default StaffUnitsWorkspace
