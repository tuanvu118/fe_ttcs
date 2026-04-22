import { useEffect, useMemo, useState } from 'react'
import { Badge } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { CaretLeft, CaretRight, MagnifyingGlass, Funnel, Eye } from '@phosphor-icons/react'
import { getMyUnitEventsBySemester } from '../../service/taskService'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import SemesterSelector from '../../components/semesters/SemesterSelector'
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
  const [semester] = useCurrentSemester()
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    async function loadAssignedEvents() {
      if (!unitId || !semester?.id) {
        setRows([]); setLoading(false); return
      }
      setLoading(true); setError('')
      try {
        const events = await getMyUnitEventsBySemester(semester.id, unitId)
        setRows(events)
      } catch (e) {
        setRows([]); setError('Không tải được danh sách sự kiện.')
      } finally { setLoading(false) }
    }
    loadAssignedEvents()
  }, [semester?.id, unitId])

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return rows.filter((row) => {
      const matchType = typeFilter === 'ALL' || row.type === typeFilter
      const title = String(row.title || '').toLowerCase()
      const matchKeyword = !q || title.includes(q)
      return matchType && matchKeyword
    })
  }, [rows, keyword, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage))
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handlePageChange = (direction) => {
    if (direction === 'previous' && canGoPrevious) setCurrentPage(prev => prev - 1)
    if (direction === 'next' && canGoNext) setCurrentPage(prev => prev + 1)
  }

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(start, start + itemsPerPage)
  }, [filteredRows, currentPage])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Sự kiện được giao</h1>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <MagnifyingGlass size={16} />
            <input
              placeholder="Tìm kiếm sự kiện..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none', width: '180px' }}
            />
          </div>
          <div className={styles.filterSelect}>
            <Funnel size={16} />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tất cả loại</option>
              <option value="HTTT">{TYPE_LABEL.HTTT}</option>
              <option value="HTSK">{TYPE_LABEL.HTSK}</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <SemesterSelector variant="filter" showLabel={false} allowAll={false} />
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Hiển thị {filteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredRows.length)} của {filteredRows.length} sự kiện
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Tên sự kiện</span>
          <span>Loại hình / Điểm</span>
          <span>Ngày tạo</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className={styles.emptyState} style={{ color: '#ef4444' }}>{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.emptyState}>Không tìm thấy sự kiện nào.</div>
        ) : (
          paginatedRows.map((row) => (
            <div key={row.id} className={styles.eventRow}>
              <div className={styles.eventInfo}>
                <strong>{row.title}</strong>
                <span>ID: {row.id.substring(0, 8)}...</span>
              </div>
              <div className={styles.categoryCell}>
                {TYPE_LABEL[row.type] || row.type} - {row.point ?? 0} điểm
              </div>
              <div className={styles.timeCell}>
                {row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
              <div className={styles.actionsCell}>
                <button className={styles.actionBtn} onClick={() => navigate(`/staff/${unitId}/tasks/${row.id}`)}>
                  <Eye size={18} style={{ marginRight: '6px' }} /> Xem chi tiết
                </button>
              </div>
            </div>
          ))
        )}

        <div className={styles.tableFooter}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => handlePageChange('previous')}
            disabled={!canGoPrevious}
          >
            <CaretLeft size={16} weight="bold" /> Trước
          </button>
          <div className={styles.paginationInfo}>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </div>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => handlePageChange('next')}
            disabled={!canGoNext}
          >
            Sau <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
