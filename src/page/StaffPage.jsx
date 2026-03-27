import UserManagementPage from '../components/users/UserManagementPage'

function StaffPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Danh sách người dùng"
      pageDescription="STAFF chỉ xem được user cùng đơn vị theo quyền backend và chỉ có quyền xem chi tiết."
      onSessionExpired={onSessionExpired}
    />
  )
}

export default StaffPage
