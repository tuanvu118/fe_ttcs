import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Broadcast, Globe, Handshake, Tag } from '@phosphor-icons/react'
import { Select, Badge } from 'antd'
import { getAllEventBySemesterIdForAdmin } from '../../service/apiAdminEvent'
import { getStoredAuthSession } from '../../service/authSession'
import { getSemesters } from '../../service/semesterService'
import {
  CURRENT_SEMESTER_STORAGE_KEY,
  getStoredCurrentSemester,
} from '../../utils/currentSemesterStorage'
import { buildAdminEventDetailPath } from '../adminPaths'
import styles from './eventPage.module.css'

const TYPE_LABEL = {
  SK: 'Sự kiện',
  HTSK: 'Hỗ trợ sự kiện',
  HTTT: 'Hỗ trợ truyền thông',
}

const EVENT_TYPE_ICON = {
  SK: Globe,
  HTSK: Handshake,
  HTTT: Broadcast,
}

const TYPE_ICON_SIZE = 20

function EventTitleCell({ title, eventType }) {
  const Icon = EVENT_TYPE_ICON[eventType] ?? Tag
  const typeLabel = TYPE_LABEL[eventType] ?? eventType
  return (
    <div className={styles.eventTitleCell}>
      <span className={styles.eventTitleIcon} data-event-type={eventType} aria-hidden>
        <Icon size={TYPE_ICON_SIZE} weight="regular" />
      </span>
      <span className={styles.eventTitleText} title={`${typeLabel} — ${title}`}>
        {title}
      </span>
    </div>
  )
}

function EventTypeBadge({ eventType }) {
  const label = TYPE_LABEL[eventType] ?? eventType
  return (
    <span className={styles.typeBadge} data-event-type={eventType} title={eventType}>
      {label}
    </span>
  )
}

export default function EventPage({ navigate, adminUnitId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [semesters, setSemesters] = useState([])
  const [selectedSemesterId, setSelectedSemesterId] = useState(() => {
     const stored = getStoredCurrentSemester()
     return stored?.id || 'all'
  })

  useEffect(() => {
    fetchSemesters()
  }, [])

  const fetchSemesters = async () => {
    try {
      const token = getStoredAuthSession()?.accessToken
      const res = await getSemesters(token)
      setSemesters(res.items || [])
    } catch (err) {
      console.error('Failed to fetch semesters', err)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedSemesterId])

  async function loadEvents() {
    setLoading(true)
    setError('')
    try {
      const events = await getAllEventBySemesterIdForAdmin(selectedSemesterId)
      setRows(events)
    } catch (e) {
      setError('Không tải được danh sách sự kiện.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  function goDetail(row) {
    if (!adminUnitId) {
      return
    }
    navigate(buildAdminEventDetailPath(adminUnitId, row.id, row.type))
  }

  const semesterOptions = [
    { value: 'all', label: 'Tất cả học kỳ' },
    ...semesters.map(s => ({
      value: s.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{s.name} - {s.academic_year}</span>
          {s.is_active && <Badge count="Đang diễn ra" style={{ backgroundColor: '#10b981', marginLeft: '10px', fontSize: '10px' }} />}
        </div>
      ),
      searchValue: `${s.name} ${s.academic_year}`
    }))
  ]

  return (
    <section className={`page-card ${styles.eventsRoot}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sự kiện</h1>
        <div className={styles.actions}>
          <Select
            className={styles.semesterSelect}
            style={{ width: 300 }}
            placeholder="Chọn học kỳ"
            value={selectedSemesterId}
            onChange={setSelectedSemesterId}
            options={semesterOptions}
          />
          <Link 
            to={`/admin/${adminUnitId}/events/create`} 
            className={styles.createBtn}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Tạo sự kiện mới
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.hint}>Đang tải…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>Không có sự kiện nào.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Điểm</th>
                <th>Loại</th>
                {selectedSemesterId === 'all' && <th>Học kỳ</th>}
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}-${row.id}`}>
                  <td>
                    <EventTitleCell title={row.title} eventType={row.type} />
                  </td>
                  <td>
                    <span className={styles.pointCell}>
                      <span className={styles.pointDot} aria-hidden />
                      <span>{row.point}</span>
                    </span>
                  </td>
                  <td>
                    <EventTypeBadge eventType={row.type} />
                  </td>
                  {selectedSemesterId === 'all' && (
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {semesters.find(s => s.id === (row.semester_id || row.semesterId))?.name || 'N/A'}
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => goDetail(row)}
                      disabled={!adminUnitId}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
