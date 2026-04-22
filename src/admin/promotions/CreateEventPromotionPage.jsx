import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash,
  CheckCircle,
  Link as LinkIcon,
  Minus
} from '@phosphor-icons/react'
import { DatePicker, Select, message, Badge } from 'antd'

import { createPromotion } from '../../service/eventPromotionService'
import { getStoredAuthSession } from '../../service/authSession'
import RichTextEditor from '../../components/RichTextEditor'
import SemesterField from '../../components/semesters/SemesterField'
import styles from './CreateEventPromotionPage.module.css'

const { RangePicker } = DatePicker

export default function CreateEventPromotionPage() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Form, 2: Success
  const [semesters, setSemesters] = useState([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)

  const [data, setData] = useState({
    title: '',
    description: '',
    semesterId: '',
    eventPeriod: [null, null],
    imageFile: null,
    imagePreview: null,
    external_links: ['']
  })

  useEffect(() => {
    // Initial data setup if needed
  }, [])

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

  const handleLinkChange = (index, value) => {
    const newLinks = [...data.external_links]
    newLinks[index] = value
    setData(prev => ({ ...prev, external_links: newLinks }))
  }

  const addLinkInput = () => {
    setData(prev => ({ ...prev, external_links: [...prev.external_links, ''] }))
  }

  const removeLinkInput = (index) => {
    const newLinks = data.external_links.filter((_, i) => i !== index)
    setData(prev => ({ ...prev, external_links: newLinks.length ? newLinks : [''] }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('semester_id', data.semesterId || '')
      
      // Clean up empty links
      const cleanLinks = data.external_links.filter(link => link.trim() !== '')
      formData.append('external_links', JSON.stringify(cleanLinks))
      
      if (data.eventPeriod[0] && data.eventPeriod[1]) {
        formData.append('event_start', data.eventPeriod[0].toISOString())
        formData.append('event_end', data.eventPeriod[1].toISOString())
      }

      if (data.imageFile) {
        formData.append('image', data.imageFile)
      }

      await createPromotion(formData, unitId)
      setCurrentStep(2)
    } catch (err) {
      console.error('Submit promotion failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    navigate(`/staff/${unitId}/promotions`)
  }

  const isFormValid = data.title && data.description && data.semesterId && 
                      data.eventPeriod[0] && data.eventPeriod[1]

  if (currentStep === 2) {
    return (
      <div className={styles.wizardRoot}>
        <div className={styles.successView}>
          <CheckCircle size={64} weight="fill" color="#10b981" />
          <h2>Đăng bài thành công!</h2>
          <p>Bài viết quảng bá đã được gửi đi. Vui lòng chờ quản trị viên phê duyệt để được hiển thị công khai.</p>
          <button className={styles.finishBtn} onClick={handleClose}>
            Quay lại danh sách
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wizardRoot}>
      <header className={styles.wizardHeader}>
        <div className={styles.headerInfo}>
          <h1 className={styles.wizardTitle}>Viết bài quảng bá mới</h1>
        </div>
      </header>

      <main className={styles.wizardContent}>
        <div className={styles.container}>
          {/* 1. THÔNG TIN CƠ BẢN */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Thông tin bài viết</h3>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>TIÊU ĐỀ BÀI VIẾT</label>
                <input 
                  className={styles.input}
                  placeholder="Ví dụ: Workshop Kỹ năng viết CV chuyên nghiệp"
                  value={data.title}
                  maxLength={255}
                  onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>ẢNH BÌA QUẢNG BÁ (16:9)</label>
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
                      <ImageIcon size={40} weight="light" color="#94a3b8" />
                      <p>Tải ảnh bìa</p>
                      <span>Khuyên dùng: 1280x720px</span>
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
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. NỘI DUNG */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Nội dung chi tiết</h3>
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>NỘI DUNG BÀI VIẾT</label>
                <RichTextEditor 
                  value={data.description}
                  onChange={val => setData(prev => ({ ...prev, description: val }))}
                  placeholder="Nhập nội dung quảng bá tại đây..."
                />
              </div>

              <div className={styles.semesterTimeRow}>
                 <div className={styles.fieldGroup}>
                   <label className={styles.label}>THUỘC HỌC KỲ</label>
                   <SemesterField 
                     value={data.semesterId}
                     onChange={val => setData(prev => ({ ...prev, semesterId: val }))}
                   />
                 </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>THỜI GIAN DIỄN RA SỰ KIỆN</label>
                  <RangePicker 
                    showTime 
                    className={styles.rangePicker}
                    format="DD/MM/YYYY, HH:mm"
                    value={data.eventPeriod}
                    onChange={vals => setData(prev => ({ ...prev, eventPeriod: vals || [null, null] }))}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>CÁC LIÊN KẾT NGOÀI (Link đăng ký, website...)</label>
                <div className={styles.linksList}>
                  {data.external_links.map((link, idx) => (
                    <div key={idx} className={styles.linkItem}>
                      <div className={styles.linkInputGroup}>
                        <LinkIcon size={18} color="#94a3b8" />
                        <input 
                          type="url"
                          className={styles.input}
                          placeholder="https://example.com"
                          value={link}
                          onChange={e => handleLinkChange(idx, e.target.value)}
                        />
                      </div>
                      {data.external_links.length > 1 && (
                        <button 
                          className={styles.removeLinkBtn}
                          onClick={() => removeLinkInput(idx)}
                        >
                          <Minus size={18} weight="bold" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button className={styles.addLinkBtn} onClick={addLinkInput}>
                    <Plus size={16} weight="bold" />
                    Thêm liên kết mới
                  </button>
                </div>
              </div>
            </div>
          </section>

          <footer className={styles.formFooter}>
            <button className={styles.backButton} onClick={handleClose}>
              <ArrowLeft size={16} weight="bold" />
              Hủy bỏ
            </button>
            <div className={styles.footerRight}>
              <button 
                className={styles.nextButton} 
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Đăng tải...' : 'Đăng bài quảng bá'}
                {!isSubmitting && <ArrowRight size={16} weight="bold" />}
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
