import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react'
import { DatePicker, Select, InputNumber, Switch, message } from 'antd'
import { getUnits } from '../../service/unitService'
import SemesterField from '../../components/semesters/SemesterField'
import styles from './step2UnitEventInfo.module.css'

const { RangePicker } = DatePicker

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


  const isFormValid = data.title && data.description && data.listUnitId?.length > 0 && data.semesterId &&
    data.registrationPeriod?.[0] && data.registrationPeriod?.[1] &&
    data.eventPeriod?.[0] && data.eventPeriod?.[1]

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

  const showRegistrationLimit = type === 'HTSK' && Boolean(data.is_student_registration)

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

          {type === 'HTSK' && (
            <div className={styles.row}>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.label}>CHO SINH VIÊN CHỦ ĐỘNG ĐĂNG KÝ?</label>
                <div style={{ marginTop: 8 }}>
                  <Switch
                    checked={Boolean(data.is_student_registration)}
                    onChange={(checked) =>
                      setData((prev) => ({
                        ...prev,
                        is_student_registration: checked,
                        limit_student_registration_in_one_unit:
                          checked && type === 'HTSK'
                            ? (prev.limit_student_registration_in_one_unit ?? 20)
                            : null,
                      }))
                    }
                  />
                </div>
              </div>
              {showRegistrationLimit && (
                <div className={styles.fieldGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>GIỚI HẠN SV/ĐƠN VỊ</label>
                  <div className={styles.inputWithSuffix}>
                    <InputNumber
                      className={styles.numberInput}
                      min={1}
                      value={data.limit_student_registration_in_one_unit}
                      onChange={(val) =>
                        setData((prev) => ({
                          ...prev,
                          limit_student_registration_in_one_unit: val ?? null,
                        }))
                      }
                    />
                    <span className={styles.suffix}>SV</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Thời gian biểu</h3>
            <p className={styles.sectionDesc}>Các mốc thời gian bắt buộc cho yêu cầu hỗ trợ.</p>
          </div>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>THỜI GIAN ĐĂNG KÝ</label>
              <RangePicker
                showTime
                className={styles.rangePicker}
                format="DD/MM/YYYY, HH:mm"
                value={data.registrationPeriod}
                onChange={(vals) => setData((prev) => ({ ...prev, registrationPeriod: vals || [null, null] }))}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>THỜI GIAN DIỄN RA</label>
              <RangePicker
                showTime
                className={styles.rangePicker}
                format="DD/MM/YYYY, HH:mm"
                value={data.eventPeriod}
                onChange={(vals) => setData((prev) => ({ ...prev, eventPeriod: vals || [null, null] }))}
              />
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
