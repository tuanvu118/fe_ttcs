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
import { useAuth } from '../hooks/useAuth'
import { PATHS } from '../utils/routes'
import { Modal, Form, Input, Select, Button, message, Radio } from 'antd'
import '../style/EventDetailPage.css'

export default function EventDetailPage({ eventId }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
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
      // 1. Luôn lấy thông tin công khai trước để đảm bảo dữ liệu sự kiện đầy đủ và mới nhất
      const publicEvent = await getEventPublicDetail(eventId)
      
      // 2. Nếu đã đăng nhập, lấy thêm thông tin đăng ký cụ thể của user
      let registrationDetail = null
      if (isAuthenticated) {
        try {
          registrationDetail = await getMyEventRegistrationDetail(eventId)
        } catch (err) {
          // Chưa đăng ký, bỏ qua
        }
      }

      if (registrationDetail) {
        // Merge thông tin: Ưu tiên dữ liệu công khai, bổ sung answers, registered_at, checked_in
        setEventData({
          ...publicEvent,
          ...registrationDetail
        })
        setIsRegistered(true)
      } else {
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
    if (!isAuthenticated) {
      message.info('Vui lòng đăng nhập để đăng ký tham gia sự kiện.')
      navigate(PATHS.login)
      return
    }

    // If event has form fields, open modal
    if (eventData.form_fields && eventData.form_fields.length > 0) {
      setIsRegModalOpen(true)
      return
    }

    // Otherwise, fast register
    setSubmitting(true)
    const idempotencyKey = crypto.randomUUID?.() || Math.random().toString(36).substring(2)
    
    try {
      await registerPublicEvent(eventId, [], idempotencyKey)
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
    const idempotencyKey = crypto.randomUUID?.() || Math.random().toString(36).substring(2)

    try {
      // Format answers: [{ field_id, value }]
      const answers = Object.entries(values)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([field_id, value]) => ({
          field_id,
          value: Array.isArray(value) ? value.join(', ') : String(value)
        }))

      await registerPublicEvent(eventId, answers, idempotencyKey)
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
  const isFull = eventData.max_participants > 0 && (eventData.current_participants || 0) >= eventData.max_participants
  const canRegister = now >= regStart && now <= regEnd && !isExpired && !isFull
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
          
          <div className="event-hero-footer">
            <div className="event-meta-horizontal">
              <div className="meta-item-inline">
                <CalendarBlank size={20} weight="fill" />
                <span>{startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
              <div className="meta-item-inline">
                <MapPin size={20} weight="fill" />
                <span>{eventData.location || 'Địa điểm xem bên dưới'}</span>
              </div>
            </div>

            {!isRegistered && canRegister && (
              <button className="hero-quick-reg-btn" onClick={handleRegister}>
                Đăng ký ngay
              </button>
            )}
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
                <div className={`reg-status-value ${eventData?.checked_in ? 'checked-in' : 'open'}`}>
                  <CheckCircle size={20} weight="fill" />
                  <span>{eventData?.checked_in ? 'Đã điểm danh tham gia' : 'Đã đăng ký tham gia'}</span>
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
              ) : isFull ? (
                <div className="reg-status-value closed">
                  <span className="status-dot" />
                  <span>Sự kiện đã hết slot</span>
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
                disabled={(!isAuthenticated ? false : !canRegister) || submitting}
                onClick={handleRegister}
              >
                {submitting ? 'Đang xử lý...' : !isAuthenticated ? 'Đăng nhập để đăng ký' : canRegister ? 'Đăng ký tham gia' : 'Không khả dụng'}
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
                  <span>Slot:</span>
                  <span>{eventData.current_participants || 0}/{eventData.max_participants} chỗ</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, ((eventData.current_participants || 0) / eventData.max_participants) * 100)}%`,
                      backgroundColor: isFull ? '#ef4444' : '#10b981'
                    }}
                  ></div>
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
              rules={[
                { required: field.required, message: `Vui lòng nhập ${field.label.toLowerCase()}` },
                (field.field_type === 'text' || field.field_type === 'textarea') && { max: 1000, message: 'Nội dung quá dài (tối đa 1000 ký tự)' }
              ].filter(Boolean)}
            >
              {field.field_type === 'text' || field.field_type === 'textarea' ? (
                <Input.TextArea placeholder="..." rows={4} maxLength={1000} />
              ) : field.field_type === 'checkbox' ? (
                <Select mode="multiple" placeholder="Chọn các tùy chọn (có thể chọn nhiều)">
                  {field.options?.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                </Select>
              ) : field.field_type === 'select' ? (
                <Select placeholder="Chọn một tùy chọn">
                  {field.options?.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                </Select>
              ) : field.field_type === 'radio' ? (
                <Radio.Group className="premium-radio-group">
                  {field.options?.map(opt => <Radio key={opt} value={opt} style={{ display: 'block', marginBottom: '8px' }}>{opt}</Radio>)}
                </Radio.Group>
              ) : field.field_type === 'number' ? (
                <Input type="number" placeholder="Nhập số..." />
              ) : (
                <Input placeholder="..." maxLength={1000} />
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
