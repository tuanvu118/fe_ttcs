import { useEffect, useMemo, useState } from 'react'
import { Button, Form, InputNumber, Modal, Typography, message } from 'antd'
import { createUnitEventAttendanceSession } from '../../../service/apiAdminEvent'
import { getCurrentCoordinates } from '../../../utils/geolocation'
import QRRender from './QR_render'
import QRRenderDev from './QR_render_dev'
import styles from './QRModalUnitEvent.module.css'

const { Text } = Typography

function findActiveWindow(windows, nowMs) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return null
  }
  return windows.find((window) => {
    const fromMs = new Date(window.valid_from).getTime()
    const untilMs = new Date(window.valid_until).getTime()
    return Number.isFinite(fromMs) && Number.isFinite(untilMs) && nowMs >= fromMs && nowMs < untilMs
  }) || null
}

export default function QRModalUnitEvent({ open, onClose, eventId }) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })

  useEffect(() => {
    if (!open) {
      setSessionData(null)
      setCoordinates({ latitude: null, longitude: null })
      return
    }
    form.setFieldsValue({
      durationSeconds: 120,
      windowSeconds: 60,
      radiusMeters: 300,
    })

    let cancelled = false
    async function hydrateLocationOnOpen() {
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

    setLoadingLocation(true)
    hydrateLocationOnOpen()

    return () => {
      cancelled = true
    }
  }, [open, form])

  useEffect(() => {
    if (!open || !sessionData) {
      return undefined
    }
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open, sessionData])

  const activeWindow = useMemo(
    () => findActiveWindow(sessionData?.windows, nowMs),
    [sessionData?.windows, nowMs],
  )

  const remainingSeconds = useMemo(() => {
    if (!activeWindow) return 0
    const untilMs = new Date(activeWindow.valid_until).getTime()
    if (!Number.isFinite(untilMs)) return 0
    return Math.ceil((untilMs - nowMs) / 1000)
  }, [activeWindow, nowMs])

  const sessionEnded = useMemo(() => {
    if (!sessionData?.windows?.length) {
      return false
    }
    const lastWindow = sessionData.windows[sessionData.windows.length - 1]
    const lastUntilMs = new Date(lastWindow?.valid_until).getTime()
    return Number.isFinite(lastUntilMs) && nowMs >= lastUntilMs
  }, [sessionData, nowMs])

  const fetchLocation = async () => {
    setLoadingLocation(true)
    try {
      const { latitude, longitude } = await getCurrentCoordinates()
      setCoordinates({ latitude, longitude })
      message.success('Đã lấy vị trí hiện tại.')
      return { latitude, longitude }
    } catch (error) {
      message.error(error?.message || 'Không thể lấy vị trí hiện tại.')
      throw error
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleCreateSession = async (values) => {
    const durationSeconds = Number(values.durationSeconds || 0)
    const durationMs = durationSeconds * 1000
    if (durationMs <= 0) {
      message.warning('Thời lượng phiên điểm danh phải lớn hơn 0 giây.')
      return
    }

    setSubmitting(true)
    try {
      let latitude = coordinates.latitude
      let longitude = coordinates.longitude

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const coords = await fetchLocation()
        latitude = coords.latitude
        longitude = coords.longitude
      }

      const sessionStart = new Date()
      const sessionEnd = new Date(sessionStart.getTime() + durationMs)
      const payload = {
        session_start: sessionStart.toISOString(),
        session_end: sessionEnd.toISOString(),
        window_seconds: Number(values.windowSeconds),
        latitude,
        longitude,
        radius_meters: Number(values.radiusMeters),
      }
      const response = await createUnitEventAttendanceSession(eventId, payload)
      setSessionData(response)
      setNowMs(Date.now())
      message.success('Đã tạo phiên điểm danh QR.')
    } catch (error) {
      message.error(error?.message || 'Không thể tạo phiên điểm danh.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="QR Điểm danh"
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(760px, calc(100vw - 24px))"
      destroyOnClose
    >
      <div className={styles.modalBody}>
        <Form form={form} layout="vertical" onFinish={handleCreateSession} className={styles.formRoot}>
          <div className={styles.mainInputs}>
            <Form.Item
              label="Thời lượng (giây)"
              name="durationSeconds"
              rules={[{ required: true, message: 'Nhập số giây.' }]}
            >
              <InputNumber min={1} max={10800} className={styles.numberInput} />
            </Form.Item>
            <Form.Item
              label="Đổi QR mỗi (giây)"
              name="windowSeconds"
              rules={[{ required: true, message: 'Nhập số giây đổi QR.' }]}
            >
              <InputNumber min={5} max={600} className={styles.numberInput} />
            </Form.Item>
            <Form.Item
              label="Bán kính (m)"
              name="radiusMeters"
              rules={[{ required: true, message: 'Nhập bán kính điểm danh.' }]}
            >
              <InputNumber min={1} max={5000} className={styles.numberInput} />
            </Form.Item>
          </div>

          <div className={styles.geoPanel}>
            <div className={styles.geoCell}>
              <span className={styles.geoLabel}>Vĩ độ</span>
              <span className={styles.geoValue}>
                {Number.isFinite(coordinates.latitude) ? coordinates.latitude : loadingLocation ? 'Đang lấy...' : '—'}
              </span>
            </div>
            <div className={styles.geoCell}>
              <span className={styles.geoLabel}>Kinh độ</span>
              <span className={styles.geoValue}>
                {Number.isFinite(coordinates.longitude) ? coordinates.longitude : loadingLocation ? 'Đang lấy...' : '—'}
              </span>
            </div>
          </div>

          <div className={styles.actionRow}>
            <Button type="primary" htmlType="submit" loading={submitting} disabled={loadingLocation}>
              Tạo phiên điểm danh
            </Button>
          </div>
        </Form>

        {sessionData ? (
          <Modal
            title="QR điểm danh"
            open={open && Boolean(sessionData)}
            footer={null}
            onCancel={() => setSessionData(null)}
            width="min(720px, calc(100vw - 24px))"
            maskStyle={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(15, 23, 42, 0.48)',
            }}
            destroyOnClose
          >
            {sessionEnded ? (
              <div className={styles.endSessionBox}>
                <Text className={styles.endSessionText}>Phiên điểm danh đã kết thúc.</Text>
                <Button onClick={() => setSessionData(null)}>Quay lại</Button>
              </div>
            ) : (
              <QRRender
                sessionData={sessionData}
                currentWindow={activeWindow}
                remainingSeconds={remainingSeconds}
              />
            )}
          </Modal>
        ) : (
          <Text className={styles.emptyText}>Tạo phiên để bắt đầu hiển thị QR value theo từng cửa sổ hiệu lực.</Text>
        )}
      </div>
    </Modal>
  )
}
