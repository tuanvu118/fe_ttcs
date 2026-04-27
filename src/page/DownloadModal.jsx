import { useEffect, useState } from 'react'
import { Button, Modal, message } from 'antd'
import styles from './DownloadModal.module.css'
import {
  getPwaInstallEventName,
  initializePwaInstallLifecycle,
  isInstallPromptAvailable,
  requestNotificationAndInstall,
} from '../service/pwaService'

const INSTALL_FLAG_KEY = 'ptit_pwa_installed'
const INSTALL_FLAG_COOKIE = 'ptit_pwa_installed'

function readInstallCookie() {
  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${INSTALL_FLAG_COOKIE}=`))
  if (!match) {
    return null
  }
  const value = match.split('=')[1]
  return value === '1' ? '1' : '0'
}

function writeInstallMarkers(value) {
  const normalized = value === '1' ? '1' : '0'
  window.localStorage.setItem(INSTALL_FLAG_KEY, normalized)
  document.cookie = `${INSTALL_FLAG_COOKIE}=${normalized}; path=/; max-age=31536000; samesite=lax`
}

export default function DownloadModal({
  open,
  onClose,
  noticeMessage = '',
  closable = true,
  maskClosable = true,
}) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [isInstallAvailable, setIsInstallAvailable] = useState(isInstallPromptAvailable())
  const [permissions, setPermissions] = useState({
    notifications: 'prompt',
    camera: 'prompt',
    geolocation: 'prompt',
  })

  function getInstalledState() {
    const standaloneOnIos = window.navigator.standalone === true
    const standaloneOnOthers = window.matchMedia('(display-mode: standalone)').matches
    const rememberedInstall =
      window.localStorage.getItem(INSTALL_FLAG_KEY) === '1' || readInstallCookie() === '1'

    if (standaloneOnIos || standaloneOnOthers) {
      // If app is opened in standalone mode, persist marker for browser tabs too.
      writeInstallMarkers('1')
      return true
    }
    return Boolean(rememberedInstall)
  }

  useEffect(() => {
    initializePwaInstallLifecycle()
    setIsInstalled(getInstalledState())
    const eventName = getPwaInstallEventName()
    function handleInstallEvent(event) {
      const available = Boolean(event?.detail?.available)
      setIsInstallAvailable(available)
      if (available) {
        // If install prompt is available again, the app is likely not installed.
        writeInstallMarkers('0')
        setIsInstalled(false)
      }
    }
    function handleAppInstalled() {
      setIsInstalled(true)
      writeInstallMarkers('1')
      message.success('Ứng dụng đã được cài đặt.')
    }

    window.addEventListener(eventName, handleInstallEvent)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener(eventName, handleInstallEvent)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    setIsInstalled(getInstalledState())

    async function refreshPermissionStates() {
      const next = {
        notifications: Notification.permission,
        camera: 'prompt',
        geolocation: 'prompt',
      }

      if (navigator.permissions?.query) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' })
          next.camera = cameraPermission.state
        } catch {
          // Browser does not support querying camera permission.
        }
        try {
          const geoPermission = await navigator.permissions.query({ name: 'geolocation' })
          next.geolocation = geoPermission.state
        } catch {
          // Browser does not support querying geolocation permission.
        }
      }

      setPermissions(next)
    }

    async function autoRequestPermissions() {
      await refreshPermissionStates()

      if (Notification.permission !== 'granted') {
        try {
          const result = await Notification.requestPermission()
          setPermissions((prev) => ({ ...prev, notifications: result }))
        } catch {
          // Ignore browser-level block and keep current status.
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((track) => track.stop())
        setPermissions((prev) => ({ ...prev, camera: 'granted' }))
      } catch {
        setPermissions((prev) => ({
          ...prev,
          camera: prev.camera === 'granted' ? 'granted' : 'denied',
        }))
      }

      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        })
        setPermissions((prev) => ({ ...prev, geolocation: 'granted' }))
      } catch {
        setPermissions((prev) => ({
          ...prev,
          geolocation: prev.geolocation === 'granted' ? 'granted' : 'denied',
        }))
      }

      await refreshPermissionStates()
    }

    autoRequestPermissions()
  }, [open])

  const allPermissionsGranted =
    permissions.notifications === 'granted' &&
    permissions.camera === 'granted' &&
    permissions.geolocation === 'granted'

  const installSupported = isInstallAvailable && !isInstalled
  const canInstall = allPermissionsGranted && !isInstalled

  async function requestNotificationPermission() {
    try {
      const result = await Notification.requestPermission()
      setPermissions((prev) => ({ ...prev, notifications: result }))
    } catch {
      message.error('Không thể yêu cầu quyền thông báo.')
    }
  }

  async function requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermissions((prev) => ({ ...prev, camera: 'granted' }))
    } catch {
      setPermissions((prev) => ({ ...prev, camera: 'denied' }))
      message.error('Không thể cấp quyền truy cập camera.')
    }
  }

  async function requestLocationPermission() {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      setPermissions((prev) => ({ ...prev, geolocation: 'granted' }))
    } catch {
      setPermissions((prev) => ({ ...prev, geolocation: 'denied' }))
      message.error('Không thể cấp quyền truy cập vị trí.')
    }
  }

  function permissionText(state) {
    if (state === 'granted') return 'Đã cho phép'
    if (state === 'denied') return 'Đã từ chối'
    return 'Chưa cấp quyền'
  }

  async function handleInstall() {
    setInstalling(true)
    try {
      const result = await requestNotificationAndInstall()
      if (result.ok) {
        message.success(result.message)
        setIsInstalled(getInstalledState())
      } else {
        message.warning(result.message)
      }
    } catch (error) {
      console.error(error)
      message.error('Cài đặt ứng dụng thất bại. Vui lòng thử lại.')
    } finally {
      setInstalling(false)
      setIsInstallAvailable(isInstallPromptAvailable())
    }
  }

  return (
    <Modal
      title="Tải ứng dụng"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      closable={closable}
      maskClosable={maskClosable}
    >
      <div className={styles.content}>
        <h3 className={styles.title}>Cài PTIT dưới dạng ứng dụng</h3>
        <p className={styles.description}>
          Cài đặt ứng dụng để mở nhanh từ màn hình chính, trải nghiệm toàn màn hình và dùng ổn định hơn.
        </p>
        <p className={styles.installStatus}>
          Trạng thái tải:
          <span className={isInstalled ? styles.statusInstalled : styles.statusPending}>
            {isInstalled ? ' Đã tải' : ' Chưa tải'}
          </span>
        </p>
        {noticeMessage ? <p className={styles.notice}>{noticeMessage}</p> : null}

        {isInstalled ? (
          <>
            <p className={styles.installed}>Ứng dụng đã được cài đặt trên thiết bị này.</p>
            <p className={styles.openAppHint}>
              Để quét QR, hãy mở ứng dụng PTIT đã cài trên màn hình chính rồi vào chức năng Quét QR.
            </p>
          </>
        ) : null}

        <p className={styles.hint}>
          Nếu nút cài đặt chưa khả dụng, hãy mở menu trình duyệt và chọn <strong>Install app</strong> hoặc <strong>Thêm vào màn hình chính</strong>.
        </p>
        <div className={styles.permissionList}>
          <div className={styles.permissionItem}>
            <span>Cho phép thông báo</span>
            <div className={styles.permissionAction}>
              <span className={styles.permissionState}>{permissionText(permissions.notifications)}</span>
              <Button size="small" onClick={requestNotificationPermission} disabled={permissions.notifications === 'granted'}>
                Cho phép
              </Button>
            </div>
          </div>
          <div className={styles.permissionItem}>
            <span>Cho phép truy cập camera</span>
            <div className={styles.permissionAction}>
              <span className={styles.permissionState}>{permissionText(permissions.camera)}</span>
              <Button size="small" onClick={requestCameraPermission} disabled={permissions.camera === 'granted'}>
                Cho phép
              </Button>
            </div>
          </div>
          <div className={styles.permissionItem}>
            <span>Cho phép truy cập vị trí</span>
            <div className={styles.permissionAction}>
              <span className={styles.permissionState}>{permissionText(permissions.geolocation)}</span>
              <Button size="small" onClick={requestLocationPermission} disabled={permissions.geolocation === 'granted'}>
                Cho phép
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.actionRow}>
          <Button type="primary" onClick={handleInstall} loading={installing} disabled={!canInstall}>
            Cài đặt ứng dụng
          </Button>
        </div>
        {!installSupported ? (
          <p className={styles.hint}>
            Trình duyệt hiện tại có thể không hỗ trợ popup cài đặt trực tiếp. Sau khi đủ quyền, hãy dùng menu trình duyệt để cài app.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
