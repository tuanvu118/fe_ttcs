import { useEffect, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import NotificationPopup from '../../components/NotificationPopup'
import UnitLogo from '../../components/units/UnitLogo'
import UnitMemberModal from '../../components/units/UnitMemberModal'
import UnitEditModal from '../../components/units/UnitEditModal'
import UnitTypeBadge from '../../components/units/UnitTypeBadge'
import UserAvatar from '../../components/users/UserAvatar'
import {
  addUnitMember,
  getUnitById,
  getUnitMembers,
  removeUnitMember,
  updateUnit,
} from '../../service/unitService'
import { formatJoinedAt } from '../../utils/unitUtils'
import styles from './staffUnitsWorkspace.module.css'
import { 
  Info, 
  Users, 
  PencilSimple,
  Calendar,
  EnvelopeSimple,
  Plus,
  Trash,
  MagnifyingGlass
} from '@phosphor-icons/react'

const DEFAULT_MEMBER_LIMIT = 10

export default function StaffUnitsWorkspace({
  accessToken,
  selectedUnitId,
  role,
  activePanel: initialPanel,
  onSessionExpired,
}) {
  const [unitDetail, setUnitDetail] = useState(null)
  const [activePanel, setActivePanel] = useState(initialPanel || 'overview')
  const [membersResult, setMembersResult] = useState({
    items: [], total: 0, skip: 0, limit: DEFAULT_MEMBER_LIMIT
  })
  const [memberFilters, setMemberFilters] = useState({ full_name: '', email: '', student_id: '', class_name: '' })
  const [memberQuery, setMemberQuery] = useState({ skip: 0, limit: DEFAULT_MEMBER_LIMIT, full_name: '', email: '', student_id: '', class_name: '' })
  const [notice, setNotice] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)

  useEffect(() => {
    if (!selectedUnitId) return
    loadUnitDetail(selectedUnitId)
  }, [selectedUnitId, accessToken])

  useEffect(() => {
    if (!selectedUnitId || activePanel !== 'members') return
    loadMembers(selectedUnitId, memberQuery)
  }, [selectedUnitId, activePanel, memberQuery, accessToken])

  async function loadUnitDetail(unitId) {
    setIsLoadingDetail(true)
    try {
      const detail = await getUnitById(unitId, accessToken)
      setUnitDetail(detail)
    } catch (error) { handleApiError(error, 'Không thể tải thông tin đơn vị.') }
    finally { setIsLoadingDetail(false) }
  }

  async function loadMembers(unitId, params) {
    setIsLoadingMembers(true)
    try {
      const response = await getUnitMembers(unitId, params, accessToken)
      setMembersResult({ items: response.items, total: response.total, skip: response.skip, limit: response.limit || DEFAULT_MEMBER_LIMIT })
    } catch (error) { handleApiError(error, 'Không thể tải danh sách thành viên.') }
    finally { setIsLoadingMembers(false) }
  }

  async function handleAddMember(form) {
    if (!selectedUnitId) return
    setIsSubmitting(true)
    try {
      await addUnitMember(selectedUnitId, form, accessToken)
      setIsAddMemberOpen(false)
      setMemberQuery(p => ({ ...p, skip: 0 }))
    } catch (error) { handleApiError(error, 'Thêm thành viên thất bại.') }
    finally { setIsSubmitting(false) }
  }

  async function handleUpdateUnit(payload) {
    if (!selectedUnitId) return
    setIsSubmitting(true)
    try {
      await updateUnit(selectedUnitId, payload, accessToken)
      setIsEditUnitOpen(false)
      loadUnitDetail(selectedUnitId)
      setNotice({ title: 'Thành công', message: 'Cập nhật thông tin đơn vị thành công!' })
    } catch (error) { handleApiError(error, 'Cập nhật thông tin đơn vị thất bại.') }
    finally { setIsSubmitting(false) }
  }

  async function handleRemoveMember() {
    if (!selectedUnitId || !memberToRemove?.user_id) return
    setIsSubmitting(true)
    try {
      await removeUnitMember(selectedUnitId, memberToRemove.user_id, accessToken, memberToRemove.semester_id)
      setMemberToRemove(null)
      setMemberQuery(p => ({ ...p }))
    } catch (error) { handleApiError(error, 'Xóa thành viên thất bại.') }
    finally { setIsSubmitting(false) }
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) { setNotice({ title: 'Hết hạn', message: 'Vui lòng đăng nhập lại.', onClose: onSessionExpired }); return }
    setNotice({ title: 'Có lỗi', message: error?.message || fallbackMessage })
  }

  return (
    <div className={styles.container}>
      <NotificationPopup isOpen={Boolean(notice?.message)} title={notice?.title} message={notice?.message} onClose={() => setNotice(null)} />
      <UnitMemberModal isOpen={isAddMemberOpen} isSubmitting={isSubmitting} onClose={() => setIsAddMemberOpen(false)} onSubmit={handleAddMember} />
      <UnitEditModal isOpen={isEditUnitOpen} unit={unitDetail} isAdmin={role === 'ADMIN'} isSubmitting={isSubmitting} onClose={() => setIsEditUnitOpen(false)} onSubmit={handleUpdateUnit} />
      <ConfirmDialog isOpen={Boolean(memberToRemove)} title="Xóa thành viên" message={`Xóa "${memberToRemove?.full_name}" khỏi đơn vị?`} confirmLabel="Xóa" danger isSubmitting={isSubmitting} onClose={() => setMemberToRemove(null)} onConfirm={handleRemoveMember} />

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>{unitDetail?.name || 'Đơn vị'}</h1>
        </div>
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activePanel === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActivePanel('overview')}
          >
            <Info size={18} weight={activePanel === 'overview' ? 'fill' : 'bold'} />
            Tổng quan
          </button>
          <button
            className={`${styles.tab} ${activePanel === 'members' ? styles.activeTab : ''}`}
            onClick={() => setActivePanel('members')}
          >
            <Users size={18} weight={activePanel === 'members' ? 'fill' : 'bold'} />
            Thành viên
          </button>
        </nav>
      </header>

      <div className={styles.workspaceContent}>
        {activePanel === 'overview' ? (
          unitDetail ? (
            <div className={styles.overviewWrapper}>
              <div className={styles.overviewHeader}>
                <div className={styles.overviewIdentity}>
                  <div className={styles.overviewLogoBox}>
                    <UnitLogo logo={unitDetail.logo} name={unitDetail.name} size="large" />
                  </div>
                  <div className={styles.overviewNameBox}>
                    <UnitTypeBadge type={unitDetail.type} />
                    <h2 className={styles.overviewTitle}>{unitDetail.name}</h2>
                    <div className={styles.overviewQuickStats}>
                      <span className={styles.statItem}>
                        <Users size={16} weight="bold" /> {unitDetail.member_count || 0} thành viên
                      </span>
                      <span className={styles.statItem}>
                        <Calendar size={16} weight="bold" /> Thành lập: {unitDetail.established_year || 'N/A'}
                      </span>
                      <span className={styles.statItem}>
                        <EnvelopeSimple size={16} weight="bold" /> {unitDetail.email || 'Chưa có email'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className={styles.editUnitBtn}
                  onClick={() => setIsEditUnitOpen(true)}
                >
                  <PencilSimple size={18} weight="bold" /> Chỉnh sửa thông tin
                </button>
              </div>

              <div className={styles.overviewBody}>
                <div className={styles.overviewSection}>
                  <h3 className={styles.sectionTitle}>Giới thiệu chi tiết</h3>
                  <div className={styles.introductionContent}>
                    {unitDetail.introduction ? (
                      <p>{unitDetail.introduction}</p>
                    ) : (
                      <p className={styles.placeholderText}>Chưa có thông tin giới thiệu. Hãy nhấn "Chỉnh sửa" để cập nhật nội dung cho sinh viên xem.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : <p>Chọn đơn vị để xem chi tiết.</p>
        ) : (
          <>
            <div className={styles.filterBar}>
              <div className={styles.filterGroup}>
                <div className={styles.filterSelect}>
                  <MagnifyingGlass size={16} />
                  <input
                    placeholder="Tìm tên, mã sinh viên..."
                    value={memberFilters.full_name}
                    onChange={e => setMemberFilters(p => ({ ...p, full_name: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                  Hiển thị {membersResult.items.length} của {membersResult.total} thành viên
                </span>
                <button className={styles.createBtn} onClick={() => setIsAddMemberOpen(true)}>
                  <Plus size={18} weight="bold" /> Thêm thành viên
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Mã sinh viên</th>
                    <th>Lớp</th>
                    <th>Tham gia</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMembers ? (
                    <tr><td colSpan="5">Đang tải...</td></tr>
                  ) : membersResult.items.map(m => (
                    <tr key={m.user_id}>
                      <td>
                        <div className={styles.userCell}>
                          <UserAvatar avatarUrl={m.avatar_url} fullName={m.full_name} size="small" />
                          <div><strong>{m.full_name}</strong><br /><small>{m.email}</small></div>
                        </div>
                      </td>
                      <td>{m.student_id}</td>
                      <td>{m.class_name}</td>
                      <td>{formatJoinedAt(m.joined_at)}</td>
                      <td>
                        <button className={styles.actionBtn} onClick={() => setMemberToRemove(m)}><Trash size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
