import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { WarningCircle } from '@phosphor-icons/react'
import { Spin } from 'antd'
import { getUnitEventById } from '../../../service/apiAdminEvent'
import EUDetailHTTT from './EUDetailHTTT'
import EUDetailHTSK from './EUDetailHTSK'
import styles from './EUDetail.module.css'

export default function UnitEventDetailPage() {
  const { unitId, eventId } = useParams()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [unitId, eventId])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      const eventRes = await getUnitEventById(eventId, unitId)
      setData(eventRes)
    } catch (err) {
      console.error('Fetch unit event detail failed', err)
      setError('Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <Spin size="large" />
        <p>Đang tải thông tin yêu cầu...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.loadingBox}>
        <WarningCircle size={48} color="#ef4444" />
        <p>{error || 'Không tìm thấy dữ liệu.'}</p>
        <button className="secondary-button" onClick={() => window.history.back()}>Quay lại</button>
      </div>
    )
  }

  if (data.type === 'HTTT') {
    return <EUDetailHTTT data={data} unitId={unitId} eventId={eventId} />
  }

  return <EUDetailHTSK data={data} unitId={unitId} eventId={eventId} />
}
