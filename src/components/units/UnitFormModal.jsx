import { useEffect, useState } from 'react'
import NotificationPopup from '../NotificationPopup'
import { unitTypeOptions } from '../../utils/unitUtils'

const initialFormState = {
  name: '',
  type: '',
  introduction: '',
  logo: null,
}

function buildFormState(initialValues) {
  return {
    name: initialValues?.name || '',
    type: initialValues?.type || '',
    introduction: initialValues?.introduction || '',
    logo: null,
  }
}

function UnitFormModal({
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
      [name]: name === 'logo' ? files?.[0] || null : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim() || !form.type) {
      setNotice('Vui lòng nhập đầy đủ tên đơn vị và loại đơn vị.')
      return
    }

    await onSubmit({
      name: form.name.trim(),
      type: form.type,
      introduction: form.introduction.trim() || null,
      logo: form.logo,
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
        aria-labelledby="unit-form-title"
      >
        <div className="user-modal-header">
          <div>
            <h2 id="unit-form-title">{title}</h2>
            <p>
              {mode === 'create'
                ? 'Tạo đơn vị mới bằng API POST /units.'
                : 'Cập nhật đơn vị bằng API PUT /units/{unit_id}.'}
            </p>
          </div>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng biểu mẫu đơn vị"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="unit-form-grid" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Tên đơn vị</span>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="CLB Tin Học"
            />
          </label>

          <label className="field">
            <span>Loại đơn vị</span>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="">Chọn loại đơn vị</option>
              {unitTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Logo</span>
            <input name="logo" type="file" accept="image/*" onChange={handleChange} />
          </label>

          <label className="field field-full">
            <span>Giới thiệu</span>
            <textarea
              name="introduction"
              rows={4}
              value={form.introduction}
              onChange={handleChange}
              placeholder="Nhập nội dung giới thiệu đơn vị"
            />
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
              {isSubmitting ? 'Đang xử lý...' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UnitFormModal


