import { useEffect, useState } from 'react'
import { Button, Form, InputNumber, Modal, message } from 'antd'
import { createUnitEventAttendanceSession } from '../../../service/apiAdminEvent'
import { getCurrentCoordinates } from '../../../utils/geolocation'
import { setLatestQrSession } from './qrStorage'
import styles from './QRModalUnitEvent.module.css'

export default function QRModalUnitEvent({ open, onClose, eventId }) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [qrCreated, setQrCreated] = useState(false)
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })

  useEffect(() => {
    if (!open) {
      setQrCreated(false)
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
      setLatestQrSession(response)
      setQrCreated(true)
      message.success('Đã tạo phiên điểm danh QR.')
    } catch (error) {
      message.error(error?.message || 'Không thể tạo phiên điểm danh.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenQrTab = (event) => {
    event?.preventDefault()
    event?.stopPropagation()
    window.open('/qr', '_blank', 'noopener,noreferrer')
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
            {qrCreated ? (
              <Button htmlType="button" onClick={handleOpenQrTab}>
                Mở QR
              </Button>
            ) : null}
          </div>
        </Form>
      </div>
    </Modal>
  )
}
