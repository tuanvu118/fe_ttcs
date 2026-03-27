import AdminShell from './components/AdminShell'
import TopNav from './components/TopNav'
import { useAuth } from './hooks/useAuth'
import { useRouter } from './hooks/useRouter'
import AdminPage from './page/AdminPage'
import AboutPage from './page/AboutPage'
import ClubDetailPage from './page/ClubDetailPage'
import ClubPage from './page/ClubPage'
import EventPage from './page/EventPage'
import ForbiddenPage from './page/ForbiddenPage'
import HomePage from './page/HomePage'
import LoginPage from './page/LoginPage'
import LogoutPage from './page/LogoutPage'
import ManagerPage from './page/ManagerPage'
import NotFoundPage from './page/NotFoundPage'
import ProfilePage from './page/ProfilePage'
import RegisterPage from './page/RegisterPage'
import SemestersPage from './page/SemestersPage'
import UnitDetailPage from './page/UnitDetailPage'
import UnitsPage from './page/UnitsPage'
import {
  PATHS,
  USER_ROLES,
  getClubUnitIdFromPath,
  getRoleLabel,
  getRouteMeta,
  getUnitIdFromPath,
  isRoleAllowed,
  isUnitDetailPath,
} from './utils/routes'

function App() {
  const { pathname, search, navigate, replace } = useRouter()
  const {
    user,
    role,
    roleLabel,
    dashboardPath,
    accessToken,
    isAuthenticated,
    isLoadingUser,
    login,
    logout,
    refreshUser,
  } = useAuth()

  function handleSessionExpired() {
    logout({ skipServer: true })
    replace(PATHS.login)
  }

  const routeMeta = getRouteMeta(pathname)
  const unitId = getUnitIdFromPath(pathname)
  const clubUnitId = getClubUnitIdFromPath(pathname)
  const isUnitRoute = pathname === PATHS.units || isUnitDetailPath(pathname)
  const isSemesterRoute = pathname === PATHS.semesters
  const isAdminLayout =
    isAuthenticated &&
    role !== USER_ROLES.user &&
    ([PATHS.admin, PATHS.manager, PATHS.staff, PATHS.register].includes(pathname) ||
      isUnitRoute ||
      isSemesterRoute)

  let page = <NotFoundPage />

  if (routeMeta) {
    if (routeMeta.requiresAuth && !isAuthenticated) {
      page = <LoginPage onLogin={login} navigate={navigate} />
    } else if (routeMeta.requiresAuth && isLoadingUser) {
      page = <section className="page-card">Đang tải thông tin người dùng...</section>
    } else if (routeMeta.allowedRoles && !isRoleAllowed(role, routeMeta.allowedRoles)) {
      page = (
        <ForbiddenPage requiredRoleLabel={routeMeta.allowedRoles.map(getRoleLabel).join(', ')} />
      )
    } else if (pathname === PATHS.home) {
      page = <HomePage />
    } else if (pathname === PATHS.event) {
      page = <EventPage />
    } else if (pathname === PATHS.about) {
      page = <AboutPage />
    } else if (pathname === PATHS.club) {
      page = <ClubPage navigate={navigate} search={search} />
    } else if (clubUnitId) {
      page = <ClubDetailPage unitId={clubUnitId} navigate={navigate} />
    } else if (pathname === PATHS.login) {
      page = (
        <LoginPage
          isAuthenticated={isAuthenticated}
          user={user}
          onLogin={login}
          navigate={navigate}
        />
      )
    } else if (pathname === PATHS.register) {
      page = (
        <RegisterPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={role}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.profile) {
      page = (
        <ProfilePage
          accessToken={accessToken}
          roleLabel={roleLabel}
          onProfileUpdated={refreshUser}
          onSessionExpired={handleSessionExpired}
          navigate={navigate}
        />
      )
    } else if (pathname === PATHS.admin) {
      page = (
        <AdminPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={role}
          user={user}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.manager) {
      page = (
        <ManagerPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={role}
          user={user}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.staff) {
      page = (
        <UnitsPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={role}
          user={user}
          navigate={navigate}
          search={search}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.units) {
      page = (
        <UnitsPage
          accessToken={accessToken}
          role={role}
          roleLabel={roleLabel}
          user={user}
          navigate={navigate}
          search={search}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.semesters) {
      page = (
        <SemestersPage
          accessToken={accessToken}
          role={role}
          roleLabel={roleLabel}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (unitId) {
      page = (
        <UnitDetailPage
          unitId={unitId}
          accessToken={accessToken}
          role={role}
          roleLabel={roleLabel}
          user={user}
          navigate={navigate}
          onSessionExpired={handleSessionExpired}
        />
      )
    } else if (pathname === PATHS.logout) {
      page = <LogoutPage onLogout={logout} replace={replace} />
    } else {
      page = <NotFoundPage />
    }
  }

  return (
    <div className="app-shell">
      <TopNav
        currentPath={pathname}
        isAuthenticated={isAuthenticated}
        dashboardPath={dashboardPath}
        user={user}
        navigate={navigate}
      />
      {isAdminLayout ? (
        <AdminShell
          currentPath={pathname}
          roleLabel={roleLabel}
          dashboardPath={dashboardPath}
          user={user}
          role={role}
          accessToken={accessToken}
          search={search}
          navigate={navigate}
        >
          {page}
        </AdminShell>
      ) : (
        <main className="page-content">{page}</main>
      )}
    </div>
  )
}

export default App
