import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Image as ImageIcon, 
  Trash, 
  Plus, 
  TextT, 
  TextAlignLeft, 
  CheckSquare, 
  CaretDown,
  Hash,
  RadioButton,
  FloppyDiskBack,
  ArrowLeft,
  ListBullets
} from '@phosphor-icons/react'
import { DatePicker, InputNumber, Switch, message, Badge, Radio } from 'antd'
import dayjs from 'dayjs'
import { updatePublicEvent } from '../../service/apiAdminEvent'
import { getStoredAuthSession } from '../../service/authSession'
import RichTextEditor from '../../components/RichTextEditor'
import SemesterField from '../../components/semesters/SemesterField'
import styles from './step2PublicEventInfo.module.css' // Reusing styles


const { RangePicker } = DatePicker

export default function EditPublicEventForm({ eventData, unitId }) {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: eventData.title || '',
    description: eventData.description || '',
    point: eventData.point || 0,
    imageFile: null,
    imagePreview: eventData.image_url || null,
    registrationPeriod: [
      eventData.registration_start ? dayjs(eventData.registration_start) : null,
      eventData.registration_end ? dayjs(eventData.registration_end) : null
    ],
    eventPeriod: [
      eventData.event_start ? dayjs(eventData.event_start) : null,
      eventData.event_end ? dayjs(eventData.event_end) : null
    ],
    semester_id: eventData.semester_id || eventData.semesterId,
    max_participants: eventData.max_participants || 0,
    form_fields: (eventData.form_fields || []).map(f => ({
      ...f,
      type: f.field_type || f.type // Map field_type to type for consistency with creation UI
    }))
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (e) => {
    e.stopPropagation()
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }))
  }

  const addFormField = () => {
    const newField = {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false,
      options: []
    }
    handleChange('form_fields', [...formData.form_fields, newField])
  }

  const updateField = (id, key, value) => {
    const updated = formData.form_fields.map(f => 
      f.id === id ? { ...f, [key]: value } : f
    )
    handleChange('form_fields', updated)
  }

  const removeField = (id) => {
    handleChange('form_fields', formData.form_fields.filter(f => f.id !== id))
  }

  const handleUpdate = async () => {
    if (!formData.title) {
        message.warning('Vui lòng nhập tên sự kiện.')
        return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description || '')
      fd.append('point', formData.point)
      
      if (formData.semester_id) {
          fd.append('semester_id', formData.semester_id)
      }
      fd.append('max_participants', formData.max_participants)
      
      if (formData.imageFile) {
        fd.append('image', formData.imageFile)
      } else if (!formData.imagePreview) {
          // If user deleted the image, we might need a way to clear it 
          // (backend current Update doesn't explicitly clear image_url unless we add a flag)
      }

      if (formData.registrationPeriod[0] && formData.registrationPeriod[1]) {
        fd.append('registration_start', formData.registrationPeriod[0].toISOString())
        fd.append('registration_end', formData.registrationPeriod[1].toISOString())
      }
      
      if (formData.eventPeriod[0] && formData.eventPeriod[1]) {
        fd.append('event_start', formData.eventPeriod[0].toISOString())
        fd.append('event_end', formData.eventPeriod[1].toISOString())
      }

      // Re-map back to field_type for backend
      const fieldsForBackend = formData.form_fields.map(f => ({
          ...f,
          field_type: f.type
      }))
      fd.append('form_fields', JSON.stringify(fieldsForBackend))

      await updatePublicEvent(eventData.id, fd)
      message.success('Cập nhật sự kiện thành công!')
      navigate(`/admin/${unitId}/events/p/${eventData.id}`)
    } catch (err) {
      console.error('Update failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. THÔNG TIN CƠ BẢN */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Tên sự kiện</label>
            <input 
              className={styles.input} 
              placeholder="Ví dụ: Hội nghị nghiên cứu khoa học sinh viên 2024" 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Ảnh bìa sự kiện</label>
            <div 
              className={`${styles.uploadArea} ${formData.imagePreview ? styles.hasPreview : ''}`}
              onClick={() => fileInputRef.current.click()}
            >
              {formData.imagePreview ? (
                <>
                  <img src={formData.imagePreview} alt="Preview" className={styles.previewImage} />
                  <button className={styles.removeImgBtn} onClick={removeImage}>
                    <Trash size={16} weight="bold" />
                  </button>
                </>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <ImageIcon size={32} weight="light" />
                  <p>Chọn ảnh mới</p>
                  <span>Khuyên dùng 16:9, tối đa 5MB</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>
      </section>

      {/* 2. THỜI GIAN & ĐIỂM THƯỞNG */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thời gian & Điểm thưởng</h2>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Thời gian mở/đóng đăng ký</label>
              <RangePicker 
                showTime
                className={styles.rangePicker}
                format="DD/MM/YYYY HH:mm"
                value={formData.registrationPeriod}
                onChange={(val) => handleChange('registrationPeriod', val)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Thời gian diễn ra sự kiện</label>
              <RangePicker 
                showTime
                className={styles.rangePicker}
                format="DD/MM/YYYY HH:mm"
                value={formData.eventPeriod}
                onChange={(val) => handleChange('eventPeriod', val)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>HỌC KỲ DIỄN RA</label>
              <SemesterField 
                value={formData.semester_id}
                onChange={val => handleChange('semester_id', val)}
              />
            </div>
            <div className={styles.fieldGroup} style={{ maxWidth: '200px' }}>
              <label className={styles.label}>Điểm rèn luyện</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  min={0} 
                  max={50} 
                  className={styles.numberInput} 
                  value={formData.point}
                  onChange={(val) => handleChange('point', val)}
                />
                <span className={styles.suffix}>ĐIỂM</span>
              </div>
            </div>
            
            <div className={styles.fieldGroup} style={{ maxWidth: '300px' }}>
              <label className={styles.label}>Số lượng đăng ký</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  min={0} 
                  className={styles.numberInput} 
                  value={formData.max_participants}
                  onChange={(val) => handleChange('max_participants', val)}
                />
                <span className={styles.suffix} style={{ fontSize: '10px' }}>NGƯỜI (0 = Không giới hạn)</span>
              </div>
            </div>
          </div>
        </div>
    </section>

      {/* 3. NỘI DUNG MÔ TẢ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Nội dung chi tiết</h2>
            </div>
        <div className={styles.sectionContent}>
          <RichTextEditor 
            value={formData.description}
            onChange={val => handleChange('description', val)}
            placeholder="Nhập nội dung sự kiện tại đây..."
          />
        </div>

      </section>

      {/* 4. BIỂU MẪU ĐĂNG KÝ (DYNAMIC) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Câu hỏi biểu mẫu</h2>
          <button className={styles.addBtn} onClick={addFormField}>
            <Plus size={14} weight="bold" /> Thêm câu hỏi
          </button>
        </div>
        <div className={styles.sectionContent}>
           {formData.form_fields.length === 0 ? (
             <div className={styles.emptyFields}>Chưa có câu hỏi nào.</div>
           ) : (
             <div className={styles.formFieldsList}>
               {formData.form_fields.map((field, index) => (
                 <div key={field.id} className={styles.fieldCard}>
                    <div className={styles.fieldCardHeader}>
                      <span className={styles.fieldIndex}>CÂU HỎI #{index + 1}</span>
                      <button className={styles.removeBtn} onClick={() => removeField(field.id)}>
                        <Trash size={18} />
                      </button>
                    </div>
                    <div className={styles.fieldCardBody}>
                       <div className={styles.row}>
                          <div className={styles.fieldGroup} style={{ flex: 3 }}>
                            <label className={styles.label}>Câu hỏi</label>
                            <input 
                              className={styles.input} 
                              value={field.label}
                              onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            />
                          </div>
                          <div className={styles.fieldGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Loại phản hồi</label>
                            <Select 
                              className={styles.select}
                              value={field.type === 'checkbox' || field.type === 'select' || field.type === 'radio' ? 'choice' : field.type}
                              onChange={(val) => {
                                if (val === 'choice') {
                                  updateField(field.id, 'type', 'select')
                                  if (!field.options || field.options.length === 0) {
                                    updateField(field.id, 'options', ['Lựa chọn 1'])
                                  }
                                } else {
                                  updateField(field.id, 'type', val)
                                  updateField(field.id, 'options', [])
                                }
                              }}
                              options={[
                                { value: 'text', label: 'Văn bản', icon: <TextAlignLeft /> },
                                { value: 'number', label: 'Con số', icon: <Hash /> },
                                { value: 'choice', label: 'Lựa chọn (Trắc nghiệm/Hộp kiểm)', icon: <ListBullets /> },
                              ]}
                            />
                          </div>
                       </div>

                       {(field.type === 'select' || field.type === 'checkbox') && (
                        <div className={styles.choiceTypeSettings}>
                          <Radio.Group 
                            value={field.type} 
                            onChange={e => updateField(field.id, 'type', e.target.value)}
                            className={styles.choiceRadioGroup}
                          >
                            <Radio value="select">Chọn một (Trắc nghiệm)</Radio>
                            <Radio value="checkbox">Chọn nhiều (Hộp kiểm)</Radio>
                          </Radio.Group>
                        </div>
                       )}

                       {(field.type === 'checkbox' || field.type === 'select') && (
                         <div className={styles.optionsSection}>
                           <label className={styles.label}>Các lựa chọn</label>
                           <div className={styles.optionsList}>
                              {field.options?.map((opt, oIdx) => (
                                <div key={oIdx} className={styles.optionItem}>
                                   <input 
                                     className={styles.input} 
                                     value={opt}
                                     onChange={(e) => {
                                       const newOpts = [...field.options]
                                       newOpts[oIdx] = e.target.value
                                       updateField(field.id, 'options', newOpts)
                                     }}
                                   />
                                   <button 
                                     className={styles.removeOptionBtn}
                                     onClick={() => {
                                       const newOpts = field.options.filter((_, i) => i !== oIdx)
                                       updateField(field.id, 'options', newOpts)
                                     }}
                                   >
                                     <Trash size={14} />
                                   </button>
                                </div>
                              ))}
                              <button 
                                className={styles.addOptionBtn}
                                onClick={() => {
                                  const newOpts = [...(field.options || []), `Lựa chọn ${ (field.options?.length || 0) + 1}`]
                                  updateField(field.id, 'options', newOpts)
                                }}
                              >
                                <Plus size={14} /> Thêm lựa chọn
                              </button>
                           </div>
                         </div>
                       )}

                       <div className={styles.fieldExtraActions}>
                          <div className={styles.switchGroup}>
                             <span>Bắt buộc trả lời</span>
                             <Switch 
                               size="small" 
                               checked={field.required}
                               onChange={(val) => updateField(field.id, 'required', val)}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </section>

      {/* FOOTER */}
      <div className={styles.footer}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Quay lại
        </button>
        <div className={styles.footerRight}>
            <button 
              className={styles.nextButton} 
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
                {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT SỰ KIỆN'}
                <FloppyDiskBack size={20} />
            </button>
        </div>
      </div>
    </div>
  )
}
