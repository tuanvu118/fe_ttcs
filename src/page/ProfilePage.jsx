import { useEffect, useState } from 'react'
import NotificationPopup from '../components/NotificationPopup'
import UserAvatar from '../components/users/UserAvatar'
import UserFormModal from '../components/users/UserFormModal'
import UserRoleList from '../components/users/UserRoleList'
import { getMyProfile, updateMyProfile } from '../service/userService'
import { PATHS } from '../utils/routes'
import { formatDateOfBirth, getValidationMessage } from '../utils/userUtils'

function ProfilePage({
  accessToken,
  roleLabel,
  onProfileUpdated,
  onSessionExpired,
  navigate,
}) {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [accessToken])

  async function loadProfile() {
    setIsLoading(true)

    try {
      const nextProfile = await getMyProfile(accessToken)
      setProfile(nextProfile)
    } catch (error) {
      handleApiError(error, 'Không thể tải hồ sơ cá nhân.')
    } finally {
      setIsLoading(false)
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
        message: 'Bạn không có quyền truy cập hồ sơ này.',
      })
      return
    }

    if (error?.status === 422) {
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

  if (isLoading) {
    return <section className="page-card">Đang tải hồ sơ...</section>
  }

  return (
    <section className="user-profile-page">
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
        title="Chỉnh sửa hồ sơ cá nhân"
        submitLabel="Lưu hồ sơ"
        initialValues={profile}
        isSubmitting={isSubmitting}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateProfile}
      />

      <div className="user-profile-shell page-card">
        <div className="user-profile-hero">
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            fullName={profile?.full_name}
            size="large"
          />
          <div className="user-profile-copy">
            <span className="dashboard-badge">{roleLabel}</span>
            <h1>{profile?.full_name || 'Chưa cập nhật'}</h1>
            <p>{profile?.email || 'Chưa cập nhật'}</p>
          </div>
          <div className="user-profile-actions">
            <button type="button" className="primary-button" onClick={() => setIsEditOpen(true)}>
              Chỉnh sửa hồ sơ
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(PATHS.logout)}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="user-profile-grid">
          <div className="user-profile-info">
            <span>Mã sinh viên</span>
            <strong>{profile?.student_id || 'Chưa cập nhật'}</strong>
          </div>
          <div className="user-profile-info">
            <span>Lớp</span>
            <strong>{profile?.class_name || 'Chưa cập nhật'}</strong>
          </div>
          <div className="user-profile-info">
            <span>Ngày sinh</span>
            <strong>{formatDateOfBirth(profile?.date_of_birth)}</strong>
          </div>
          <div className="user-profile-info">
            <span>Trạng thái</span>
            <strong>{profile?.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</strong>
          </div>
        </div>

        <div className="user-role-section">
          <h2>Roles theo unit</h2>
          <UserRoleList roles={profile?.roles} />
        </div>
      </div>
    </section>
  )
}

export default ProfilePage
