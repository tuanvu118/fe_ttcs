import { QRCodeCanvas } from 'qrcode.react'
import styles from './QR_render.module.css'

export default function QRRender({ sessionData, currentWindow, remainingSeconds }) {
  if (!sessionData || !currentWindow) {
    return <p className={styles.empty}>Chưa có mã QR hiệu lực.</p>
  }

  const qrPayload = JSON.stringify({
    valid_from: currentWindow.valid_from,
    valid_until: currentWindow.valid_until,
    qr_value: currentWindow.qr_value || '',
  })

  return (
    <div className={styles.root}>
      <div className={styles.qrPreviewCanvasWrap}>
        <QRCodeCanvas value={qrPayload} size={360} level="M" includeMargin />
      </div>
    </div>
  )
}
