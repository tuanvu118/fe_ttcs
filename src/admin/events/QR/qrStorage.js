const QR_STORAGE_KEY = 'QR'

export function setLatestQrSession(sessionData) {
  if (!sessionData) return
  const payload = {
    sessionData,
    savedAt: Date.now(),
  }
  window.localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(payload))
}

export function getLatestQrSession() {
  const raw = window.localStorage.getItem(QR_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.sessionData || null
  } catch {
    return null
  }
}

export function clearLatestQrSession() {
  window.localStorage.removeItem(QR_STORAGE_KEY)
}

