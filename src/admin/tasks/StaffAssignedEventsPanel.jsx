import { useEffect, useMemo, useState } from 'react'
import { Badge, Select } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { getMyUnitEventsBySemester } from '../../service/taskService'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import { getStoredCurrentSemester } from '../../utils/currentSemesterStorage'
import styles from './staffAssignedEventsPanel.module.css'

const TYPE_LABEL = {
  HTSK: 'Hỗ trợ sự kiện',
  HTTT: 'Hỗ trợ truyền thông',
}

export default function StaffAssignedEventsPanel() {
  const navigate = useNavigate()
  const { unitId } = useParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [semesters, setSemesters] = useState([])
  const [selectedSemesterId, setSelectedSemesterId] = useState(() => {
    const stored = getStoredCurrentSemester()
    return stored?.id || ''
  })

  useEffect(() => {
    async function fetchSemesters() {
      try {
        const token = getStoredAuthSession()?.accessToken
        const res = await getSemesters(token)
        const items = res.items || []
        setSemesters(items)
        if (!selectedSemesterId && items.length > 0) {
          const active = items.find((s) => s.is_active) || items[0]
          setSelectedSemesterId(active.id)
        }
      } catch {
        setSemesters([])
      }
    }
    fetchSemesters()
  }, [selectedSemesterId])

  useEffect(() => {
    async function loadAssignedEvents() {
      if (!unitId || !selectedSemesterId) {
        setRows([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const events = await getMyUnitEventsBySemester(selectedSemesterId, unitId)
        setRows(events)
      } catch (e) {
        setRows([])
        setError('Không tải được danh sách sự kiện được giao.')
      } finally {
        setLoading(false)
      }
    }
    loadAssignedEvents()
  }, [selectedSemesterId, unitId])

  const semesterOptions = useMemo(
    () =>
      semesters.map((s) => ({
        value: s.id,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>{s.name} - {s.academic_year}</span>
            {s.is_active && (
              <Badge
                count="Đang diễn ra"
                style={{ backgroundColor: 'var(--ds-success)', marginLeft: '10px', fontSize: '10px' }}
              />
            )}
          </div>
        ),
      })),
    [semesters],
  )

  function goDetail(row) {
    if (!unitId) return
    navigate(`/staff/${unitId}/tasks/${row.id}`)
  }

  return (
    <section className={`page-card ${styles.root}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sự kiện được giao</h1>
        <Select
          className={styles.semesterSelect}
          style={{ width: 300 }}
          placeholder="Chọn học kỳ"
          value={selectedSemesterId || undefined}
          onChange={setSelectedSemesterId}
          options={semesterOptions}
        />
      </div>

      {loading ? (
        <div className={styles.hint}>Đang tải…</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>Không có sự kiện được giao trong học kỳ này.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col className={styles.colTitle} />
              <col className={styles.colPoint} />
              <col className={styles.colType} />
              <col className={styles.colDate} />
              <col className={styles.colAction} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col" className={styles.thNumeric}>
                  Điểm
                </th>
                <th scope="col">Loại</th>
                <th scope="col">Ngày tạo</th>
                <th scope="col" className={styles.thAction} aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.titleCell}>
                    <span className={styles.titleText}>{row.title}</span>
                  </td>
                  <td className={styles.numCell}>{row.point ?? 0}</td>
                  <td>
                    <span
                      className={`${styles.typePill} ${
                        row.type === 'HTTT' ? styles.typePillHttt : row.type === 'HTSK' ? styles.typePillHtsk : styles.typePillNeutral
                      }`}
                    >
                      {TYPE_LABEL[row.type] || row.type}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {row.created_at ? new Date(row.created_at).toLocaleString('vi-VN') : 'N/A'}
                  </td>
                  <td className={styles.actionCell}>
                    <button type="button" className={styles.linkBtn} onClick={() => goDetail(row)}>
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
