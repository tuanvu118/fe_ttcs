import { HouseSimple, QrCode, User, CalendarDots, ClockCounterClockwise } from '@phosphor-icons/react'
import { PATHS } from '../utils/routes'
import styles from './MobileBottomNav.module.css'

const ICON_SIZE = 25
const CENTER_ICON_SIZE = 36

function isHistoryTab(search = '') {
  return new URLSearchParams(search).get('tab') === 'history'
}

export default function MobileBottomNav({ currentPath, currentSearch, isAuthenticated, navigate }) {
  const profileTarget = isAuthenticated ? PATHS.profile : PATHS.login
  const historyActive = isAuthenticated && currentPath === PATHS.profile && isHistoryTab(currentSearch)
  const profileActive = isAuthenticated
    ? currentPath === PATHS.profile && !historyActive
    : currentPath === PATHS.login
  const historyTarget = isAuthenticated ? `${PATHS.profile}?tab=history` : PATHS.login

  return (
    <nav className={styles.nav} aria-label="Điều hướng nhanh trên di động">
      <button
        type="button"
        className={currentPath === PATHS.home ? `${styles.item} ${styles.active}` : styles.item}
        onClick={() => navigate(PATHS.home)}
      >
        <HouseSimple size={ICON_SIZE} weight={currentPath === PATHS.home ? 'fill' : 'regular'} aria-hidden />
        <span>Trang chủ</span>
      </button>

      <button
        type="button"
        className={currentPath === PATHS.event ? `${styles.item} ${styles.active}` : styles.item}
        onClick={() => navigate(PATHS.event)}
      >
        <CalendarDots size={ICON_SIZE} weight={currentPath === PATHS.event ? 'fill' : 'regular'} aria-hidden />
        <span>Sự kiện</span>
      </button>

      <button
        type="button"
        className={styles.centerSlot}
        aria-hidden="true"
        tabIndex={-1}
      >
      </button>

      <button
        type="button"
        className={historyActive ? `${styles.item} ${styles.active}` : styles.item}
        onClick={() => navigate(historyTarget)}
      >
        <ClockCounterClockwise size={ICON_SIZE} weight={historyActive ? 'fill' : 'regular'} aria-hidden />
        <span>Lịch sử</span>
      </button>

      <button
        type="button"
        className={profileActive ? `${styles.item} ${styles.active}` : styles.item}
        onClick={() => navigate(profileTarget)}
      >
        <User size={ICON_SIZE} weight={profileActive ? 'fill' : 'regular'} aria-hidden />
        <span>Cá nhân</span>
      </button>

      <button
        type="button"
        className={currentPath === PATHS.scanQR ? `${styles.fab} ${styles.activeFab}` : styles.fab}
        onClick={() => navigate(PATHS.scanQR)}
        aria-label="Quét QR"
      >
        <QrCode size={CENTER_ICON_SIZE} weight={currentPath === PATHS.scanQR ? 'fill' : 'regular'} aria-hidden />
      </button>
    </nav>
  )
}
