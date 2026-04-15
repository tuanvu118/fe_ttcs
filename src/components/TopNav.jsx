import { GearSix, UserCircle } from '@phosphor-icons/react'
import { PATHS, primaryNavigation } from '../utils/routes'

const navIconSize = 18

const BRAND_LOGO_PTIT_SRC = '/LogoPTIT11.svg'
const BRAND_LOGO_DOAN_SRC = '/HuyHieuDoan.png'

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

function TopNav({ currentPath, isAuthenticated, dashboardPath, navigate }) {
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
          <span className="topnav-brand-logos" aria-hidden>
            <img
              src={BRAND_LOGO_PTIT_SRC}
              alt=""
              className="topnav-brand-logo topnav-brand-logo--ptit"
              width={48}
              height={48}
              decoding="async"
            />
            <img
              src={BRAND_LOGO_DOAN_SRC}
              alt=""
              className="topnav-brand-logo topnav-brand-logo--doan"
              width={48}
              height={48}
              decoding="async"
            />
          </span>
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
            <button
              type="button"
              className={
                currentPath === PATHS.qrScan
                  ? 'nav-action-button nav-action-button-light active'
                  : 'nav-action-button nav-action-button-light'
              }
              onClick={() => navigate(PATHS.qrScan)}
            >
              Quet QR
            </button>

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
                <GearSix size={navIconSize} weight="regular" aria-hidden />
              </button>
            )}

            <button
              type="button"
              className={
                currentPath === PATHS.profile ? 'topnav-icon-button active' : 'topnav-icon-button'
              }
              aria-label="Thông tin cá nhân"
              onClick={() => navigate(PATHS.profile)}
            >
              <UserCircle size={navIconSize} weight="regular" aria-hidden />
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default TopNav
