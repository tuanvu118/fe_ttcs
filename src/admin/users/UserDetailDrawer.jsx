import { createPortal } from 'react-dom'
import UserAvatar from '../../components/users/UserAvatar'
import UserRoleList from '../../components/users/UserRoleList'
import { USER_ROLES } from '../../utils/routes'
import { formatDateOfBirth } from '../../utils/userUtils'
import styles from './adminUsers.module.css'
import UserRoleManagementSection from './UserRoleManagementSection'

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

  return createPortal(
    <div className={styles.drawerBackdrop} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
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
          <p className={styles.mutedCopy}>Đang tải chi tiết người dùng...</p>
        ) : user ? (
          <div className={styles.detailContent}>
            <div className={styles.detailHero}>
              <div className={styles.detailHeroInfo}>
                <UserAvatar avatarUrl={user.avatar_url} fullName={user.full_name} size="large" />
                <div>
                  <h3>{user.full_name || 'Chưa cập nhật'}</h3>
                  <p>{user.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  className={`primary-button ${styles.detailEditButton}`}
                  onClick={onEdit}
                >
                  Chỉnh sửa người dùng
                </button>
              )}
            </div>

            <div className={styles.detailGrid}>
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

            <div className={styles.roleSection}>
              <h4>Quyền đơn vị</h4>
              <UserRoleList roles={user.roles} />
            </div>

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
          <p className={styles.mutedCopy}>Không tìm thấy người dùng.</p>
        )}
      </aside>
    </div>,
    document.body,
  )
}

export default UserDetailDrawer
