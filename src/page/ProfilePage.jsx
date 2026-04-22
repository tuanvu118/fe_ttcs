import { useEffect, useState } from 'react'
import NotificationPopup from '../components/NotificationPopup'
import UserAvatar from '../components/users/UserAvatar'
import UserFormModal from '../components/users/UserFormModal'
import UserRoleList from '../components/users/UserRoleList'
import { getMyProfile, updateMyProfile, getMyStats } from '../service/userService'
import { getSemesters } from '../service/semesterService'
import SemesterSelector from '../components/semesters/SemesterSelector'
import { useCurrentSemester } from '../hooks/useCurrentSemester'
import { PATHS } from '../utils/routes'
import { formatDateOfBirth, getValidationMessage } from '../utils/userUtils'
import '../style/ProfileStats.css'

function ProfilePage({
  accessToken,
  onProfileUpdated,
  onSessionExpired,
  navigate,
}) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [currentSemester] = useCurrentSemester()
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'events' | 'points'
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [accessToken])

  useEffect(() => {
    if (accessToken && currentSemester) {
      loadStats()
    }
  }, [accessToken, currentSemester?.id])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const profileData = await getMyProfile(accessToken)
      setProfile(profileData)
    } catch (error) {
      handleApiError(error, 'Không thể tải thông tin hồ sơ.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadStats() {
    setIsStatsLoading(true)
    try {
      const semesterId = currentSemester?.id === 'all' ? null : currentSemester?.id
      const statsData = await getMyStats(accessToken, semesterId)
      setStats(statsData)
    } catch (error) {
      console.error('Stats load error:', error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  async function handleUpdateProfile(form) {
    setIsSubmitting(true)
    try {
      await updateMyProfile(form, accessToken)
      const refreshedProfile = await getMyProfile(accessToken)
      setProfile(refreshedProfile)
      setIsEditOpen(false)
      onProfileUpdated?.()
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật hồ sơ thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) {
      setNotice({ title: 'Hết hạn', message: 'Vui lòng đăng nhập lại.', onClose: onSessionExpired })
      return
    }
    setNotice({
      title: 'Có lỗi xảy ra',
      message: getValidationMessage(error, fallbackMessage),
    })
  }

  if (isLoading) {
    return <div className="loading-state">Đang tải hồ sơ...</div>
  }

  return (
    <div className="user-profile-page">
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

      <UserFormModal
        isOpen={isEditOpen}
        mode="edit"
        title="Chỉnh sửa hồ sơ"
        submitLabel="Lưu thay đổi"
        initialValues={profile}
        isSubmitting={isSubmitting}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateProfile}
      />

      <div className="profile-container">
        {/* ── SIDEBAR ── */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrapper">
            <UserAvatar avatarUrl={profile?.avatar_url} fullName={profile?.full_name} size="large" />
          </div>
          <h2 className="profile-name">{profile?.full_name}</h2>
          <p className="profile-email">{profile?.email}</p>

          <div className="profile-basic-info">
            <div className="info-item">
              <span className="info-label">Mã sinh viên</span>
              <span className="info-value">{profile?.student_id || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Lớp</span>
              <span className="info-value">{profile?.class_name || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ngày sinh</span>
              <span className="info-value">{formatDateOfBirth(profile?.date_of_birth)}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="primary-button" onClick={() => setIsEditOpen(true)}>Chỉnh sửa hồ sơ</button>
            <button className="secondary-button" onClick={() => navigate(PATHS.logout)}>Đăng xuất</button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="profile-main">
          <header className="profile-tabs-header">
            <nav className="tabs-nav">
              <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Thông tin</button>
              <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Sự kiện</button>
              <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>Điểm rèn luyện</button>
            </nav>

            <div className="semester-selector">
              <SemesterSelector 
                variant="filter" 
                showLabel={false} 
                allowAll={true} 
                getPopupContainer={(trigger) => trigger.parentNode} 
              />
            </div>
          </header>

          <div className="profile-tabs-content">
            {activeTab === 'info' && (
              <div className="tab-pane-info">
                <div className="user-role-section">
                  <h2>Chức vụ đang đảm nhiệm</h2>
                  <UserRoleList roles={profile?.roles} />
                </div>
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ghi chú hệ thống</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Tài khoản của bạn đang ở trạng thái <strong>{profile?.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</strong>. 
                    Nếu có sai sót về thông tin chức vụ, vui lòng liên hệ Ban quản trị.
                  </p>
                </div>
              </div>
            )}

            {(activeTab === 'events' || activeTab === 'points') && (
              <div className="tab-pane-stats">
                <div className="stats-overview">
                  <div className="stat-card points">
                    <span className="stat-label">Tổng điểm học kỳ</span>
                    <span className="stat-value">{stats?.total_points || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Sự kiện tham gia</span>
                    <span className="stat-value">{stats?.participated_events?.length || 0}</span>
                  </div>
                </div>

                {isStatsLoading ? (
                  <p>Đang tải dữ liệu học kỳ...</p>
                ) : (
                  <div className="events-history">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                      {activeTab === 'events' ? 'Lịch sử tham gia' : 'Chi tiết điểm rèn luyện'}
                    </h3>
                    
                    {stats?.participated_events?.length > 0 ? (
                      stats.participated_events.map(ev => (
                        <div key={ev.event_id} className="event-item-row">
                          <div className="event-info">
                            <h4>{ev.title}</h4>
                            <span>{new Date(ev.event_start).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="event-meta">
                            <span className={`status-tag ${ev.checked_in ? 'checked' : 'pending'}`}>
                              {ev.checked_in ? 'Đã tham gia' : 'Đã đăng ký'}
                            </span>
                            <span className="point-badge">+{ev.point} điểm</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">Không có dữ liệu trong học kỳ này.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
