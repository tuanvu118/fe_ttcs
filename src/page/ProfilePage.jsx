function ProfilePage({ user, isLoadingUser }) {
  if (isLoadingUser) {
    return <section className="page-card">Đang tải hồ sơ...</section>
  }

  return (
    <section className="page-card">
      <h1>Profile</h1>
      <p>Ho ten: {user?.fullName || 'Chua co du lieu'}</p>
      <p>Email: {user?.email || 'Chua co du lieu'}</p>
      <p>Ma sinh vien: {user?.studentId || 'Chua co du lieu'}</p>
      <p>Lop: {user?.className || 'Chua co du lieu'}</p>
      <p>Khoa hoc: {user?.courseCode || 'Chua co du lieu'}</p>
    </section>
  )
}

export default ProfilePage
