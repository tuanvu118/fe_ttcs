import StaffUnitsWorkspace from '../components/units/StaffUnitsWorkspace'
import UnitsManagementPage from '../components/units/UnitsManagementPage'
import { USER_ROLES } from '../utils/routes'

function UnitsPage({ accessToken, role, roleLabel, user, navigate, search, onSessionExpired }) {
  if (role === USER_ROLES.staff) {
    const params = new URLSearchParams(search || '')
    const selectedUnitId = params.get('unit') || ''
    const activePanel = params.get('panel') === 'overview' ? 'overview' : 'members'

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
