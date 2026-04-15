import { useState, useEffect } from 'react'
import { 
  CalendarBlank, 
  MapPin, 
  Users, 
  Trophy, 
  Clock, 
  ArrowLeft,
  ShareNetwork,
  BookmarkSimple,
  CheckCircle,
  Warning
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { 
  getEventPublicDetail, 
  getMyEventRegistrationDetail,
  registerPublicEvent,
  cancelRegistration
} from '../service/apiStudentEvent'
import { Modal, Form, Input, Select, Button, message } from 'antd'
import '../style/EventDetailPage.css'

export default function EventDetailPage({ eventId }) {
  const navigate = useNavigate()
  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false)
  const [regForm] = Form.useForm()

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      // 1. Try to get registration detail first (only works if logged in and registered)
      let detail = null
      try {
        detail = await getMyEventRegistrationDetail(eventId)
      } catch (err) {
        // Not registered or not logged in, ignore
      }

      if (detail && detail.event_id) {
        // Student is registered
        setEventData(detail)
        setIsRegistered(true)
      } else {
        // 2. Fetch public detail instead
        const publicEvent = await getEventPublicDetail(eventId)
        setEventData(publicEvent)
        setIsRegistered(false)
      }
    } catch (err) {
      console.error('Failed to load event detail', err)
      setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    // If event has form fields, open modal
    if (eventData.form_fields && eventData.form_fields.length > 0) {
      setIsRegModalOpen(true)
      return
    }

    // Otherwise, fast register
    setSubmitting(true)
    try {
      await registerPublicEvent(eventId)
      message.success('Đăng ký tham gia thành công!')
      await loadData() // Refresh status
    } catch (err) {
      message.error(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalSubmit = async (values) => {
    setSubmitting(true)
    try {
      // Format answers: [{ field_id, value }]
      const answers = Object.entries(values).map(([field_id, value]) => ({
        field_id,
        value: String(value)
      }))

      await registerPublicEvent(eventId, answers)
      message.success('Gửi đăng ký thành công!')
      setIsRegModalOpen(false)
      regForm.resetFields()
      await loadData()
    } catch (err) {
      message.error(err.message || 'Đăng ký thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    Modal.confirm({
      title: 'Xác nhận hủy đăng ký',
      content: 'Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không? Hành động này không thể hoàn tác.',
      okText: 'Xác nhận hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      centered: true,
      onOk: async () => {
        setSubmitting(true)
        try {
          await cancelRegistration(eventId)
          message.success('Đã hủy đăng ký tham gia sự kiện.')
          await loadData() // Refresh status
        } catch (err) {
          message.error(err.message || 'Hủy đăng ký thất bại.')
        } finally {
          setSubmitting(false)
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="event-detail-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Đang tải thông tin sự kiện...</p>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="event-detail-page" style={{ alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Warning size={48} color="#ef4444" />
        <p>{error || 'Sự kiện không tồn tại.'}</p>
        <button className="btn-register" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    )
  }

  const startDate = new Date(eventData.event_start)
  const endDate = new Date(eventData.event_end)
  const isExpired = new Date() > endDate
  
  // Registration status logic
  const regStart = new Date(eventData.registration_start || eventData.event_start)
  const regEnd = new Date(eventData.registration_end || eventData.event_start)
  const now = new Date()
  const canRegister = now >= regStart && now <= regEnd && !isExpired
  const formatDateTime = (date) => {
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="event-detail-page">
      {/* Hero Section */}
      <section className="event-hero">
        <div className="event-hero-bg">
          <img src={eventData.image_url || 'https://via.placeholder.com/1920x1080?text=Sự+Kiện+Sinh+Viên'} alt={eventData.title} />
        </div>
        <div className="event-hero-overlay" />
        
        <div className="event-hero-content">
          <div className="hero-top-info">
            <button className="back-btn-minimal" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> QUAY LẠI
            </button>
            <span className="event-tag-premium">SỰ KIỆN SINH VIÊN</span>
          </div>
          
          <h1 className="event-hero-title-premium">{eventData.title}</h1>
          
          <div className="event-meta-horizontal">
            <div className="meta-item-inline">
              <CalendarBlank size={20} weight="fill" />
              <span>{startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
            <div className="meta-item-inline">
              <MapPin size={20} weight="fill" />
              <span>{eventData.location || 'Địa điểm xem chi tiết bên dưới'}</span>
            </div>
          </div>
        </div>
      </section>


      {/* Body Section */}
      <main className="event-detail-body">
        <section className="event-main-content">
          {/* Section: Tổng quan */}
          <div className="detail-section">
            <h2 className="detail-section-title">Tổng quan</h2>
            <div className="time-item-row">
              <span className="time-item-label">BẮT ĐẦU</span>
              <span className="time-item-value">{formatDateTime(startDate)}</span>
            </div>
            <div className="time-item-row">
              <span className="time-item-label">KẾT THÚC</span>
              <span className="time-item-value">{formatDateTime(endDate)}</span>
            </div>
            <div className="time-item-row">
              <span className="time-item-label">ĐỊA ĐIỂM</span>
              <span className="time-item-value">{eventData.location || "Chưa cập nhật địa điểm cụ thể"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h2 className="detail-section-title">Thông tin sự kiện</h2>
            <div 
              className="rich-text-content-student"
              dangerouslySetInnerHTML={{ __html: eventData.description }} 
            />
          </div>


          
          {eventData.form_fields?.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">Nội dung đăng ký</h2>
              <p style={{ color: '#64748b' }}>Sự kiện này yêu cầu cung cấp thêm thông tin khi đăng ký.</p>
              {/* Form implementation for later */}
            </div>
          )}
        </section>

        {/* Floating Sidebar Card */}
        <aside className="event-sidebar">
          <div className="registration-card">
            <div className="reg-status">
              <span className="reg-status-label">Trạng thái đăng ký</span>
              {isRegistered ? (
                <div className="reg-status-value open">
                  <CheckCircle size={20} weight="fill" />
                  <span>Đã đăng ký tham gia</span>
                </div>
              ) : isExpired ? (
                <div className="reg-status-value closed">
                  <span className="status-dot" />
                  <span>Sự kiện đã kết thúc</span>
                </div>
              ) : now < regStart ? (
                <div className="reg-status-value upcoming">
                  <span className="status-dot" />
                  <span>Sắp mở đăng ký</span>
                </div>
              ) : canRegister ? (
                <div className="reg-status-value open">
                  <span className="status-dot" />
                  <span>Đang mở đăng ký</span>
                </div>
              ) : (
                <div className="reg-status-value closed">
                  <span className="status-dot" />
                  <span>Đã đóng đăng ký</span>
                </div>
              ) }

              <div className="reg-deadline-small">
                <Clock size={16} />
                <span>Hạn: {regEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - {regEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            </div>

            {isRegistered ? (
              <button 
                className="reg-action-btn btn-cancel" 
                onClick={handleCancel}
                disabled={submitting || isExpired}
              >
                {submitting ? 'Đang xử lý...' : 'Hủy tham gia'}
              </button>
            ) : (
              <button 
                className={`reg-action-btn ${canRegister ? 'btn-register' : 'btn-disabled'}`}
                disabled={!canRegister || submitting}
                onClick={handleRegister}
              >
                {submitting ? 'Đang xử lý...' : canRegister ? 'Đăng ký tham gia' : 'Không khả dụng'}
              </button>
            )}

            <div className="sidebar-point-reward">
              <div className="point-reward-icon">
                <Trophy size={24} weight="fill" />
              </div>
              <div className="point-reward-text">
                <span className="point-reward-label">Quyền lợi</span>
                <span className="point-reward-value">+{eventData.point || 0} Điểm rèn luyện</span>
              </div>
            </div>

            {eventData.max_participants > 0 && (
              <div className="capacity-info">
                <div className="capacity-label">
                  <span>Sức chứa:</span>
                  <span>{eventData.max_participants} chỗ</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Registration Modal */}
      <Modal
        title={null}
        open={isRegModalOpen}
        onCancel={() => setIsRegModalOpen(false)}
        footer={null}
        centered
        width={600}
        className="premium-reg-modal"
      >
        <div className="modal-header-premium">
          <div className="modal-header-icon">
            <CheckCircle size={32} weight="fill" color="#003d79" />
          </div>
          <h2 className="modal-title">Đăng ký tham gia</h2>
          <p className="modal-subtitle">Vui lòng cung cấp thêm một số thông tin để hoàn tất đăng ký cho sự kiện <strong>{eventData.title}</strong></p>
        </div>

        <Form
          form={regForm}
          layout="vertical"
          onFinish={handleModalSubmit}
          className="registration-dynamic-form"
        >
          {eventData.form_fields?.map((field) => (
            <Form.Item
              key={field.id}
              name={field.id}
              label={field.label}
              rules={[{ required: field.required, message: `Vui lòng nhập ${field.label.toLowerCase()}` }]}
            >
              {field.field_type === 'textarea' ? (
                <Input.TextArea placeholder="..." rows={4} />
              ) : field.field_type === 'select' ? (
                <Select placeholder="Chọn một tùy chọn">
                  {field.options?.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                </Select>
              ) : (
                <Input placeholder="..." />
              )}
            </Form.Item>
          ))}

          <div className="modal-footer-actions">
            <Button className="btn-modal-cancel" onClick={() => setIsRegModalOpen(false)}>Hủy</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="btn-modal-submit"
              loading={submitting}
            >
              Xác nhận đăng ký
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
