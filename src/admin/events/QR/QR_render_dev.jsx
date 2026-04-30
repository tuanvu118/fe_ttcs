import { Button, Typography } from 'antd'
import { QRCodeCanvas } from 'qrcode.react'
import styles from './QR_render_dev.module.css'

const { Paragraph, Text } = Typography

function formatDateTime(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString('vi-VN')
}

export default function QRRenderDev({ sessionData, currentWindow, remainingSeconds }) {
  if (!sessionData || !currentWindow) {
    return <p className={styles.empty}>Chưa có mã QR hiệu lực.</p>
  }

  const copyCurrentQr = async () => {
    try {
      await navigator.clipboard.writeText(currentWindow.qr_value || '')
    } catch {
      // noop, component cha sẽ hiển thị cảnh báo nếu cần
    }
  }

  const qrPayload = JSON.stringify({
    valid_from: currentWindow.valid_from,
    valid_until: currentWindow.valid_until,
    qr_value: currentWindow.qr_value || '',
  })

  return (
    <div className={styles.root}>
      <div className={styles.meta}>
        <Text strong className={styles.sessionId}>Phiên điểm danh: {sessionData.session_id}</Text>
        <Text type="secondary" className={styles.subText}>
          Cửa sổ QR #{currentWindow.sequence} | Còn hiệu lực: {Math.max(0, remainingSeconds)}s
        </Text>
        <Text type="secondary" className={styles.subText}>
          Hợp lệ từ {formatDateTime(currentWindow.valid_from)} đến{' '}
          {formatDateTime(currentWindow.valid_until)}
        </Text>
      </div>

      <Paragraph copyable={{ text: currentWindow.qr_value || '' }} className={styles.qrValue}>
        {currentWindow.qr_value}
      </Paragraph>

      <div className={styles.actions}>
        <Button onClick={copyCurrentQr}>Copy QR value</Button>
      </div>

      <div className={styles.qrPreviewSection}>
        <Text strong className={styles.qrPreviewTitle}>Mã QR điểm danh</Text>
        <div className={styles.qrPreviewCanvasWrap}>
          <QRCodeCanvas value={qrPayload} size={220} level="M" includeMargin />
        </div>
      </div>
    </div>
  )
}
