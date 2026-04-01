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
import NotFoundPage from './page/NotFoundPage'
import ProfilePage from './page/ProfilePage'
import RegisterPage from './page/RegisterPage'
import SemestersPage from './page/SemestersPage'
import UnitDetailPage from './page/UnitDetailPage'
import UnitsPage from './page/UnitsPage'
import {
  hasManageAccess,
  PATHS,
  getClubUnitIdFromPath,
  getManageRoleForUnit,
  getRoleLabel,
  getRouteMeta,
  getUnitIdFromPath,
  isRoleAllowed,
  isManagePath,
  parseManageQuery,
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
  const isAdminLayout = isAuthenticated && (pathname === PATHS.register || isManagePath(pathname))

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
    } else if (isManagePath(pathname)) {
      const { unitId: selectedUnitId, panel } = parseManageQuery(search)
      const scopedRole = getManageRoleForUnit(user, selectedUnitId)
      const canAccessManage = hasManageAccess(user)

      if (!canAccessManage) {
        page = <ForbiddenPage requiredRoleLabel="Admin, Manager hoặc Staff" />
      } else if (pathname === PATHS.manage || pathname === PATHS.manageAdmin) {
        page = (
          <section className="page-card">
            <h1>Vui lòng chọn đơn vị để bắt đầu quản trị</h1>
          </section>
        )
      } else if (pathname === PATHS.manageUnits) {
        page = (
          <UnitsPage
            accessToken={accessToken}
            role={scopedRole || role}
            roleLabel={roleLabel}
            user={user}
            navigate={navigate}
            search={search}
            onSessionExpired={handleSessionExpired}
            mode="staff-manage"
            staffPanel={panel}
          />
        )
      } else if (
        [PATHS.manageAdminUsers, PATHS.manageAdminUnits, PATHS.manageAdminSemesters].includes(pathname)
      ) {
        const canAccessAdminManage = scopedRole === 'admin' || scopedRole === 'manager'

        if (!canAccessAdminManage) {
          page = <ForbiddenPage requiredRoleLabel="Admin hoặc Manager tại đơn vị đã chọn" />
        } else if (pathname === PATHS.manageAdminUsers) {
          page = (
            <AdminPage
              accessToken={accessToken}
              roleLabel={roleLabel}
              role={scopedRole}
              user={user}
              onSessionExpired={handleSessionExpired}
            />
          )
        } else if (pathname === PATHS.manageAdminUnits) {
          page = (
            <UnitsPage
              accessToken={accessToken}
              role={scopedRole}
              roleLabel={roleLabel}
              user={user}
              navigate={navigate}
              search={search}
              onSessionExpired={handleSessionExpired}
              mode="admin-manage"
            />
          )
        } else {
          page = (
            <SemestersPage
              accessToken={accessToken}
              role={scopedRole}
              roleLabel={roleLabel}
              onSessionExpired={handleSessionExpired}
            />
          )
        }
      } else {
        page = <NotFoundPage />
      }
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
