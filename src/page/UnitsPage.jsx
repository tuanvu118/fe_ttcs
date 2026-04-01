import StaffUnitsWorkspace from '../components/units/StaffUnitsWorkspace'
import UnitsManagementPage from '../components/units/UnitsManagementPage'

function UnitsPage({
  accessToken,
  role,
  roleLabel,
  user,
  navigate,
  search,
  onSessionExpired,
  mode = 'admin-manage',
  staffPanel = 'members',
}) {
  if (mode === 'staff-manage') {
    const params = new URLSearchParams(search || '')
    const selectedUnitId = params.get('unit') || ''
    const activePanel = ['members', 'reports', 'events'].includes(staffPanel) ? staffPanel : 'members'

    if (activePanel === 'reports') {
      return (
        <section className="page-card">
          <h1>Quản lý báo cáo</h1>
        </section>
      )
    }

    if (activePanel === 'events') {
      return (
        <section className="page-card">
          <h1>Quản lý sự kiện được giao</h1>
        </section>
      )
    }

    return (
      <StaffUnitsWorkspace
        accessToken={accessToken}
        selectedUnitId={selectedUnitId}
        activePanel={activePanel}
        onSessionExpired={onSessionExpired}
      />
    )
  }

  return (
    <UnitsManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      user={user}
      navigate={navigate}
      onSessionExpired={onSessionExpired}
    />
  )
}

export default UnitsPage
