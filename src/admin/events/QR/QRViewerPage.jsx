import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import QRRender from './QR_render'
import { clearLatestQrSession, getLatestQrSession } from './qrStorage'
import styles from './QRViewerPage.module.css'

function findActiveWindow(windows, nowMs) {
  if (!Array.isArray(windows) || windows.length === 0) return null
  return windows.find((windowItem) => {
    const fromMs = new Date(windowItem.valid_from).getTime()
    const untilMs = new Date(windowItem.valid_until).getTime()
    return Number.isFinite(fromMs) && Number.isFinite(untilMs) && nowMs >= fromMs && nowMs < untilMs
  }) || null
}

export default function QRViewerPage() {
  const [sessionData, setSessionData] = useState(() => getLatestQrSession())
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeWindow = useMemo(
    () => findActiveWindow(sessionData?.windows, nowMs),
    [sessionData?.windows, nowMs],
  )

  const remainingSeconds = useMemo(() => {
    if (!activeWindow) return 0
    const untilMs = new Date(activeWindow.valid_until).getTime()
    if (!Number.isFinite(untilMs)) return 0
    return Math.max(0, Math.ceil((untilMs - nowMs) / 1000))
  }, [activeWindow, nowMs])

  const sessionEnded = useMemo(() => {
    if (!sessionData?.windows?.length) return false
    const lastWindow = sessionData.windows[sessionData.windows.length - 1]
    const lastUntilMs = new Date(lastWindow?.valid_until).getTime()
    return Number.isFinite(lastUntilMs) && nowMs >= lastUntilMs
  }, [sessionData, nowMs])

  useEffect(() => {
    if (sessionEnded) {
      clearLatestQrSession()
    }
  }, [sessionEnded])

  const handleReload = () => {
    setSessionData(getLatestQrSession())
    setNowMs(Date.now())
  }

  if (!sessionData) {
    return (
      <section className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Không có dữ liệu QR</h1>
          <p className={styles.message}>
            Chưa có phiên QR mới trong trình duyệt này. Hãy quay lại trang quản trị và bấm Tạo QR.
          </p>
          <Button onClick={handleReload}>Tải lại dữ liệu</Button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>QR Điểm danh</h1>
        {sessionEnded ? (
          <div className={styles.stateBox}>
            <p className={styles.message}>Phiên QR đã hết hạn và không còn hiệu lực.</p>
            <Button onClick={handleReload}>Kiểm tra phiên mới nhất</Button>
          </div>
        ) : activeWindow ? (
          <>
            <p className={styles.countdown}>
              QR hiện tại còn <strong>{remainingSeconds}s</strong>
            </p>
            <QRRender
              sessionData={sessionData}
              currentWindow={activeWindow}
              remainingSeconds={remainingSeconds}
            />
          </>
        ) : (
          <div className={styles.stateBox}>
            <p className={styles.message}>
              Chưa tới cửa sổ QR hiệu lực hoặc dữ liệu không hợp lệ.
            </p>
            <Button onClick={handleReload}>Tải lại dữ liệu</Button>
          </div>
        )}
      </div>
    </section>
  )
}

