import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, message, Slider } from 'antd'
import jsQR from 'jsqr'
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
  const useFallbackRef = useRef(false)
  const canvasRef = useRef(null)
  if (!canvasRef.current) {
    canvasRef.current = document.createElement('canvas')
  }

  const [zoomSupported, setZoomSupported] = useState(true) // Always true because we support digital zoom
  const [nativeZoomSupported, setNativeZoomSupported] = useState(false)
  const nativeZoomSupportedRef = useRef(false)
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 5, step: 0.1 })
  const [zoomVal, setZoomVal] = useState(1)
  const zoomValRef = useRef(1)

  const handleZoomChange = async (value) => {
    setZoomVal(value)
    zoomValRef.current = value
    if (nativeZoomSupportedRef.current && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ zoom: value }],
          })
        } catch (err) {
          console.error('Failed to apply native zoom constraint:', err)
        }
      }
    }
  }

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
    setNativeZoomSupported(false)
    nativeZoomSupportedRef.current = false
    setZoomVal(1)
    zoomValRef.current = 1
  }

  function scanLoop() {
    const video = videoRef.current
    if (!video || !cameraActiveRef.current) {
      return
    }

    if (video.readyState < 2) {
      scanFrameRef.current = requestAnimationFrame(scanLoop)
      return
    }

    // Capture the frame on the offscreen canvas
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')

    const currentZoom = zoomValRef.current
    if (!nativeZoomSupportedRef.current && currentZoom > 1) {
      // Calculate cropped source rectangle for digital zoom
      const sWidth = video.videoWidth / currentZoom
      const sHeight = video.videoHeight / currentZoom
      const sx = (video.videoWidth - sWidth) / 2
      const sy = (video.videoHeight - sHeight) / 2
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height)
    } else {
      // Normal or native zoom
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    if (useFallbackRef.current) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          setScanError('')
          void handleDetectedQr(code.data)
          return
        }
      } catch (err) {
        console.error('jsQR error:', err)
      }
      scanFrameRef.current = requestAnimationFrame(scanLoop)
    } else {
      const detector = detectorRef.current
      if (!detector) {
        useFallbackRef.current = true
        scanFrameRef.current = requestAnimationFrame(scanLoop)
        return
      }
      // Detect on canvas instead of video to support digital zoom!
      detector.detect(canvas)
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
  }

  async function ensureQrDetector() {
    if (!('BarcodeDetector' in window)) {
      useFallbackRef.current = true
      return null
    }

    try {
      if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
        const supportedFormats = await window.BarcodeDetector.getSupportedFormats()
        if (Array.isArray(supportedFormats) && !supportedFormats.includes('qr_code')) {
          useFallbackRef.current = true
          return null
        }
      }

      if (!detectorRef.current) {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      }
      useFallbackRef.current = false
      return detectorRef.current
    } catch {
      useFallbackRef.current = true
      return null
    }
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

      // Check camera zoom capabilities
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        if (typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities()
          if (caps.zoom) {
            setNativeZoomSupported(true)
            nativeZoomSupportedRef.current = true
            setZoomRange({
              min: caps.zoom.min || 1,
              max: caps.zoom.max || 5,
              step: caps.zoom.step || 0.1,
            })
            setZoomVal(caps.zoom.min || 1)
            zoomValRef.current = caps.zoom.min || 1
          } else {
            setNativeZoomSupported(false)
            nativeZoomSupportedRef.current = false
            setZoomRange({ min: 1, max: 5, step: 0.1 })
            setZoomVal(1)
            zoomValRef.current = 1
          }
        } else {
          setNativeZoomSupported(false)
          nativeZoomSupportedRef.current = false
          setZoomRange({ min: 1, max: 5, step: 0.1 })
          setZoomVal(1)
          zoomValRef.current = 1
        }
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
      <div style={{
        position: 'relative',
        width: '90vw',
        height: '50vh',
        maxWidth: 560,
        maxHeight: 560,
        minWidth: 280,
        minHeight: 280,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        background: '#000',
      }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none',
            transform: `scale(${!nativeZoomSupported ? zoomVal : 1})`,
            transition: 'transform 0.1s ease-out',
            transformOrigin: 'center',
          }}
        />
      </div>
      {cameraActive && zoomSupported && (
        <div style={{ width: '80%', maxWidth: 400, margin: '8px 0', textAlign: 'center' }}>
          <Text style={{ display: 'block', marginBottom: 6 }}>Thu phóng: {zoomVal}x</Text>
          <Slider
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            value={zoomVal}
            onChange={handleZoomChange}
            tooltip={{ formatter: (v) => `${v}x` }}
          />
        </div>
      )}
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
