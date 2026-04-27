import UserManagementPage from '../components/users/UserManagementPage'

function AdminPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Quản trị người dùng"
      pageDescription="ADMIN có thể xem toàn bộ người dùng, tạo người dùng mới, chỉnh sửa người dùng khác và phân quyền."
      onSessionExpired={onSessionExpired}
    />
  )
}

export default AdminPage
