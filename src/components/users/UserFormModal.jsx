import { useEffect, useState } from 'react'
import { 
  User, 
  EnvelopeSimple, 
  Lock, 
  IdentificationCard, 
  IdentificationBadge, 
  Cake, 
  Image as ImageIcon,
  X 
} from '@phosphor-icons/react'
import NotificationPopup from '../NotificationPopup'

const initialFormState = {
  full_name: '',
  email: '',
  password: '',
  student_id: '',
  class_name: '',
  avatar: null,
  date_of_birth: '',
}

function toDateOnlyValue(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match?.[1]) {
      return match[1]
    }
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().slice(0, 10)
}

function toApiDateOfBirthValue(value) {
  if (!value) {
    return null
  }

  return `${value}T00:00:00`
}

function buildFormState(initialValues) {
  return {
    full_name: initialValues?.full_name || '',
    email: initialValues?.email || '',
    password: '',
    student_id: initialValues?.student_id || '',
    class_name: initialValues?.class_name || '',
    avatar: null,
    date_of_birth: toDateOnlyValue(initialValues?.date_of_birth),
  }
}

function UserFormModal({
  isOpen,
  mode,
  title,
  submitLabel,
  initialValues,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialFormState)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm(buildFormState(initialValues))
    setNotice('')
  }, [initialValues, isOpen])

  if (!isOpen) {
    return null
  }

  function handleChange(event) {
    const { name, value, files } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: name === 'avatar' ? files?.[0] || null : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (
      mode === 'create' &&
      (!form.full_name.trim() ||
        !form.email.trim() ||
        !form.password ||
        !form.student_id.trim() ||
        !form.class_name.trim())
    ) {
      setNotice('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    if (form.password && form.password.length < 6) {
      setNotice('Mật khẩu phải có tối thiểu 6 ký tự.')
      return
    }

    await onSubmit({
      full_name: form.full_name.trim() || undefined,
      email: form.email.trim() || undefined,
      password: form.password || undefined,
      student_id: form.student_id.trim() || undefined,
      class_name: form.class_name.trim() || undefined,
      avatar: form.avatar,
      date_of_birth: toApiDateOfBirthValue(form.date_of_birth),
    })
  }

  return (
    <div className="user-modal-backdrop" role="presentation">
      <NotificationPopup
        isOpen={Boolean(notice)}
        title="Lỗi biểu mẫu"
        message={notice}
        onClose={() => setNotice('')}
      />

      <section
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
      >
        <div className="user-modal-header">
          <h2 id="user-form-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0c1f45', margin: 0 }}>{title}</h2>
          <button
            type="button"
            aria-label="Đóng biểu mẫu"
            onClick={onClose}
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              flexShrink: 0
            }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form className="user-form-grid" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Họ và tên</span>
            <div className="input-with-icon">
              <User size={18} />
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
          </label>

          <label className="field">
            <span>Email</span>
            <div className="input-with-icon">
              <EnvelopeSimple size={18} />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
              />
            </div>
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={mode === 'create' ? 'Tối thiểu 6 ký tự' : 'Để trống nếu không đổi'}
              />
            </div>
          </label>

          <label className="field">
            <span>Mã sinh viên</span>
            <div className="input-with-icon">
              <IdentificationCard size={18} />
              <input
                name="student_id"
                type="text"
                value={form.student_id}
                onChange={handleChange}
                placeholder="Ví dụ: B21DCCN001"
              />
            </div>
          </label>

          <label className="field">
            <span>Lớp</span>
            <div className="input-with-icon">
              <IdentificationBadge size={18} />
              <input
                name="class_name"
                type="text"
                value={form.class_name}
                onChange={handleChange}
                placeholder="Ví dụ: D21CQCN01-N"
              />
            </div>
          </label>

          <label className="field">
            <span>Ngày sinh</span>
            <div className="input-with-icon">
              <Cake size={18} />
              <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
            </div>
          </label>

          <label className="field field-full">
            <span>Ảnh đại diện (tuỳ chọn)</span>
            <label className="file-upload-area">
              <ImageIcon size={20} />
              <span>{form.avatar ? form.avatar.name : 'Nhấn để chọn ảnh...'}</span>
              <input
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </label>
          </label>

          <div className="user-form-actions field-full">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UserFormModal
