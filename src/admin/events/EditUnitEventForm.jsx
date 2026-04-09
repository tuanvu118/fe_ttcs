import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FloppyDiskBack,
  ArrowLeft,
  Trophy
} from '@phosphor-icons/react'
import { Select, InputNumber, message, Badge } from 'antd'
import { updateUnitEvent } from '../../service/apiAdminEvent'
import { getUnits } from '../../service/unitService'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import styles from './step2UnitEventInfo.module.css' // Reusing styles

export default function EditUnitEventForm({ eventData, unitId }) {
  const navigate = useNavigate()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableUnits, setAvailableUnits] = useState([])
  const [semesters, setSemesters] = useState([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)

  const [formData, setFormData] = useState({
    title: eventData.title,
    description: eventData.description,
    point: eventData.point,
    listUnitId: eventData.assigned_units?.map(u => u.id) || [],
    semesterId: eventData.semesterId || eventData.semester_id,
  })

  useEffect(() => {
    fetchUnits()
    fetchSemesters()
  }, [])

  async function fetchSemesters() {
    setIsLoadingSemesters(true)
    try {
      const token = getStoredAuthSession()?.accessToken
      const res = await getSemesters(token)
      setSemesters(res.items || [])
    } catch (err) {
      console.error('Failed to load semesters', err)
    } finally {
      setIsLoadingSemesters(false)
    }
  }

  const fetchUnits = async () => {
    try {
      const res = await getUnits({ limit: 100 })
      const items = res.items || []
      setAvailableUnits(items.map(u => ({
        label: u.name,
        value: u.id
      })))
    } catch (err) {
      console.error('Failed to load units', err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  const handleUpdate = async () => {
    if (!formData.title) {
        message.warning('Vui lòng nhập tiêu đề yêu cầu.')
        return
    }
    if (formData.listUnitId.length === 0) {
        message.warning('Vui lòng chọn ít nhất một đơn vị phối hợp.')
        return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description || '')
      fd.append('point', formData.point)
      

      if (formData.semesterId) {
        fd.append('semester_id', formData.semesterId)
      }
      fd.append('listUnitId', JSON.stringify(formData.listUnitId))

      await updateUnitEvent(eventData.id, fd)
      message.success('Cập nhật yêu cầu thành công!')
      navigate(`/admin/${unitId}/events/u/${eventData.id}`)
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
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Thông tin yêu cầu</h2>
            <p className={styles.sectionDesc}>Cập nhật tiêu đề cho yêu cầu hỗ trợ.</p>
          </div>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Tiêu đề yêu cầu</label>
            <input 
              className={styles.input} 
              placeholder="Ví dụ: Hỗ trợ truyền thông Giải giao hữu bóng đá 2024" 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

        </div>
      </section>

      {/* 2. ĐƠN VỊ & ĐIỂM THƯỞNG */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>Đối tượng & Quyền lợi</h2>
                <p className={styles.sectionDesc}>Chọn đơn vị nhận yêu cầu và điểm thưởng cho sinh viên tham gia.</p>
            </div>
        </div>
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Đơn vị phối hợp thực hiện</label>
            <Select 
              mode="multiple"
              className={styles.select}
              placeholder="Chọn các CLB/Khoa tham gia..."
              value={formData.listUnitId}
              onChange={(val) => handleChange('listUnitId', val)}
              options={availableUnits}
              maxTagCount="responsive"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Học kỳ diễn ra</label>
            <Select 
                className={styles.select}
                placeholder="Chọn học kỳ"
                loading={isLoadingSemesters}
                value={formData.semesterId}
                onChange={val => handleChange('semesterId', val)}
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

          <div className={styles.fieldGroup} style={{ maxWidth: '240px' }}>
            <label className={styles.label}>Điểm rèn luyện thưởng thêm</label>
            <div className={styles.inputWithSuffix}>
              <InputNumber 
                min={0} 
                max={20} 
                className={styles.numberInput} 
                value={formData.point}
                onChange={(val) => handleChange('point', val)}
              />
              <span className={styles.suffix}>
                <Trophy size={14} weight="fill" /> ĐIỂM
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NỘI DUNG CHI TIẾT */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
                <h2 className={styles.sectionTitle}>Nội dung chi tiết</h2>
                <p className={styles.sectionDesc}>Kế hoạch hỗ trợ và các yêu cầu cụ thể.</p>
            </div>
        </div>
        <div className={styles.sectionContent}>
          <textarea 
            className={styles.textarea} 
            placeholder="Nhập nội dung yêu cầu tại đây..."
            rows={10}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
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
                {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT YÊU CẦU'}
                <FloppyDiskBack size={20} />
            </button>
        </div>
      </div>
    </div>
  )
}
