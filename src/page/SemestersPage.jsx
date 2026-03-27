import SemesterManagementPage from '../components/semesters/SemesterManagementPage'

function SemestersPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <SemesterManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      onSessionExpired={onSessionExpired}
    />
  )
}

export default SemestersPage
