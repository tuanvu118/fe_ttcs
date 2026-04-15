import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { PATHS } from '../../utils/routes'
import { createPublicEvent, createUnitEvent } from '../../service/apiAdminEvent'
import Step1ChooseType from './Step1ChooseType'
import Step2PublicEventInfo from './Step2PublicEventInfo'
import Step2UnitEventInfo from './Step2UnitEventInfo'
import styles from './createEventWizard.module.css'

export default function CreateEventPage() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    point: 5,
    semesterId: '',
    registrationPeriod: [null, null],
    eventPeriod: [null, null],
    imageFile: null,
    imagePreview: null,
    location: '',
    max_participants: 200,
    form_fields: [],
    listUnitId: [] // For Unit Events

  })

  const handleClose = () => {
    navigate(`${PATHS.admin}/${unitId}/events`)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', eventData.title)
      formData.append('description', eventData.description || '')
      formData.append('point', eventData.point)
      
      if (eventData.imageFile) {
        formData.append('image', eventData.imageFile)
      }

      if (selectedType === 'SK') {
        // Public Event specific
        if (eventData.registrationPeriod[0] && eventData.registrationPeriod[1]) {
          formData.append('registration_start', eventData.registrationPeriod[0].toISOString())
          formData.append('registration_end', eventData.registrationPeriod[1].toISOString())
        }
        
        if (eventData.eventPeriod[0] && eventData.eventPeriod[1]) {
          formData.append('event_start', eventData.eventPeriod[0].toISOString())
          formData.append('event_end', eventData.eventPeriod[1].toISOString())
        }

        if (eventData.semesterId) {
          formData.append('semester_id', eventData.semesterId)
        }

        formData.append('location', eventData.location || '')
        formData.append('max_participants', eventData.max_participants)
        formData.append('form_fields', JSON.stringify(eventData.form_fields))

        await createPublicEvent(formData)
      } else {
        // Unit Event (HTTT/HTSK) specific
        formData.append('type', selectedType)
        if (eventData.semesterId) {
          formData.append('semester_id', eventData.semesterId)
        }
        formData.append('listUnitId', JSON.stringify(eventData.listUnitId))
        await createUnitEvent(formData)
      }
      
      setCurrentStep(3) // Reuse step 3 as success view
    } catch (err) {
      console.error('Submit failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className={styles.wizardRoot}>
      <header className={styles.wizardHeader}>
        <div className={styles.headerInfo}>
          <h1 className={styles.wizardTitle}>
            {currentStep === 1 ? 'Tạo sự kiện mới' : 
             currentStep === 3 ? 'Thành công' :
             `Thông tin Sự kiện ${selectedType === 'SK' ? 'chung' : 
                                selectedType === 'HTTT' ? 'truyền thông' : 'đơn vị'}`}
          </h1>
          <p className={styles.wizardSubtitle}>
            {currentStep === 1 
              ? 'Để bắt đầu, hãy chọn biểu mẫu cho sự kiện của bạn.' 
              : currentStep === 3
              ? 'Sự kiện của bạn đã được tạo thành công vào hệ thống.'
              : ''}
          </p>
        </div>
      </header>

      {currentStep <= 2 && (
        <div className={styles.stepperContainer}>
          <div className={styles.stepper}>
            <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
              <span className={styles.stepName}>1. LOẠI SỰ KIỆN</span>
              <div className={styles.stepBar} />
            </div>
            <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
              <span className={styles.stepName}>2. CHI TIẾT SỰ KIỆN</span>
              <div className={styles.stepBar} />
            </div>
          </div>
        </div>
      )}

      <main className={styles.wizardContent}>
        {currentStep === 1 && (
          <Step1ChooseType 
            selectedType={selectedType}
            onSelect={setSelectedType}
            onNext={() => setCurrentStep(2)}
            onClose={handleClose}
          />
        )}
        
        {currentStep === 2 && selectedType === 'SK' && (
          <Step2PublicEventInfo 
            data={eventData}
            setData={setEventData}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(1)}
            onNext={handleSubmit}
          />
        )}

        {currentStep === 2 && (selectedType === 'HTTT' || selectedType === 'HTSK') && (
          <Step2UnitEventInfo 
            type={selectedType}
            data={eventData}
            setData={setEventData}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(1)}
            onNext={handleSubmit}
          />
        )}

        {currentStep === 3 && (
          <div className={styles.successView}>
            <CheckCircle size={64} weight="fill" color="#10b981" />
            <h2>Tạo sự kiện thành công!</h2>
            <p>Sự kiện đã được ghi nhận vào hệ thống. Bạn có thể kiểm tra lại tại trang quản lý danh sách.</p>
            <button className={styles.finishBtn} onClick={handleClose}>
              Quay lại danh sách
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
