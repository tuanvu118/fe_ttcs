import { useEffect, useRef, useState } from 'react'
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
  const [isGateModalOpen, setIsGateModalOpen] = useState(true)
  const [isGateModalDismissed, setIsGateModalDismissed] = useState(false)
  const [qrValue, setQrValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanError, setScanError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanFrameRef = useRef(null)
  const detectorRef = useRef(null)
  const scanTimeoutRef = useRef(null)
  const cameraActiveRef = useRef(false)

  function toDateTimeLocalInput(value) {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  function applyScannedPayload(rawValue) {
    if (!rawValue) return
    try {
      const parsed = JSON.parse(rawValue)
      const parsedQr = parsed?.qr_value ?? parsed?.qrValue ?? rawValue
      const parsedFrom = parsed?.valid_from ?? parsed?.validFrom ?? ''
      const parsedUntil = parsed?.valid_until ?? parsed?.validUntil ?? ''

      setQrValue(String(parsedQr))
      if (parsedFrom) setValidFrom(toDateTimeLocalInput(parsedFrom))
      if (parsedUntil) setValidUntil(toDateTimeLocalInput(parsedUntil))
    } catch {
      setQrValue(rawValue)
    }
  }

  function stopCamera() {
    cameraActiveRef.current = false
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  function scanLoop() {
    const video = videoRef.current
    const detector = detectorRef.current
    if (!video || !detector || !cameraActiveRef.current) {
      return
    }

    if (video.readyState < 2) {
      scanFrameRef.current = requestAnimationFrame(scanLoop)
      return
    }

    detector.detect(video)
      .then((codes) => {
        if (Array.isArray(codes) && codes.length > 0) {
          const qrRawValue = codes[0]?.rawValue || ''
          if (qrRawValue) {
            setScanError('')
            applyScannedPayload(qrRawValue)
            message.success('Đã quét QR từ camera.')
            stopCamera()
            return
          }
        }
        scanFrameRef.current = requestAnimationFrame(scanLoop)
      })
      .catch(() => {
        scanFrameRef.current = requestAnimationFrame(scanLoop)
      })
  }

  async function ensureQrDetector() {
    if (!('BarcodeDetector' in window)) {
      throw new Error('Thiết bị/trình duyệt chưa hỗ trợ Barcode Detection API.')
    }

    if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
      const supportedFormats = await window.BarcodeDetector.getSupportedFormats()
      if (Array.isArray(supportedFormats) && !supportedFormats.includes('qr_code')) {
        throw new Error('Trình duyệt có BarcodeDetector nhưng không hỗ trợ định dạng qr_code.')
      }
    }

    if (!detectorRef.current) {
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
    }

    return detectorRef.current
  }

  async function startCameraScan() {
    setScanError('')
    if (!window.isSecureContext) {
      setScanError('Quét QR chỉ hoạt động trong secure context (HTTPS hoặc localhost).')
      return
    }

    try {
      await ensureQrDetector()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      cameraActiveRef.current = true
      setCameraActive(true)
      scanTimeoutRef.current = setTimeout(() => {
        if (scanFrameRef.current) {
          setScanError('Chưa nhận diện được QR. Hãy tăng sáng, giữ máy ổn định và đưa mã vào gần camera hơn.')
        }
      }, 12000)
      scanFrameRef.current = requestAnimationFrame(scanLoop)
    } catch (error) {
      setScanError(error?.message || 'Không thể mở camera để quét QR.')
      stopCamera()
    }
  }

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
      if (isGateModalDismissed) {
        return
      }
      setIsGateModalOpen(true)
      return
    }
    setIsGateModalDismissed(false)
  }, [accessReady, isGateModalDismissed])

  useEffect(() => {
    return () => {
      stopCamera()
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
          open={isGateModalOpen}
          onClose={() => {
            setIsGateModalOpen(false)
            setIsGateModalDismissed(true)
          }}
          noticeMessage={checkingAccess ? 'Đang kiểm tra điều kiện truy cập tính năng quét QR…' : gateMessage}
          closable
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
        <Text strong>Quét QR bằng camera</Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={startCameraScan} disabled={cameraActive}>Mở camera quét QR</Button>
          <Button onClick={stopCamera} disabled={!cameraActive}>Tắt camera</Button>
        </div>
        {scanError ? <Text type="danger">{scanError}</Text> : null}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#000',
            display: cameraActive ? 'block' : 'none',
          }}
        />
        <Text type="secondary">
          Sau khi quét thành công, hệ thống sẽ tự điền qr_value và thời gian hiệu lực.
          Bạn kiểm tra lại rồi bấm Gửi điểm danh.
        </Text>
        {cameraActive ? <Text type="secondary">Camera đang hoạt động, vui lòng đưa mã QR vào khung hình.</Text> : null}
      </div>

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
