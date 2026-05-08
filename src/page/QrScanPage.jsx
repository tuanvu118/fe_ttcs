import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, message, Input } from 'antd'
import { getCurrentCoordinates } from '../utils/geolocation'
import { submitManualAttendanceCode } from '../service/apiStudentEvent'
import { LOCATION_STORAGE_KEY } from '../service/locationHeartbeatService'
import { readStorage } from '../utils/storage'
import DownloadModal from './DownloadModal'
import QrScanner from './QrScanner'

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

function QrScanPage() {
  const navigate = useNavigate()
  const [accessReady, setAccessReady] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [gateMessage, setGateMessage] = useState('')
  const [isGateModalOpen, setIsGateModalOpen] = useState(true)
  const [isGateModalDismissed, setIsGateModalDismissed] = useState(false)
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const [showScanner, setShowScanner] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [submittingManual, setSubmittingManual] = useState(false)

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
      setGateMessage(`Bạn cần hoàn tất các điều kiện trước khi điểm danh: ${missing.join(', ')}.`)
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
    if (!accessReady) {
      return undefined
    }
    let cancelled = false
    async function loadCoordinates() {
      setLoadingLocation(true)
      try {
        let current = getCoordinatesFromStorage()
        if (!current) {
          current = await getCurrentCoordinates()
        }
        if (!cancelled) {
          setCoordinates({
            latitude: current.latitude,
            longitude: current.longitude,
          })
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

  const handleSubmitManualCode = async () => {
    if (!manualCode.trim()) {
      message.warning('Vui lòng nhập mã điểm danh.')
      return
    }

    let lat = coordinates.latitude
    let lng = coordinates.longitude

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const stored = getCoordinatesFromStorage()
      if (stored) {
        lat = stored.latitude
        lng = stored.longitude
      } else {
        message.error('Không có tọa độ vị trí để gửi điểm danh.')
        return
      }
    }

    setSubmittingManual(true)
    try {
      await submitManualAttendanceCode({ 
        code: manualCode.trim(), 
        latitude: lat, 
        longitude: lng 
      })
      message.success('Điểm danh thành công.')
      navigate('/')
    } catch (error) {
      message.error(error?.message || 'Gửi mã thất bại.')
    } finally {
      setSubmittingManual(false)
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
          noticeMessage={checkingAccess ? 'Đang kiểm tra điều kiện truy cập tính năng điểm danh…' : gateMessage}
          closable
          maskClosable={false}
        />
        <section className="page-card" style={{ display: 'grid', gap: 12 }}>
          <h1>Điểm danh</h1>
          <Text type="secondary">
            {checkingAccess
              ? 'Đang kiểm tra trạng thái cài đặt ứng dụng và quyền truy cập...'
              : 'Vui lòng hoàn tất yêu cầu trong modal để tiếp tục điểm danh.'}
          </Text>
        </section>
      </>
    )
  }

  return (
    <section
      className="page-card"
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {showScanner ? (
        <QrScanner onCancel={() => setShowScanner(false)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}>
          <h2 style={{ textAlign: 'center', margin: 0, fontSize: '1.5rem' }}>Điểm danh sự kiện</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <Text strong style={{ fontSize: '1.1rem' }}>Nhập mã điểm danh thủ công</Text>
            <Text type="secondary" style={{ fontSize: '0.9rem', marginBottom: 8 }}>Mã được hiển thị phía dưới QR Code trên màn hình của BTC.</Text>
            <Input 
              placeholder="VD: 12345" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              size="large"
              style={{ borderRadius: 8, textAlign: 'center', fontSize: '1.5rem', letterSpacing: 4 }}
              maxLength={10}
            />
            <Button 
              type="primary" 
              size="large" 
              onClick={handleSubmitManualCode}
              loading={submittingManual}
              style={{ borderRadius: 8, marginTop: 8, fontWeight: 600 }}
            >
              Gửi mã điểm danh
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <Text type="secondary" style={{ padding: '0 12px', fontSize: '0.9rem' }}>HOẶC</Text>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </div>

          <Button 
            size="large"
            onClick={() => setShowScanner(true)}
            style={{ borderRadius: 12, height: 56, fontWeight: 600, fontSize: '1.1rem', background: '#fff', border: '2px solid #0075de', color: '#0075de' }}
          >
            Mở Camera quét QR
          </Button>
        </div>
      )}
    </section>
  )
}

export default QrScanPage
