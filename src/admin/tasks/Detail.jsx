import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { getStoredCurrentSemester } from '../../utils/currentSemesterStorage'
import { getMyUnitEventById } from '../../service/taskService'
import DetailHTTT from './DetailHTTT'
import DetailHTSK from './DetailHTSK'
import styles from './detailCommon.module.css'

export default function Detail() {
  const { unitId, taskId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchTaskDetail() {
      setLoading(true)
      setError('')
      try {
        const currentSemester = getStoredCurrentSemester()
        const semesterId = currentSemester?.id
        if (!semesterId) {
          throw new Error('Không tìm thấy học kỳ hiện tại.')
        }
        const response = await getMyUnitEventById(semesterId, unitId, taskId)
        if (!cancelled) {
          setData(response || null)
          if (!response) {
            setError('Không tìm thấy nhiệm vụ trong danh sách được giao.')
          }
        }
      } catch {
        if (!cancelled) {
          setError('Không thể tải chi tiết nhiệm vụ.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (taskId && unitId) {
      fetchTaskDetail()
    } else {
      setLoading(false)
      setError('Thiếu thông tin nhiệm vụ.')
    }

    return () => {
      cancelled = true
    }
  }, [taskId, unitId])

  const semesterDisplay = useMemo(() => {
    const semester = getStoredCurrentSemester()
    if (!semester?.id) return 'N/A'
    return `${semester.name || ''}${semester.academic_year ? ` - ${semester.academic_year}` : ''}`.trim() || 'N/A'
  }, [])

  if (loading) {
    return (
      <div className={`page-card ${styles.loadingBox}`}>
        <Spin />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-card">
        <p className={styles.errorText}>{error || 'Không tìm thấy dữ liệu.'}</p>
      </div>
    )
  }

  if (data?.type === 'HTTT') {
    return <DetailHTTT data={data} unitId={unitId} taskId={taskId} semesterDisplay={semesterDisplay} />
  }

  if (data?.type === 'HTSK') {
    return <DetailHTSK data={data} semesterDisplay={semesterDisplay} />
  }

  return <DetailHTSK data={data} semesterDisplay={semesterDisplay} />
}