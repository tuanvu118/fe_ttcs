import { House, QrCode, UserCircle } from '@phosphor-icons/react'
import { PATHS } from '../utils/routes'

const ICON_SIZE = 22
const CENTER_ICON_SIZE = 26

export default function MobileBottomNav({ currentPath, isAuthenticated, navigate }) {
  const profileTarget = isAuthenticated ? PATHS.profile : PATHS.login
  const profileActive = isAuthenticated ? currentPath === PATHS.profile : currentPath === PATHS.login

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh trên di động">
      <button
        type="button"
        className={currentPath === PATHS.home ? 'mobile-bottom-nav__item active' : 'mobile-bottom-nav__item'}
        onClick={() => navigate(PATHS.home)}
      >
        <House size={ICON_SIZE} weight="duotone" aria-hidden />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={currentPath === PATHS.qrScan ? 'mobile-bottom-nav__item mobile-bottom-nav__item--center active' : 'mobile-bottom-nav__item mobile-bottom-nav__item--center'}
        onClick={() => navigate(PATHS.qrScan)}
      >
        <QrCode size={CENTER_ICON_SIZE} weight="fill" aria-hidden />
        <span>Quét QR</span>
      </button>

      <button
        type="button"
        className={profileActive ? 'mobile-bottom-nav__item active' : 'mobile-bottom-nav__item'}
        onClick={() => navigate(profileTarget)}
      >
        <UserCircle size={ICON_SIZE} weight="duotone" aria-hidden />
        <span>Profile</span>
      </button>
    </nav>
  )
}
