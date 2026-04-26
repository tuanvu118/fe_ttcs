import { useEffect, useState } from 'react'
import { Button, Input, InputNumber, Typography, message } from 'antd'
import { getCurrentCoordinates } from '../utils/geolocation'
import { scanAttendanceQr } from '../service/apiStudentEvent'
import DownloadModal from './DownloadModal'

const { TextArea } = Input
const { Paragraph, Text } = Typography

function QrScanPage() {
  const [accessReady, setAccessReady] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [gateMessage, setGateMessage] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  const evaluateAccess = async () => {
    setCheckingAccess(true)
    const standaloneOnIos = window.navigator.standalone === true
    const standaloneOnOthers = window.matchMedia('(display-mode: standalone)').matches
    const isInstalled = Boolean(standaloneOnIos || standaloneOnOthers)

    const notifications = Notification.permission
    let camera = 'prompt'
    let geolocation = 'prompt'

    if (navigator.permissions?.query) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' })
        camera = cameraPermission.state
      } catch {
        // Browser does not support querying camera permission.
      }
      try {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' })
        geolocation = geoPermission.state
      } catch {
        // Browser does not support querying geolocation permission.
      }
    }

    const allPermissionsGranted =
      notifications === 'granted' && camera === 'granted' && geolocation === 'granted'
    const ready = isInstalled && allPermissionsGranted

    setAccessReady(ready)
    if (!ready) {
      const missing = []
      if (!isInstalled) missing.push('chưa cài đặt ứng dụng')
      if (notifications !== 'granted') missing.push('chưa cấp quyền thông báo')
      if (camera !== 'granted') missing.push('chưa cấp quyền camera')
      if (geolocation !== 'granted') missing.push('chưa cấp quyền vị trí')
      setGateMessage(`Bạn cần hoàn tất các điều kiện trước khi quét QR: ${missing.join(', ')}.`)
    } else {
      setGateMessage('')
    }
    setCheckingAccess(false)
  }

  useEffect(() => {
    evaluateAccess()
    const onAppInstalled = () => evaluateAccess()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluateAccess()
      }
    }
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('focus', evaluateAccess)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('focus', evaluateAccess)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!accessReady) {
      return undefined
    }
    let cancelled = false
    async function loadCoordinates() {
      setLoadingLocation(true)
      try {
        const { latitude, longitude } = await getCurrentCoordinates()
        if (!cancelled) {
          setCoordinates({ latitude, longitude })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || 'Không thể lấy vị trí hiện tại.')
        }
      } finally {
        if (!cancelled) {
          setLoadingLocation(false)
        }
      }
    }
    loadCoordinates()
    return () => {
      cancelled = true
    }
  }, [accessReady])

  const handleScan = async () => {
    if (!qrValue.trim()) {
      message.warning('Vui lòng nhập qr_value.')
      return
    }
    if (!validFrom || !validUntil) {
      message.warning('Vui lòng nhập đầy đủ thời gian hợp lệ từ và hợp lệ đến.')
      return
    }

    const fromMs = new Date(validFrom).getTime()
    const untilMs = new Date(validUntil).getTime()
    const nowMs = Date.now()
    if (!Number.isFinite(fromMs) || !Number.isFinite(untilMs) || untilMs < fromMs) {
      message.error('Khoảng thời gian hợp lệ không đúng định dạng.')
      return
    }
    if (nowMs < fromMs || nowMs > untilMs) {
      message.error('QR không hợp lệ.')
      return
    }

    setSubmitting(true)
    try {
      let latitude = coordinates.latitude
      let longitude = coordinates.longitude

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const current = await getCurrentCoordinates()
        latitude = current.latitude
        longitude = current.longitude
        setCoordinates(current)
      }

      const result = await scanAttendanceQr({
        qrValue: qrValue.trim(),
        latitude,
        longitude,
      })
      setScanResult(result)
      message.success('Quét QR điểm danh thành công.')
    } catch (error) {
      message.error(error?.message || 'Quét QR thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!accessReady) {
    return (
      <>
        <DownloadModal
          open
          onClose={() => {}}
          noticeMessage={checkingAccess ? 'Đang kiểm tra điều kiện truy cập tính năng quét QR…' : gateMessage}
          closable={false}
          maskClosable={false}
        />
        <section className="page-card" style={{ display: 'grid', gap: 12 }}>
          <h1>Quét QR điểm danh</h1>
          <Text type="secondary">
            {checkingAccess
              ? 'Đang kiểm tra trạng thái cài đặt ứng dụng và quyền truy cập...'
              : 'Vui lòng hoàn tất yêu cầu trong modal để tiếp tục quét QR.'}
          </Text>
        </section>
      </>
    )
  }

  return (
    <section className="page-card" style={{ display: 'grid', gap: 16 }}>
      <h1>Quét QR điểm danh</h1>

      <div style={{ display: 'grid', gap: 8 }}>
        <Text strong>qr_value</Text>
        <TextArea
          rows={6}
          placeholder="Dán hoặc nhập qr_value tại đây"
          value={qrValue}
          onChange={(event) => setQrValue(event.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <Text strong>Tọa độ</Text>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Vĩ độ</Text>
            <InputNumber
              value={coordinates.latitude}
              onChange={(value) =>
                setCoordinates((prev) => ({
                  ...prev,
                  latitude: typeof value === 'number' ? value : null,
                }))
              }
              placeholder={loadingLocation ? 'Đang lấy...' : 'Nhập vĩ độ'}
              step={0.000001}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Kinh độ</Text>
            <InputNumber
              value={coordinates.longitude}
              onChange={(value) =>
                setCoordinates((prev) => ({
                  ...prev,
                  longitude: typeof value === 'number' ? value : null,
                }))
              }
              placeholder={loadingLocation ? 'Đang lấy...' : 'Nhập kinh độ'}
              step={0.000001}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <Text strong>Thời gian hiệu lực</Text>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Hợp lệ từ</Text>
            <Input
              type="datetime-local"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Hợp lệ đến</Text>
            <Input
              type="datetime-local"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <Button type="primary" onClick={handleScan} loading={submitting} disabled={loadingLocation}>
          Gửi điểm danh
        </Button>
      </div>

      {scanResult ? (
        <div>
          <Text strong>Kết quả:</Text>
          <Paragraph
            style={{
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            {JSON.stringify(scanResult, null, 2)}
          </Paragraph>
        </div>
      ) : null}
    </section>
  )
}

export default QrScanPage
