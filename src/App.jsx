import TopNav from './components/TopNav'
import { useAuth } from './hooks/useAuth'
import { useRouter } from './hooks/useRouter'
import AdminPage from './page/AdminPage'
import EventPage from './page/EventPage'
import ForbiddenPage from './page/ForbiddenPage'
import HomePage from './page/HomePage'
import LoginPage from './page/LoginPage'
import NotFoundPage from './page/NotFoundPage'
import ProfilePage from './page/ProfilePage'
import AboutPage from './page/AboutPage'
import LogoutPage from './page/LogoutPage'
import RegisterPage from './page/RegisterPage'
import { PATHS, getRouteMeta } from './utils/routes'

function App() {
  const { pathname, navigate, replace } = useRouter()
  const { user, isAuthenticated, isAdmin, isLoadingUser, login, logout } =
    useAuth()
  const routeMeta = getRouteMeta(pathname)

  let page = <NotFoundPage />

  if (routeMeta) {
    if (routeMeta.requiresAuth && !isAuthenticated) {
      page = <LoginPage onLogin={login} navigate={navigate} />
    } else if (routeMeta.requiresAuth && isLoadingUser) {
      page = <section className="page-card">Đang tải thông tin người dùng...</section>
    } else if (routeMeta.requiresAdmin && !isAdmin) {
      page = <ForbiddenPage />
    } else {
      switch (pathname) {
        case PATHS.home:
          page = <HomePage />
          break
        case PATHS.event:
          page = <EventPage />
          break
        case PATHS.about:
          page = <AboutPage />
          break
        case PATHS.login:
          page = (
            <LoginPage
              isAuthenticated={isAuthenticated}
              user={user}
              onLogin={login}
              navigate={navigate}
            />
          )
          break
        case PATHS.register:
          page = <RegisterPage navigate={navigate} />
          break
        case PATHS.profile:
          page = <ProfilePage user={user} isLoadingUser={isLoadingUser} />
          break
        case PATHS.admin:
          page = <AdminPage />
          break
        case PATHS.logout:
          page = <LogoutPage onLogout={logout} replace={replace} />
          break
        default:
          page = <NotFoundPage />
      }
    }
  }

  return (
    <div className="app-shell">
      <TopNav
        currentPath={pathname}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        navigate={navigate}
      />
      <main className="page-content">{page}</main>
    </div>
  )
}

export default App
