import UserManagementPage from '../components/users/UserManagementPage'

function RegisterPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Tạo người dùng"
      pageDescription="Mở trực tiếp form tạo user mới bằng đúng API POST /users, chỉ dành cho ADMIN hoặc MANAGER."
      initialCreateOpen
      onSessionExpired={onSessionExpired}
    />
  )
}

export default RegisterPage
