import { useState, useEffect, useRef } from 'react'
import { 
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react'
import { Select, InputNumber, Badge, message } from 'antd'
import { getUnits } from '../../service/unitService'
import { getStoredAuthSession } from '../../service/authSession'
import SemesterField from '../../components/semesters/SemesterField'
import styles from './step2UnitEventInfo.module.css'

export default function Step2UnitEventInfo({ type, data, setData, isSubmitting, onBack, onNext }) {
  const [units, setUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [semesters, setSemesters] = useState([])

  useEffect(() => {
    loadUnits()
  }, [])

  async function loadUnits() {
    setIsLoadingUnits(true)
    try {
      // Fetch all units, limited to a large number to ensure we get most
      const res = await getUnits({ limit: 100 })
      setUnits(res.items || [])
    } catch (err) {
      console.error('Failed to load units', err)
    } finally {
      setIsLoadingUnits(false)
    }
  }


  const isFormValid = data.title && data.description && data.listUnitId?.length > 0 && data.semesterId

  const handleNext = () => {
    if ((data.point ?? 0) > 10) {
      message.warning('Điểm thưởng không được vượt quá 10.')
      return
    }
    onNext()
  }

  const handlePointChange = (val) => {
    if (val == null) {
      setData((prev) => ({ ...prev, point: 0 }))
      return
    }
    if (val > 10) {
      message.warning('Điểm thưởng không được vượt quá 10.')
      return
    }
    setData((prev) => ({ ...prev, point: val }))
  }

  return (
    <div className={styles.container}>
      {/* 1. THÔNG TIN CƠ BẢN */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
            <p className={styles.sectionDesc}>Nhập tên yêu cầu hỗ trợ.</p>
          </div>
        </div>
        
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>TIÊU ĐỀ YÊU CẦU</label>
            <input 
              className={styles.input}
              placeholder={type === 'HTTT' ? "Ví dụ: Hỗ trợ truyền thông Giải bóng đá sinh viên" : "Ví dụ: Hỗ trợ nhân sự Hội thảo Career Talk"}
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

        </div>
      </section>

      {/* 2. CHI TIẾT & ĐỐI TƯỢNG */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Chi tiết & Đối tượng</h3>
            <p className={styles.sectionDesc}>Mô tả yêu cầu và lựa chọn các đơn vị sẽ thực hiện.</p>
          </div>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>NỘI DUNG YÊU CẦU HỖ TRỢ</label>
              <textarea 
                className={styles.textarea}
                placeholder="Mô tả chi tiết các hạng mục cần hỗ trợ..."
                value={data.description}
                onChange={e => setData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup} style={{ maxWidth: '300px' }}>
                <label className={styles.label}>HỌC KỲ DIỄN RA</label>
                <SemesterField 
                    value={data.semesterId}
                    onChange={val => setData(prev => ({ ...prev, semesterId: val }))}
                />
            </div>
          
          <div className={styles.row}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>ĐƠN VỊ PHỐI HỢP / NHẬN YÊU CẦU</label>
              <Select 
                mode="multiple"
                className={styles.select}
                placeholder="Chọn các đơn vị tham gia"
                loading={isLoadingUnits}
                value={data.listUnitId}
                onChange={val => setData(prev => ({ ...prev, listUnitId: val }))}
                options={units.map(u => ({ value: u.id, label: u.name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.label}>ĐIỂM THƯỞNG (NẾU CÓ)</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  className={styles.numberInput}
                  min={0}
                  step={0.1}
                  value={data.point}
                  onChange={handlePointChange}
                />
                <span className={styles.suffix}>ĐIỂM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <button className={styles.backButton} onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft size={16} weight="bold" />
          Quay lại
        </button>
        <div className={styles.footerRight}>
          <button 
            className={styles.nextButton} 
            disabled={!isFormValid || isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
            {!isSubmitting && <ArrowRight size={16} weight="bold" />}
          </button>
        </div>
      </footer>
    </div>
  )
}
