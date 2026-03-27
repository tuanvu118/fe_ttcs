import UserManagementPage from '../components/users/UserManagementPage'

function ManagerPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Quản trị người dùng"
      pageDescription="MANAGER có thể xem danh sách, tạo mới, xem chi tiết và chỉnh sửa user theo quyền backend."
      onSessionExpired={onSessionExpired}
    />
  )
}

export default ManagerPage
