import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { WarningCircle, ArrowLeft } from '@phosphor-icons/react'
import { getPublicEventById, getUnitEventById } from '../../service/apiAdminEvent'
import EditPublicEventForm from './EditPublicEventForm'
import EditUnitEventForm from './EditUnitEventForm'
import styles from './createEventWizard.module.css' // Reusing wizard root styles

export default function EditEventPage() {
  const { unitId, eventScope, eventId } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEventData()
  }, [eventId, eventScope])

  const fetchEventData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let response
      if (eventScope === 'p') {
        response = await getPublicEventById(eventId)
      } else {
        response = await getUnitEventById(eventId, unitId)
      }
      setData(response)
    } catch (err) {
      console.error('Fetch event detail failed', err)
      setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => navigate(`/admin/${unitId}/events/${eventScope}/${eventId}`)

  if (isLoading) {
    return (
      <div className={styles.wizardRoot}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#94a3b8' }}>
            <Spin size="large" />
            <p>Đang tải dữ liệu sự kiện...</p>
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
        {eventScope === 'p' ? (
          <EditPublicEventForm eventData={data} unitId={unitId} />
        ) : (
          <EditUnitEventForm eventData={data} unitId={unitId} />
        )}
      </main>
    </div>
  )
}
