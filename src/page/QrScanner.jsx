import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, message } from 'antd'
import { scanAttendanceQr } from '../service/apiStudentEvent'
import { LOCATION_STORAGE_KEY } from '../service/locationHeartbeatService'
import { readStorage } from '../utils/storage'

const { Text } = Typography

function getCoordinatesFromStorage() {
  const stored = readStorage(LOCATION_STORAGE_KEY)
  const latitude = Number(stored?.latitude)
  const longitude = Number(stored?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  return { latitude, longitude }
}

export default function QrScanner({ onCancel }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanError, setScanError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanFrameRef = useRef(null)
  const detectorRef = useRef(null)
  const scanTimeoutRef = useRef(null)
  const cameraActiveRef = useRef(false)
  const handlingScanRef = useRef(false)

  function toDateTimeLocalInput(value) {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  function parseScannedPayload(rawValue) {
    if (!rawValue) return
    try {
      const parsed = JSON.parse(rawValue)
      const parsedQr = parsed?.qr_value ?? parsed?.qrValue ?? rawValue
      const parsedFrom = parsed?.valid_from ?? parsed?.validFrom ?? ''
      const parsedUntil = parsed?.valid_until ?? parsed?.validUntil ?? ''
      return {
        qrValue: String(parsedQr),
        validFrom: parsedFrom ? toDateTimeLocalInput(parsedFrom) : '',
        validUntil: parsedUntil ? toDateTimeLocalInput(parsedUntil) : '',
      }
    } catch {
      return {
        qrValue: rawValue,
        validFrom: '',
        validUntil: '',
      }
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
            void handleDetectedQr(qrRawValue)
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
      if (
        String(error?.message || '').includes('Barcode Detection API') ||
        String(error?.message || '').includes('qr_code')
      ) {
        message.error(error?.message || 'Thiết bị/trình duyệt chưa hỗ trợ Barcode Detection API.')
        navigate('/')
        return
      }
      setScanError(error?.message || 'Không thể mở camera để quét QR.')
      stopCamera()
    }
  }

  async function handleRetryCamera() {
    stopCamera()
    setScanError('')
    await startCameraScan()
  }

  async function handleDetectedQr(rawValue) {
    if (handlingScanRef.current) {
      return
    }
    handlingScanRef.current = true
    stopCamera()
    setSubmitting(true)

    try {
      const parsedPayload = parseScannedPayload(rawValue)
      const scannedQrValue = parsedPayload?.qrValue?.trim() || ''
      const scannedValidFrom = parsedPayload?.validFrom || ''
      const scannedValidUntil = parsedPayload?.validUntil || ''

      if (!scannedQrValue) {
        message.error('QR không hợp lệ.')
        return
      }

      if (!scannedValidFrom || !scannedValidUntil) {
        message.error('QR không có đầy đủ thời gian hiệu lực.')
        return
      }

      const fromMs = new Date(scannedValidFrom).getTime()
      const untilMs = new Date(scannedValidUntil).getTime()
      const nowMs = Date.now()

      if (!Number.isFinite(fromMs) || !Number.isFinite(untilMs) || untilMs < fromMs) {
        message.error('Khoảng thời gian hợp lệ không đúng định dạng.')
        return
      }

      if (nowMs < fromMs || nowMs > untilMs) {
        message.error('QR không hợp lệ.')
        return
      }

      const storedCoords = getCoordinatesFromStorage()
      if (!storedCoords) {
        message.error('Không có tọa độ trong localStorage để gửi điểm danh.')
        return
      }

      await scanAttendanceQr({
        qrValue: scannedQrValue,
        latitude: storedCoords.latitude,
        longitude: storedCoords.longitude,
      })

      message.success('Quét QR điểm danh thành công.')
      navigate('/')
    } catch (error) {
      message.error(error?.message || 'Quét QR thất bại.')
    } finally {
      setSubmitting(false)
      handlingScanRef.current = false
    }
  }

  useEffect(() => {
    void startCameraScan()
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          width: '90vw',
          height: '50vh',
          maxWidth: 560,
          maxHeight: 560,
          minWidth: 280,
          minHeight: 280,
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: '#000',
          objectFit: 'cover',
          display: cameraActive ? 'block' : 'none',
        }}
      />
      {submitting ? <Text type="secondary">Đang gửi điểm danh...</Text> : null}
      {!cameraActive && !submitting ? <Text type="secondary">Đang khởi động camera...</Text> : null}
      {scanError ? <Text type="danger">{scanError}</Text> : null}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {scanError && !submitting ? (
          <Button
            type="primary"
            onClick={() => void handleRetryCamera()}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              minWidth: 164,
              height: 40,
            }}
          >
            Mở lại camera
          </Button>
        ) : null}
        {onCancel && (
          <Button
            onClick={onCancel}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              minWidth: 100,
              height: 40,
            }}
          >
            Hủy quét
          </Button>
        )}
      </div>
    </div>
  )
}
