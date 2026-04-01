import UserAvatar from './users/UserAvatar'
import { PATHS, primaryNavigation } from '../utils/routes'

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4a4 4 0 0 0-4 4v2.1c0 .72-.2 1.43-.58 2.05L6 14.5h12l-1.42-2.35a4 4 0 0 1-.58-2.05V8a4 4 0 0 0-4-4Zm-2 13a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 1.15 2.71 2.94.28-2.22 1.96.65 2.88L12 9.48 9.48 10.83l.65-2.88-2.22-1.96 2.94-.28L12 3Zm0 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12a7.5 7.5 0 0 1 0-.38M19.5 12a7.5 7.5 0 0 0 0-.38M6.22 17.78l.27-.27M17.51 6.49l.27-.27M6.22 6.22l.27.27M17.51 17.51l.27.27"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TopNav({ currentPath, isAuthenticated, dashboardPath, user, navigate }) {
  function renderNavButton(path, label) {
    const isActive =
      currentPath === path ||
      (path === PATHS.units && currentPath.startsWith(`${PATHS.units}/`)) ||
      (path === PATHS.club && currentPath.startsWith(`${PATHS.club}/`)) ||
      (path === PATHS.manage && currentPath.startsWith(PATHS.manage))

    return (
      <button
        key={path}
        type="button"
        className={isActive ? 'nav-link active' : 'nav-link'}
        onClick={() => navigate(path)}
      >
        {label}
      </button>
    )
  }

  return (
    <header className="topnav">
      <div className="topnav-side">
        <button type="button" className="brand" onClick={() => navigate(PATHS.home)}>
          Đoàn Thanh Niên
        </button>
      </div>

      <nav className="nav-group topnav-center" aria-label="Điều hướng chính">
        {primaryNavigation.map((item) => renderNavButton(item.path, item.label))}
      </nav>

      <div className="topnav-side topnav-side-right">
        {!isAuthenticated && (
          <button
            type="button"
            className="nav-action-button nav-action-button-light"
            onClick={() => navigate(PATHS.login)}
          >
            Đăng nhập
          </button>
        )}

        {isAuthenticated && (
          <>
            <button type="button" className="topnav-icon-button" aria-label="Thông báo">
              <BellIcon />
            </button>

            {dashboardPath && (
              <button
                type="button"
                className="topnav-icon-button"
                aria-label="Khu vực quản trị"
                onClick={() => navigate(dashboardPath)}
              >
                <GearIcon />
              </button>
            )}

            <button
              type="button"
              className={currentPath === PATHS.profile ? 'topnav-avatar-button active' : 'topnav-avatar-button'}
              aria-label="Thông tin cá nhân"
              onClick={() => navigate(PATHS.profile)}
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl || user?.avatar_url}
                fullName={user?.fullName || user?.full_name}
                size="small"
              />
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default TopNav
