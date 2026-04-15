import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PencilSimple, Trash, WarningCircle, Link } from '@phosphor-icons/react'
import { Spin, Popconfirm, message } from 'antd'
import { 
  getPublicEventById, 
  getUnitEventById,
  deletePublicEvent,
  deleteUnitEvent
} from '../../service/apiAdminEvent'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'

import EventPublicDetail from './EventPublicDetail'
import EventUnitDetail from './EventUnitDetail'
import styles from './adminEventDetail.module.css'

export default function AdminEventDetailPage() {
  const { unitId, eventScope, eventId } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [semesters, setSemesters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [eventId, eventScope])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = getStoredAuthSession()?.accessToken
      const [eventRes, semRes] = await Promise.all([
        eventScope === 'p' ? getPublicEventById(eventId) : getUnitEventById(eventId, unitId),
        getSemesters(token)
      ])
      
      setData(eventRes)
      setSemesters(semRes.items || [])
    } catch (err) {
      console.error('Fetch event detail failed', err)
      setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const semesterObj = data ? semesters.find(s => s.id === (data.semester_id || data.semesterId)) : null

  const handleBack = () => navigate(`/admin/${unitId}/events`)

  const handleEdit = () => navigate(`/admin/${unitId}/events/${eventScope}/${eventId}/edit`)

  const handleDelete = async () => {
    try {
      if (eventScope === 'p') {
        await deletePublicEvent(eventId)
      } else {
        await deleteUnitEvent(eventId)
      }
      handleBack() // Redirect to list
    } catch (e) {
      // Error handled by service
    }
  }

  const handleCopyUrl = () => {
    const publicUrl = `${window.location.origin}/events/${eventId}`
    navigator.clipboard.writeText(publicUrl)
      .then(() => {
        message.success('Đã sao chép đường dẫn sự kiện!')
      })
      .catch(() => {
        message.error('Không thể sao chép đường dẫn.')
      })
  }


  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <Spin size="large" />
        <p>Đang tải thông tin sự kiện...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.loadingBox}>
        <WarningCircle size={48} color="#ef4444" />
        <p>{error || 'Không tìm thấy dữ liệu.'}</p>
        <button className="secondary-button" onClick={handleBack}>Quay lại</button>
      </div>
    )
  }

  return (
    <div className={styles.detailRoot}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backLink} onClick={handleBack}>
            <ArrowLeft size={16} weight="bold" />
            QUAY LẠI DANH SÁCH
          </button>
          <h1 className={styles.title}>{data.title}</h1>
        </div>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${styles.copyBtn}`}
            onClick={handleCopyUrl}
            title="Sao chép link xem của sinh viên"
          >
            <Link size={18} />
            Copy Link
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={handleEdit}
          >
            <PencilSimple size={18} />
            Chỉnh sửa
          </button>
          <Popconfirm
            title="Xóa sự kiện"
            description="Bạn có chắc muốn xóa vĩnh viễn sự kiện này không? Hành động này không thể khôi phục."
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
              <Trash size={18} />
              Xóa sự kiện
            </button>
          </Popconfirm>

        </div>
      </header>

      {eventScope === 'p' ? (
        <EventPublicDetail data={data} semester={semesterObj} />
      ) : (
        <EventUnitDetail data={data} semester={semesterObj} />
      )}
    </div>
  )
}