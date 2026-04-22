import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FloppyDiskBack, Trophy, WarningCircle } from '@phosphor-icons/react'
import { Badge, InputNumber, message, Select, Spin } from 'antd'
import { getUnitEventById, updateUnitEvent } from '../../../service/apiAdminEvent'
import { getStoredAuthSession } from '../../../service/authSession'
import { getUnits } from '../../../service/unitService'
import SemesterField from '../../../components/semesters/SemesterField'
import styles from './Edit.module.css'

export default function UnitEventEditPage() {
  const { unitId, eventId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableUnits, setAvailableUnits] = useState([])
  const [semesters, setSemesters] = useState([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    point: 0,
    listUnitId: [],
    semesterId: undefined,
  })

  useEffect(() => {
    fetchEventData()
    fetchUnits()
    fetchSemesters()
  }, [eventId, unitId])

  async function fetchEventData() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getUnitEventById(eventId, unitId)
      setData(response)
      setFormData({
        title: response.title || '',
        description: response.description || '',
        point: response.point || 0,
        listUnitId: response.assigned_units?.map((u) => u.id) || [],
        semesterId: response.semesterId || response.semester_id,
      })
    } catch (err) {
      console.error('Fetch unit event detail failed', err)
      setError('Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchSemesters() {
    // Handled by SemesterField
  }

  async function fetchUnits() {
    try {
      const res = await getUnits({ limit: 100 })
      const items = res.items || []
      setAvailableUnits(
        items.map((u) => ({
          label: u.name,
          value: u.id,
        })),
      )
    } catch (err) {
      console.error('Failed to load units', err)
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handlePointChange(val) {
    if (val == null) {
      handleChange('point', 0)
      return
    }
    if (val > 10) {
      message.warning('Điểm thưởng không được vượt quá 10.')
      return
    }
    handleChange('point', val)
  }

  async function handleUpdate() {
    if (!formData.title) {
      message.warning('Vui lòng nhập tiêu đề yêu cầu.')
      return
    }
    if (formData.listUnitId.length === 0) {
      message.warning('Vui lòng chọn ít nhất một đơn vị phối hợp.')
      return
    }
    if ((formData.point ?? 0) > 10) {
      message.warning('Điểm thưởng không được vượt quá 10.')
      return
    }

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description || '')
      fd.append('point', formData.point || 0)
      if (formData.semesterId) {
        fd.append('semester_id', formData.semesterId)
      }
      fd.append('listUnitId', JSON.stringify(formData.listUnitId))

      await updateUnitEvent(eventId, fd)
      message.success('Cập nhật yêu cầu thành công!')
      navigate(`/admin/${unitId}/events/u/${eventId}`)
    } catch (err) {
      console.error('Update unit event failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => navigate(`/admin/${unitId}/events/u/${eventId}`)

  if (isLoading) {
    return (
      <div className={styles.wizardRoot}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#94a3b8' }}>
          <Spin size="large" />
          <p>Đang tải dữ liệu yêu cầu...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.wizardRoot}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#94a3b8' }}>
          <WarningCircle size={48} color="#ef4444" />
          <p>{error || 'Không tìm thấy dữ liệu.'}</p>
          <button className="secondary-button" onClick={handleBack}>Quay lại</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wizardRoot}>
      <header className={styles.wizardHeader}>
        <div className={styles.headerInfo}>
          <button className={styles.backLink} onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', padding: 0, cursor: 'pointer', marginBottom: '0.5rem' }}>
            <ArrowLeft size={16} />
            QUAY LẠI TRANG CHI TIẾT
          </button>
          <h1 className={styles.wizardTitle}>Chỉnh sửa: {data.title}</h1>
          <p className={styles.wizardSubtitle}>Cập nhật lại các thông tin cần thiết bên dưới.</p>
        </div>
      </header>

      <main className={styles.wizardContent}>
        <div className={styles.container}>
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
                <SemesterField 
                  value={formData.semesterId}
                  onChange={(val) => handleChange('semesterId', val)}
                />
              </div>
              <div className={styles.fieldGroup} style={{ maxWidth: '240px' }}>
                <label className={styles.label}>Điểm rèn luyện thưởng thêm</label>
                <div className={styles.inputWithSuffix}>
                  <InputNumber
                    min={0}
                    className={styles.numberInput}
                    value={formData.point}
                    onChange={handlePointChange}
                  />
                  <span className={styles.suffix}>
                    <Trophy size={14} weight="fill" /> ĐIỂM
                  </span>
                </div>
              </div>
            </div>
          </section>

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

          <div className={styles.footer}>
            <button className={styles.backButton} onClick={handleBack}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div className={styles.footerRight}>
              <button className={styles.nextButton} onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT YÊU CẦU'}
                <FloppyDiskBack size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
