import { getUserInitials } from '../../utils/userUtils'

function UserAvatar({ avatarUrl, fullName, size = 'medium' }) {
  const initials = getUserInitials(fullName)

  return avatarUrl ? (
    <img
      className={`user-avatar user-avatar-${size}`}
      src={avatarUrl}
      alt={fullName || 'Ảnh đại diện'}
    />
  ) : (
    <div className={`user-avatar user-avatar-${size} user-avatar-fallback`}>
      {initials}
    </div>
  )
}

export default UserAvatar
