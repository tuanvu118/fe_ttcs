import { useEffect, useState } from 'react'
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
          <div>
            <h2 id="user-form-title">{title}</h2>
            <p>Điền đúng các trường API users, không thêm field ngoài backend.</p>
          </div>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng biểu mẫu"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="user-form-grid" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Họ và tên</span>
            <input
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={mode === 'create' ? 'Tối thiểu 6 ký tự' : 'Để trống nếu không đổi'}
            />
          </label>

          <label className="field">
            <span>Mã sinh viên</span>
            <input
              name="student_id"
              type="text"
              value={form.student_id}
              onChange={handleChange}
              placeholder="B21DCCN001"
            />
          </label>

          <label className="field">
            <span>Lớp</span>
            <input
              name="class_name"
              type="text"
              value={form.class_name}
              onChange={handleChange}
              placeholder="D21CQCN01-N"
            />
          </label>

          <label className="field">
            <span>Ngày sinh</span>
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Ảnh đại diện</span>
            <input name="avatar" type="file" accept="image/*" onChange={handleChange} />
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
