import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Popconfirm } from 'antd'
import { Broadcast, Globe, Handshake, Tag, Trash, Plus, Funnel, Eye, CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  getAllEventBySemesterIdForAdmin,
  deletePublicEvent,
  deleteUnitEvent
} from '../../service/apiAdminEvent'
import { getStoredAuthSession } from '../../service/authSession'
import { getSemesters } from '../../service/semesterService'
import { buildAdminEventDetailPath } from '../adminPaths'
import SemesterSelector from '../../components/semesters/SemesterSelector'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import styles from './eventPage.module.css'

const TYPE_LABEL = { SK: 'Sự kiện', HTSK: 'Hỗ trợ sự kiện', HTTT: 'Hỗ trợ truyền thông' }
const EVENT_TYPE_ICON = { SK: Globe, HTSK: Handshake, HTTT: Broadcast }

export default function EventPage({ navigate, adminUnitId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [semesters, setSemesters] = useState([])
  const [semester] = useCurrentSemester()
  const [filters, setFilters] = useState({ type: 'all' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const pageSize = 10

  const filteredRows = rows.filter(row => {
    const matchType = filters.type === 'all' || row.type === filters.type
    return matchType
  })

  useEffect(() => {
    loadEvents(currentPage)
  }, [semester?.id, currentPage])

  useEffect(() => {
    fetchSemesters()
  }, [])

  const fetchSemesters = async () => {
    try {
      const token = getStoredAuthSession()?.accessToken
      const res = await getSemesters(token)
      setSemesters(res.items || [])
    } catch (err) { console.error('Failed to fetch semesters', err) }
  }

  async function loadEvents(page = 1) {
    setLoading(true)
    setError('')
    try {
      const skip = (page - 1) * pageSize
      const semesterId = semester?.id || 'all'
      const response = await getAllEventBySemesterIdForAdmin(semesterId, skip, pageSize)
      setRows(response.items || [])
      setTotalRows(response.total || 0)
    } catch (e) {
      setError('Không tải được danh sách sự kiện.')
      setRows([])
      setTotalRows(0)
    } finally { setLoading(false) }
  }

  const handleDelete = async (row) => {
    try {
      if (row.type === 'SK') await deletePublicEvent(row.id)
      else await deleteUnitEvent(row.id)
      loadEvents()
    } catch (e) { }
  }

  const goDetail = (row) => {
    if (!adminUnitId) return
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý sự kiện</h1>
        </div>
        <Link
          to={`/admin/${adminUnitId}/events/create`}
          className={styles.createBtn}
          style={{ textDecoration: 'none' }}
        >
          <Plus size={18} weight="bold" /> Tạo sự kiện mới
        </Link>
      </header>
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <SemesterSelector variant="filter" showLabel={false} allowAll={true} />

          <div className={styles.filterSelect}>
            <Tag size={18} />
            <select 
              value={filters.type} 
              onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
            >
              <option value="all">Tất cả loại hình</option>
              <option value="SK">Sự kiện chung (SK)</option>
              <option value="HTSK">Hỗ trợ sự kiện (HTSK)</option>
              <option value="HTTT">Hỗ trợ truyền thông (HTTT)</option>
            </select>
          </div>
        </div>
        <span className={styles.filterSummary}>
          Hiển thị {filteredRows.length}/{rows.length} sự kiện
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Tên sự kiện</span>
          <span>Loại hình</span>
          <span>Điểm</span>
          <span>Học kỳ</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className={styles.emptyState} style={{ color: '#ef4444' }}>{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.emptyState}>Không tìm thấy sự kiện nào khớp với bộ lọc.</div>
        ) : (
          filteredRows.map((row) => (
            <div key={`${row.type}-${row.id}`} className={styles.eventRow}>
              <div className={styles.nameCell}>
                <strong>{row.title}</strong>
              </div>
              <div className={styles.typeCell}>
                {TYPE_LABEL[row.type]}
              </div>
              <div className={styles.pointCell}>
                {row.point}
              </div>
              <div className={styles.semesterCell}>
                {semesters.find(s => s.id === (row.semester_id || row.semesterId))?.name || 'N/A'}
              </div>
              <div className={styles.actionsCell}>
                <button className={styles.actionBtn} onClick={() => goDetail(row)} title="Xem chi tiết">
                  <Eye size={18} />
                </button>
                <Popconfirm
                  title="Xóa sự kiện"
                  description="Xóa vĩnh viễn sự kiện này?"
                  onConfirm={() => handleDelete(row)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <button className={styles.actionBtn} style={{ color: '#ef4444' }} title="Xóa">
                    <Trash size={18} />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.tableFooter}>
        <button 
          className={styles.pageButton}
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || loading}
        >
          <CaretLeft size={16} weight="bold" /> Trước
        </button>
        <div className={styles.paginationInfo}>
          Trang <strong>{currentPage}</strong> / <strong>{Math.ceil(totalRows / pageSize) || 1}</strong>
        </div>
        <button 
          className={styles.pageButton}
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage >= Math.ceil(totalRows / pageSize) || loading}
        >
          Sau <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  )
}
