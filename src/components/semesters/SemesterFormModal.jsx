import { useEffect, useState } from 'react'
import NotificationPopup from '../NotificationPopup'
import { toApiDateTimeValue, toDateTimeLocalValue } from '../../utils/semesterUtils'

const initialFormState = {
  name: '',
  academic_year: '',
  start_date: '',
  end_date: '',
  is_active: false,
}

function buildFormState(initialValues) {
  return {
    name: initialValues?.name || '',
    academic_year: initialValues?.academic_year || '',
    start_date: toDateTimeLocalValue(initialValues?.start_date),
    end_date: toDateTimeLocalValue(initialValues?.end_date),
    is_active: Boolean(initialValues?.is_active),
  }
}

function SemesterFormModal({ isOpen, mode, initialValues, isSubmitting, onClose, onSubmit }) {
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
    const { name, value, checked, type } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const startDate = new Date(form.start_date)
    const endDate = new Date(form.end_date)

    if (
      mode === 'create' &&
      (!form.name.trim() ||
        !form.academic_year.trim() ||
        !form.start_date ||
        !form.end_date)
    ) {
      setNotice('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      startDate >= endDate
    ) {
      setNotice('Ngày bắt đầu phải nhỏ hơn ngày kết thúc.')
      return
    }

    const payload = {
      ...(mode === 'create' || form.name.trim() ? { name: form.name.trim() } : {}),
      ...(mode === 'create' || form.academic_year.trim()
        ? { academic_year: form.academic_year.trim() }
        : {}),
      ...(mode === 'create' || form.start_date
        ? { start_date: toApiDateTimeValue(form.start_date) }
        : {}),
      ...(mode === 'create' || form.end_date
        ? { end_date: toApiDateTimeValue(form.end_date) }
        : {}),
      is_active: form.is_active,
    }

    await onSubmit(payload)
  }

  return (
    <div className="user-modal-backdrop" role="presentation" onClick={onClose}>
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
        aria-labelledby="semester-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-modal-header">
          <div>
            <h2 id="semester-form-title">
              {mode === 'create' ? 'Tạo học kỳ mới' : 'Cập nhật học kỳ'}
            </h2>
            <p>
              {mode === 'create'
                ? 'Biểu mẫu gửi JSON tới API POST /semesters.'
                : 'Biểu mẫu gửi JSON tới API PUT /semesters/{semester_id}.'}
            </p>
          </div>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng biểu mẫu học kỳ"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="semester-form-grid" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Tên học kỳ</span>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Học kỳ 1"
            />
          </label>

          <label className="field">
            <span>Năm học</span>
            <input
              name="academic_year"
              type="text"
              value={form.academic_year}
              onChange={handleChange}
              placeholder="2025-2026"
            />
          </label>

          <label className="field">
            <span>Ngày bắt đầu</span>
            <input
              name="start_date"
              type="datetime-local"
              value={form.start_date}
              onChange={handleChange}
            />
          </label>

          <label className="field">
            <span>Ngày kết thúc</span>
            <input
              name="end_date"
              type="datetime-local"
              value={form.end_date}
              onChange={handleChange}
            />
          </label>

          <label className="semester-checkbox field-full">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span>Đặt làm học kỳ active</span>
          </label>

          <div className="user-form-actions field-full">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : mode === 'create' ? 'Tạo học kỳ' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SemesterFormModal
