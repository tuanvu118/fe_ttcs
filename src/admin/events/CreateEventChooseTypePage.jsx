import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Confetti, 
  Megaphone, 
  UsersThree 
} from '@phosphor-icons/react'
import { PATHS } from '../../utils/routes'
import styles from './createEventChooseType.module.css'

const EVENT_TYPES = [
  {
    id: 'SK',
    title: 'Sự kiện chung',
    description: 'Dành cho các hội thảo, cuộc thi, hoặc các buổi giao lưu định kỳ tại cơ sở.',
    icon: Confetti,
  },
  {
    id: 'HTTT',
    title: 'Hỗ trợ Truyền thông',
    description: 'Cần hỗ trợ về thiết kế, bài đăng mạng xã hội, hoặc đưa tin chuyên sâu từ ban truyền thông.',
    icon: Megaphone,
  },
  {
    id: 'HTSK',
    title: 'Hỗ trợ Tổ chức',
    description: 'Cần hỗ trợ nhân lực, mượn cơ sở vật chất, phòng họp hoặc các thiết bị kỹ thuật chuyên dụng.',
    icon: UsersThree,
  }
]

export default function CreateEventChooseTypePage() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState(null)

  const handleClose = () => {
    navigate(`${PATHS.admin}/${unitId}/events`)
  }

  const handleNext = () => {
    if (!selectedType) return
    // Logic for next step will go here
    // For now, it stays on this page as we are only implementing Step 1
    console.log('Next step with type:', selectedType)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tạo sự kiện mới</h1>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Đóng">
          <X size={24} weight="bold" />
        </button>
      </header>

      <div className={styles.stepper}>
        <div className={`${styles.step} ${styles.active}`}>
          <div className={styles.stepCircle}>1</div>
          <span className={styles.stepLabel}>Phân loại</span>
        </div>
        <div className={styles.stepDivider} />
        <div className={styles.step}>
          <div className={styles.stepCircle}>2</div>
          <span className={styles.stepLabel}>Thông tin</span>
        </div>
        <div className={styles.stepDivider} />
        <div className={styles.step}>
          <div className={styles.stepCircle}>3</div>
          <span className={styles.stepLabel}>Hoàn tất</span>
        </div>
      </div>

      <main className={styles.content}>
        <h2 className={styles.contentTitle}>Lựa chọn loại sự kiện</h2>
        <p className={styles.contentSubtitle}>
          Để bắt đầu, hãy chọn mục tiêu chính cho sự kiện của bạn. Điều này sẽ giúp
          chúng tôi tùy chỉnh các bước tiếp theo phù hợp với nhu cầu của bạn.
        </p>

        <div className={styles.typeGrid}>
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id
            return (
              <div 
                key={type.id} 
                className={`${styles.typeCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className={styles.cardIcon}>
                  <Icon size={32} weight={isSelected ? "fill" : "regular"} />
                </div>
                <h3 className={styles.cardTitle}>{type.title}</h3>
                <p className={styles.cardDesc}>{type.description}</p>
              </div>
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <button className={styles.backBtn} onClick={handleClose}>
          <ArrowLeft size={16} weight="bold" />
          Quay lại
        </button>
        <div className={styles.footerActions}>
          <button className={styles.saveDraftBtn}>Lưu bản nháp</button>
          <button 
            className={styles.nextBtn} 
            disabled={!selectedType}
            onClick={handleNext}
          >
            Tiếp tục
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </footer>
    </div>
  )
}
