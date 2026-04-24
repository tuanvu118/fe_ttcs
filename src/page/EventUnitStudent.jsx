import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarBlank, CheckCircle, Clock, Users, Warning } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Modal, message } from 'antd'
import {
  cancelStudentHtskEventRegistration,
  getStudentHtskOverview,
  registerStudentHtskEvent,
} from '../service/UnitHTSKService'
import '../style/EventUnitStudent.css'

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function EventUnitStudent({ unitId, eventId }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      const res = await getStudentHtskOverview(eventId, unitId)
      setData(res)
    } catch (err) {
      setError(err?.message || 'Không thể tải thông tin sự kiện HTSK.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await getStudentHtskOverview(eventId, unitId)
        if (!cancelled) {
          setData(res)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Không thể tải thông tin sự kiện HTSK.')
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [eventId, unitId])

  if (loading) {
    return (
      <div className="event-unit-student-page">
        <div className="eus-state">
          <p>Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="event-unit-student-page">
        <div className="eus-state">
          <Warning size={44} color="#ef4444" />
          <p>{error || 'Không tìm thấy thông tin sự kiện.'}</p>
          <button className="eus-btn" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const isRegistered = Boolean(data?.my_registration?.is_registered)
  const regOpen = Boolean(data?.is_registration_open)
  const canRegister = Boolean(data?.can_register)
  const remaining = Number(data?.slot_remaining ?? 0)
  const canCancelRegistration = isRegistered && regOpen

  const handleRegister = async () => {
    if (!canRegister || isRegistered) return
    setRegistering(true)
    try {
      await registerStudentHtskEvent(eventId, unitId)
      message.success('Đăng ký sự kiện thành công.')
      await loadOverview()
    } catch (err) {
      message.error(err?.message || 'Đăng ký thất bại.')
    } finally {
      setRegistering(false)
    }
  }

  const handleCancelRegistration = () => {
    if (!canCancelRegistration) return
    Modal.confirm({
      title: 'Xác nhận hủy đăng ký',
      content: 'Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không?',
      okText: 'Hủy đăng ký',
      okType: 'danger',
      cancelText: 'Quay lại',
      centered: true,
      onOk: async () => {
        setRegistering(true)
        try {
          await cancelStudentHtskEventRegistration(eventId, unitId)
          message.success('Đã hủy đăng ký thành công.')
          await loadOverview()
        } catch (err) {
          message.error(err?.message || 'Hủy đăng ký thất bại.')
        } finally {
          setRegistering(false)
        }
      },
    })
  }

  return (
    <div className="event-unit-student-page">
      <section className="eus-hero">
        <button className="eus-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <span className="eus-tag">ĐĂNG KÍ THAM GIA SỰ KIỆN THEO ĐƠN VỊ</span>
        <h1>{data.title || 'Chi tiết sự kiện'}</h1>
        <p>{data.unit_name || '—'}</p>
      </section>

      <main className="eus-grid">
        <section className="eus-card">
          <h2>Tổng quan sự kiện</h2>
          <div className="eus-row">
            <span><CalendarBlank size={16} /> Diễn ra</span>
            <strong>{formatDateTime(data.event_start)} - {formatDateTime(data.event_end)}</strong>
          </div>
          <div className="eus-row">
            <span><Clock size={16} /> Đăng ký</span>
            <strong>{formatDateTime(data.registration_start)} - {formatDateTime(data.registration_end)}</strong>
          </div>
          <div className="eus-row">
            <span><Users size={16} /> Số lượng</span>
            <strong>{data.slot_used ?? 0}/{data.slot_limit ?? 0} (còn {remaining})</strong>
          </div>
          <div className="eus-desc">
            <h3>Mô tả</h3>
            <p>{data.description || 'Không có mô tả.'}</p>
          </div>
        </section>

        <aside className="eus-card">
          <h2>Trạng thái của bạn</h2>
          <div className={`eus-status ${isRegistered ? 'ok' : 'idle'}`}>
            <CheckCircle size={20} weight="fill" />
            <span>{isRegistered ? 'Bạn đã đăng ký vào danh sách.' : 'Bạn chưa đăng ký vào danh sách.'}</span>
          </div>

          <div className="eus-note">
            <p><b>Trạng thái nộp danh sách:</b> {data.submission_status || '—'}</p>
            <p><b>Mở đăng ký:</b> {regOpen ? 'Đang mở' : 'Đã đóng'}</p>
            <p><b>Có thể đăng ký:</b> {canRegister ? 'Có' : 'Không'}</p>
          </div>
          {isRegistered ? (
            <button
              className="eus-btn"
              onClick={handleCancelRegistration}
              disabled={!canCancelRegistration || registering}
            >
              {registering ? 'Đang xử lý...' : canCancelRegistration ? 'Hủy đăng ký' : 'Không thể hủy đăng ký'}
            </button>
          ) : (
            <button
              className="eus-btn"
              onClick={handleRegister}
              disabled={!canRegister || registering}
            >
              {registering
                ? 'Đang đăng ký...'
                : canRegister
                  ? 'Đăng ký tham gia'
                  : 'Không thể đăng ký'}
            </button>
          )}
        </aside>
      </main>
    </div>
  )
}
