function ForbiddenPage({ requiredRoleLabel }) {
  return (
    <section className="page-card">
      <h1>403</h1>
      <p>Bạn không có quyền truy cập trang này.</p>
      {requiredRoleLabel && (
        <p>Trang này chỉ dành cho vai trò: {requiredRoleLabel}.</p>
      )}
    </section>
  )
}

export default ForbiddenPage
