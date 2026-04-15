import { useState, useEffect, useRef } from 'react'
import { 
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash,
  TextT,
  TextAlignLeft,
  Hash,
  ListBullets,
  RadioButton,
  CheckSquare,
  X
} from '@phosphor-icons/react'
import { DatePicker, Select, InputNumber, Switch, Badge } from 'antd'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import RichTextEditor from '../../components/RichTextEditor'
import styles from './step2PublicEventInfo.module.css'


const { RangePicker } = DatePicker

const FIELD_TYPES = [
  { id: 'text', label: 'Văn bản ngắn', icon: TextT },
  { id: 'textarea', label: 'Văn bản dài', icon: TextAlignLeft },
  { id: 'number', label: 'Con số', icon: Hash },
  { id: 'select', label: 'Chọn (Dropdown)', icon: ListBullets },
  { id: 'radio', label: 'Chọn một (Radio)', icon: RadioButton },
  { id: 'checkbox', label: 'Chọn nhiều (Checkbox)', icon: CheckSquare },
]

export default function Step2PublicEventInfo({ data, setData, isSubmitting, onBack, onNext }) {
  const [semesters, setSemesters] = useState([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadSemesters()
  }, [])

  async function loadSemesters() {
    setIsLoadingSemesters(true)
    try {
      const token = getStoredAuthSession()?.accessToken
      const res = await getSemesters(token)
      setSemesters(res.items || [])
      // Set default semester if not set
      if (!data.semesterId && res.items?.length > 0) {
        const active = res.items.find(s => s.is_active) || res.items[0]
        setData(prev => ({ ...prev, semesterId: active.id }))
      }
    } catch (err) {
      console.error('Failed to load semesters', err)
    } finally {
      setIsLoadingSemesters(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setData(prev => ({ 
          ...prev, 
          imageFile: file, 
          imagePreview: reader.result 
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Dynamic Form Field Handlers
  const addFormField = () => {
    const newField = {
      id: crypto.randomUUID(),
      label: '',
      field_type: 'text',
      required: false,
      options: []
    }
    setData(prev => ({ 
      ...prev, 
      form_fields: [...prev.form_fields, newField] 
    }))
  }

  const removeFormField = (id) => {
    setData(prev => ({ 
      ...prev, 
      form_fields: prev.form_fields.filter(f => f.id !== id) 
    }))
  }

  const updateFormField = (id, updates) => {
    setData(prev => ({ 
      ...prev, 
      form_fields: prev.form_fields.map(f => f.id === id ? { ...f, ...updates } : f) 
    }))
  }

  const addOption = (fieldId) => {
    setData(prev => ({ 
      ...prev, 
      form_fields: prev.form_fields.map(f => {
        if (f.id === fieldId) {
          return { ...f, options: [...(f.options || []), ''] }
        }
        return f
      }) 
    }))
  }

  const updateOption = (fieldId, optionIndex, value) => {
    setData(prev => ({ 
      ...prev, 
      form_fields: prev.form_fields.map(f => {
        if (f.id === fieldId) {
          const nextOptions = [...f.options]
          nextOptions[optionIndex] = value
          return { ...f, options: nextOptions }
        }
        return f
      }) 
    }))
  }

  const removeOption = (fieldId, optionIndex) => {
    setData(prev => ({ 
      ...prev, 
      form_fields: prev.form_fields.map(f => {
        if (f.id === fieldId) {
          return { ...f, options: f.options.filter((_, i) => i !== optionIndex) }
        }
        return f
      }) 
    }))
  }

  const isFormValid = data.title && data.description && data.semesterId && 
                      data.registrationPeriod[0] && data.registrationPeriod[1] &&
                      data.eventPeriod[0] && data.eventPeriod[1]

  return (
    <div className={styles.container}>
      {/* 1. THÔNG TIN CƠ BẢN */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
            <p className={styles.sectionDesc}>Tiêu đề và hình ảnh nhận diện thương hiệu cho sự kiện.</p>
          </div>
        </div>
        
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>TIÊU ĐỀ SỰ KIỆN</label>
            <input 
              className={styles.input}
              placeholder="Ví dụ: Hội nghị Thủ lĩnh trẻ 2024"
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>ẢNH BÌA SỰ KIỆN (16:9)</label>
            <div 
              className={`${styles.uploadArea} ${data.imagePreview ? styles.hasPreview : ''}`}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className={styles.hiddenInput} 
                accept="image/*"
              />
              {data.imagePreview ? (
                <img src={data.imagePreview} alt="Preview" className={styles.previewImage} />
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <ImageIcon size={48} weight="light" color="#94a3b8" />
                  <p>Tải ảnh lên hoặc kéo thả vào đây</p>
                  <span>Khuyên dùng: 1920x1080px (JPG, PNG)</span>
                </div>
              )}
              {data.imagePreview && (
                <button 
                  className={styles.removeImgBtn} 
                  onClick={(e) => {
                    e.stopPropagation()
                    setData(prev => ({ ...prev, imageFile: null, imagePreview: null }))
                  }}
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. NỘI DUNG & ĐIỂM SỐ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Nội dung & Điểm số</h3>
            <p className={styles.sectionDesc}>Mô tả mục tiêu và quyền lợi dành cho sinh viên tham gia.</p>
          </div>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>MÔ TẢ CHI TIẾT</label>
            <RichTextEditor 
              value={data.description}
              onChange={val => setData(prev => ({ ...prev, description: val }))}
              placeholder="Nhập nội dung sự kiện tại đây..."
            />
          </div>



          <div className={styles.row}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>ĐỊA ĐIỂM TỔ CHỨC</label>
              <input 
                className={styles.input}
                placeholder="Ví dụ: Hội trường A, Tầng 2"
                value={data.location}
                onChange={e => setData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.label}>SỨC CHỨA (MAX)</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  className={styles.numberInput}
                  min={1}
                  value={data.max_participants}
                  onChange={val => setData(prev => ({ ...prev, max_participants: val }))}
                />
                <span className={styles.suffix}>CHỖ</span>
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>HỌC KỲ</label>
              <Select 
                className={styles.select}
                placeholder="Chọn học kỳ"
                loading={isLoadingSemesters}
                value={data.semesterId}
                onChange={val => setData(prev => ({ ...prev, semesterId: val }))}
                options={semesters.map(s => ({ 
                  value: s.id, 
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{s.name} - {s.academic_year}</span>
                      {s.is_active && <Badge count="Đang diễn ra" style={{ backgroundColor: '#10b981', marginLeft: '10px', fontSize: '10px' }} />}
                    </div>
                  )
                }))}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>ĐIỂM RÈN LUYỆN</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  className={styles.numberInput}
                  min={0}
                  max={100}
                  value={data.point}
                  onChange={val => setData(prev => ({ ...prev, point: val }))}
                />
                <span className={styles.suffix}>ĐIỂM</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THỜI GIAN BIỂU */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Thời gian biểu</h3>
            <p className={styles.sectionDesc}>Lịch trình đăng ký và tổ chức hoạt động.</p>
          </div>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <div className={styles.dotLabel}>
                <div className={styles.dot} style={{ backgroundColor: '#1d4ed8' }} />
                <label className={styles.label}>THỜI GIAN ĐĂNG KÝ</label>
              </div>
              <RangePicker 
                showTime 
                className={styles.rangePicker}
                format="DD/MM/YYYY, HH:mm"
                value={data.registrationPeriod}
                onChange={vals => setData(prev => ({ ...prev, registrationPeriod: vals || [null, null] }))}
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.dotLabel}>
                <div className={styles.dot} style={{ backgroundColor: '#0c1f45' }} />
                <label className={styles.label}>THỜI GIAN DIỄN RA</label>
              </div>
              <RangePicker 
                showTime 
                className={styles.rangePicker}
                format="DD/MM/YYYY, HH:mm"
                value={data.eventPeriod}
                onChange={vals => setData(prev => ({ ...prev, eventPeriod: vals || [null, null] }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CÂU HỎI TÙY CHỈNH (DYNAMIC FORM) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Form đăng ký tùy chỉnh</h3>
            <p className={styles.sectionDesc}>Thêm các câu hỏi thu thập thông tin sinh viên khi đăng ký.</p>
          </div>
          <button className={styles.addBtn} onClick={addFormField}>
            <Plus size={16} weight="bold" />
            Thêm câu hỏi
          </button>
        </div>

        <div className={styles.sectionContent}>
          {data.form_fields.length === 0 ? (
            <div className={styles.emptyFields}>
              <p>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
            </div>
          ) : (
            <div className={styles.formFieldsList}>
              {data.form_fields.map((field, index) => (
                <div key={field.id} className={styles.fieldCard}>
                  <div className={styles.fieldCardHeader}>
                    <span className={styles.fieldIndex}>Câu hỏi {index + 1}</span>
                    <button className={styles.removeBtn} onClick={() => removeFormField(field.id)}>
                      <Trash size={18} />
                    </button>
                  </div>
                  
                  <div className={styles.fieldCardBody}>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup} style={{ flex: 2 }}>
                        <label className={styles.label}>NHÃN CÂU HỎI</label>
                        <input 
                          className={styles.input}
                          placeholder="Nhập câu hỏi (VD: Bạn có dị ứng gì không?)"
                          value={field.label}
                          onChange={e => updateFormField(field.id, { label: e.target.value })}
                        />
                      </div>
                      <div className={styles.fieldGroup} style={{ flex: 1 }}>
                        <label className={styles.label}>KIỂU DỮ LIỆU</label>
                        <Select 
                          className={styles.select}
                          value={field.field_type}
                          onChange={val => updateFormField(field.id, { field_type: val, options: [] })}
                          options={FIELD_TYPES.map(t => ({ value: t.id, label: t.label }))}
                        />
                      </div>
                    </div>

                    <div className={styles.fieldExtraActions}>
                      <div className={styles.switchGroup}>
                        <span>Bắt buộc trả lời</span>
                        <Switch 
                          size="small" 
                          checked={field.required} 
                          onChange={val => updateFormField(field.id, { required: val })}
                        />
                      </div>
                    </div>

                    {['select', 'radio', 'checkbox'].includes(field.field_type) && (
                      <div className={styles.optionsSection}>
                        <label className={styles.label}>CÁC TÙY CHỌN</label>
                        <div className={styles.optionsList}>
                          {field.options.map((opt, optIdx) => (
                            <div key={optIdx} className={styles.optionItem}>
                              <input 
                                className={styles.input}
                                value={opt}
                                onChange={e => updateOption(field.id, optIdx, e.target.value)}
                                placeholder={`Tùy chọn ${optIdx + 1}`}
                              />
                              <button className={styles.removeOptionBtn} onClick={() => removeOption(field.id, optIdx)}>
                                <Trash size={14} />
                              </button>
                            </div>
                          ))}
                          <button className={styles.addOptionBtn} onClick={() => addOption(field.id)}>
                            <Plus size={14} /> Thêm tùy chọn
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={16} weight="bold" />
          Quay lại
        </button>
        <div className={styles.footerRight}>
          <button 
            className={styles.nextButton} 
            disabled={!isFormValid || isSubmitting}
            onClick={onNext}
          >
            {isSubmitting ? 'Đang khởi tạo...' : 'Tạo sự kiện'}
            {!isSubmitting && <ArrowRight size={16} weight="bold" />}
          </button>
        </div>
      </footer>
    </div>
  )
}
