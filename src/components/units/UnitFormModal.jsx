import { useEffect, useState } from 'react'
import NotificationPopup from '../NotificationPopup'
import { unitTypeOptions } from '../../utils/unitUtils'
import { Buildings, Tag, Image as ImageIcon, AlignLeft, X } from '@phosphor-icons/react'

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
    if (!isOpen) return
    setForm(buildFormState(initialValues))
    setNotice('')
  }, [initialValues, isOpen])

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value, files } = event.target
    setForm((cur) => ({
      ...cur,
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
        style={{ maxWidth: '520px' }}
      >
        {/* Header */}
        <div className="user-modal-header">
          <h2 id="unit-form-title">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="user-modal-close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form className="unit-form-grid" onSubmit={handleSubmit}>
          {/* Tên đơn vị */}
          <label className="field field-full">
            <span>Tên đơn vị</span>
            <div className="input-with-icon">
              <Buildings size={18} />
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: CLB Tin Học"
              />
            </div>
          </label>

          {/* Loại đơn vị */}
          <label className="field field-full">
            <span>Loại đơn vị</span>
            <div className="input-with-icon">
              <Tag size={18} />
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="">Chọn loại đơn vị</option>
                {unitTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </label>

          {/* Logo */}
          <label className="field field-full">
            <span>Logo (tuỳ chọn)</span>
            <label className="file-upload-area">
              <ImageIcon size={20} />
              <span>{form.logo ? form.logo.name : 'Nhấn để chọn ảnh...'}</span>
              <input
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </label>
          </label>

          {/* Giới thiệu */}
          <label className="field field-full">
            <span>Giới thiệu</span>
            <div className="input-with-icon-textarea">
              <AlignLeft size={18} />
              <textarea
                name="introduction"
                rows={4}
                value={form.introduction}
                onChange={handleChange}
                placeholder="Mô tả ngắn về đơn vị..."
              />
            </div>
          </label>

          {/* Actions */}
          <div className="user-form-actions field-full">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
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

export default UnitFormModal

