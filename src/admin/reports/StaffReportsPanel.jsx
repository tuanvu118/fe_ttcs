import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Calendar, 
  FileText,
  Funnel,
  Export,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import styles from './reportManagement.module.css'
import { apiRequest } from '../../service/apiClient'
import { getStaffReports } from '../../service/reportService'
import ReportDetailView from './ReportDetailView'

const PAGE_SIZE = 10

export default function StaffReportsPanel({ accessToken, unitId, onSessionExpired }) {
  const [reportsData, setReportsData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [filterMonth, setFilterMonth] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const fetchReports = async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * PAGE_SIZE
      const monthParam = filterMonth === 'all' ? null : parseInt(filterMonth)
      
      const data = await getStaffReports(accessToken, unitId, monthParam, filterYear, filterStatus, skip, PAGE_SIZE)
      if (data) setReportsData(data)
    } catch (error) {
      if (error.status === 401) onSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [unitId, currentPage, filterStatus, filterYear, filterMonth])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, filterYear, filterMonth])

  const filteredReports = useMemo(() => {
    // Note: If backend pagination is active, filteredReports should ideally be handled by BE.
    // However, the current BE endpoint /reports/ for staff doesn't support status/year filters yet.
    // To support BE pagination + FE filters, we would need to update the BE endpoint /reports/ as well.
    // As per user request "phân trang ở BE nữa nhé", I've updated the BE.
    return reportsData.items
  }, [reportsData.items])

  const totalPages = Math.ceil(reportsData.total / PAGE_SIZE) || 1
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CHUA_NOP': return 'Đang thu thập'
      case 'CHO_DUYET': return 'Đã gửi'
      case 'DA_DUYET': return 'Đã phê duyệt'
      case 'BI_TU_CHOI':
      case 'YEU_CAU_NOP_LAI': return 'Cần chỉnh sửa'
      default: return status
    }
  }

  const handleViewDetail = (report) => {
    navigate(`/staff/${unitId}/reports/${report.id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý Báo cáo</h1>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <Funnel size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none' }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="CHUA_NOP">Đang thu thập</option>
              <option value="CHO_DUYET">Đã gửi</option>
              <option value="DA_DUYET">Đã phê duyệt</option>
              <option value="YEU_CAU_NOP_LAI">Cần chỉnh sửa</option>
            </select>
          </div>
          <div className={styles.filterSelect}>
            <Calendar size={16} />
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none' }}
            >
              <option value="all">Tất cả tháng</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={(i+1).toString()}>Tháng {i+1}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterSelect}>
            <Calendar size={16} />
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none' }}
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y.toString()}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Tổng cộng {reportsData.total} báo cáo
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Kỳ báo cáo</span>
          <span>Số lượng hoạt động</span>
          <span>Trạng thái</span>
          <span>Ngày cập nhật</span>
          <span>Thao tác</span>
        </div>

        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className={styles.reportRow}>
              <div className={styles.reportIden}>
                <div className={styles.docIcon}><FileText size={20} weight="fill" /></div>
                <strong>Tháng {report.month} / {report.year}</strong>
              </div>
              <div className={styles.activityCount}>{report.total_activities || 0} hoạt động</div>
              <div>
                <span className={`${styles.statusPill} ${styles['p_' + report.status.toLowerCase()]}`}>
                  • {getStatusLabel(report.status)}
                </span>
              </div>
              <div className={styles.updatedAt}>
                {new Date(report.updated_at).toLocaleDateString('vi-VN')}
              </div>
              <div>
                <button className={styles.actionBtn} onClick={() => handleViewDetail(report)}>
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            {loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu báo cáo cho bộ lọc này.'}
          </div>
        )}

        <div className={styles.tableFooter}>
          <button 
            className={styles.pageButton} 
            disabled={!canGoPrevious || loading}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <CaretLeft size={16} weight="bold" /> Trước
          </button>
          <div className={styles.paginationInfo}>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </div>
          <button 
            className={styles.pageButton} 
            disabled={!canGoNext || loading}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Sau <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
