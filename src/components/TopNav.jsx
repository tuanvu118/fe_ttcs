import { PATHS, primaryNavigation } from '../utils/routes'

function TopNav({ currentPath, isAuthenticated, isAdmin, navigate }) {
  function renderNavButton(path, label) {
    const isActive = currentPath === path

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

  function renderActionButton(path, label) {
    const isActive = currentPath === path

    return (
      <button
        type="button"
        className={isActive ? 'nav-action-button active' : 'nav-action-button'}
        onClick={() => navigate(path)}
      >
        {label}
      </button>
    )
  }

  return (
    <header className="topnav">
      <div className="topnav-side">
        <button
          type="button"
          className="brand"
          onClick={() => navigate(PATHS.home)}
        >
          ĐTN
        </button>
      </div>

      <nav className="nav-group topnav-center" aria-label="Điều hướng chính">
        {primaryNavigation.map((item) => renderNavButton(item.path, item.label))}
      </nav>

      <div className="topnav-side topnav-side-right">
        {!isAuthenticated && renderActionButton(PATHS.login, 'Đăng nhập')}
        {isAuthenticated && renderActionButton(PATHS.profile, 'Hồ sơ')}
        {isAuthenticated && isAdmin && renderActionButton(PATHS.admin, 'Quản trị')}
        {isAuthenticated && renderActionButton(PATHS.logout, 'Đăng xuất')}
      </div>
    </header>
  )
}

export default TopNav
