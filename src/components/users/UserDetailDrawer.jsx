import UserRoleManagementSection from './UserRoleManagementSection'
import UserAvatar from './UserAvatar'
import UserRoleList from './UserRoleList'
import { USER_ROLES } from '../../utils/routes'
import { formatDateOfBirth } from '../../utils/userUtils'

function UserDetailDrawer({
  isOpen,
  isLoading,
  user,
  role,
  accessToken,
  canEdit,
  onClose,
  onEdit,
  onApiError,
  onRoleChanged,
}) {
  if (!isOpen) {
    return null
  }

  const isAdmin = role === USER_ROLES.admin

  return (
    <div className="user-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="user-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-drawer-header">
          <h2 id="user-detail-title">Chi tiết người dùng</h2>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng chi tiết người dùng"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <p className="user-muted-copy">Đang tải chi tiết người dùng...</p>
        ) : user ? (
          <div className="user-detail-content">
            <div className="user-detail-hero">
              <UserAvatar avatarUrl={user.avatar_url} fullName={user.full_name} size="large" />
              <div>
                <h3>{user.full_name || 'Chưa cập nhật'}</h3>
                <p>{user.email || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="user-detail-grid">
              <div>
                <span>Mã sinh viên</span>
                <strong>{user.student_id || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span>Lớp</span>
                <strong>{user.class_name || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span>Ngày sinh</span>
                <strong>{formatDateOfBirth(user.date_of_birth)}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>{user.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</strong>
              </div>
            </div>

            <div className="user-role-section">
              <h4>Quyền gộp theo đơn vị</h4>
              <UserRoleList roles={user.roles} />
            </div>

            {canEdit && (
              <button type="button" className="primary-button" onClick={onEdit}>
                Chỉnh sửa người dùng
              </button>
            )}

            {isAdmin && user.id && (
              <UserRoleManagementSection
                userId={user.id}
                accessToken={accessToken}
                onError={onApiError}
                onRoleChanged={onRoleChanged}
              />
            )}
          </div>
        ) : (
          <p className="user-muted-copy">Không tìm thấy người dùng.</p>
        )}
      </aside>
    </div>
  )
}

export default UserDetailDrawer
