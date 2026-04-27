const PWA_INSTALL_AVAILABILITY_EVENT = 'ptit:pwa-install-availability'

let deferredInstallPrompt = null
let lifecycleInitialized = false

const isBrowserSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

const notifyInstallAvailability = () => {
  if (typeof window === 'undefined') return
  const available = isBrowserSupported() && Boolean(deferredInstallPrompt)
  window.dispatchEvent(
    new CustomEvent(PWA_INSTALL_AVAILABILITY_EVENT, {
      detail: { available },
    }),
  )
}

const setupLifecycleListeners = () => {
  if (lifecycleInitialized || typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
    notifyInstallAvailability()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    notifyInstallAvailability()
  })

  lifecycleInitialized = true
}

export const initializePwaInstallLifecycle = () => {
  setupLifecycleListeners()
  notifyInstallAvailability()
}

export const getPwaInstallEventName = () => PWA_INSTALL_AVAILABILITY_EVENT

export const isInstallPromptAvailable = () =>
  isBrowserSupported() && Boolean(deferredInstallPrompt)

export const requestNotificationAndInstall = async () => {
  if (!isBrowserSupported()) {
    return {
      ok: false,
      message: 'Thiết bị/trình duyệt chưa hỗ trợ cài đặt ứng dụng.',
    }
  }

  try {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission()
    }

    if (Notification.permission !== 'granted') {
      return {
        ok: false,
        message: 'Bạn chưa cấp quyền nhận thông báo.',
      }
    }

    if (!deferredInstallPrompt) {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone

      if (standalone) {
        return {
          ok: true,
          message: 'Ứng dụng đã được cài đặt.',
        }
      }

      return {
        ok: false,
        message:
          'Thông báo đã bật nhưng trình duyệt chưa cho phép prompt cài đặt lúc này. Hãy thử lại sau hoặc dùng menu "Install app"/"Thêm vào màn hình chính".',
      }
    }

    await deferredInstallPrompt.prompt()
    const choiceResult = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    notifyInstallAvailability()

    if (choiceResult?.outcome === 'accepted') {
      return {
        ok: true,
        message: 'Đang tiến hành cài đặt ứng dụng.',
      }
    }

    return {
      ok: false,
      message: 'Bạn đã hủy cài đặt ứng dụng.',
    }
  } catch (error) {
    const detail = error?.message ? ` (${error.message})` : ''
    return {
      ok: false,
      message: `Không thể mở hộp thoại cài đặt ứng dụng${detail}.`,
    }
  }
}
