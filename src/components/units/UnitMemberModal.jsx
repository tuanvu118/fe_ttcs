import { useEffect, useState } from 'react'
import { IdentificationCard, X } from '@phosphor-icons/react'
import NotificationPopup from '../NotificationPopup'

const initialFormState = {
  student_id: '',
}

function UnitMemberModal({ isOpen, isSubmitting, onClose, onSubmit }) {
  const [form, setForm] = useState(initialFormState)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm(initialFormState)
    setNotice('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.student_id.trim()) {
      setNotice('Vui lòng nhập mã sinh viên để thêm thành viên.')
      return
    }

    await onSubmit({
      student_id: form.student_id.trim(),
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
        aria-labelledby="unit-member-form-title"
      >
        <div className="user-modal-header">
          <div>
            <h2 id="unit-member-form-title">Thêm thành viên</h2>
            <p>Nhập mã sinh viên để thêm vào đơn vị.</p>
          </div>
          <button
            type="button"
            aria-label="Đóng biểu mẫu thành viên"
            onClick={onClose}
            className="user-modal-close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form className="unit-form-grid" onSubmit={handleSubmit}>
          <label className="field field-full">
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

          <div className="user-form-actions field-full">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UnitMemberModal
