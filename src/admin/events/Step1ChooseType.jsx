import { 
  Confetti, 
  Megaphone, 
  UsersThree,
  ArrowRight
} from '@phosphor-icons/react'
import styles from './step1ChooseType.module.css'

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

export default function Step1ChooseType({ selectedType, onSelect, onNext, onClose }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Lựa chọn loại sự kiện</h2>
      <p className={styles.sectionSubtitle}>
        Hãy chọn mục tiêu chính cho sự kiện của bạn để chúng tôi chuẩn bị các bước phù hợp.
      </p>

      <div className={styles.typeGrid}>
        {EVENT_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          return (
            <div 
              key={type.id} 
              className={`${styles.typeCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(type.id)}
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

      <div className={styles.stepFooter}>
        <button className={styles.backBtn} onClick={onClose}>
          Quay lại trang quản lý
        </button>
        <button 
          className={styles.nextBtn} 
          disabled={!selectedType}
          onClick={onNext}
        >
          Tiếp tục
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  )
}
