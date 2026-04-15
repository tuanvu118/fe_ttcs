import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Calendar, 
  FileText,
  Funnel
} from '@phosphor-icons/react'
import styles from './reportManagement.module.css'
import { apiRequest } from '../../service/apiClient'
import ReportDetailView from './ReportDetailView'

export default function StaffReportsPanel({ accessToken, unitId, onSessionExpired }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const navigate = useNavigate()

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`/reports/`, {
        method: 'GET',
        headers: { 'X-Unit-Id': unitId },
        authToken: accessToken,
      })
      if (data) setReports(data)
    } catch (error) {
      if (error.status === 401) onSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [unitId])

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const yearMatch = r.year.toString() === filterYear
      const statusMatch = filterStatus === 'all' || r.status === filterStatus
      return yearMatch && statusMatch
    }).sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))
  }, [reports, filterYear, filterStatus])

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CHUA_NOP': return 'Draft'
      case 'CHO_DUYET': return 'Sent'
      case 'DA_DUYET': return 'Approved'
      case 'BI_TU_CHOI': return 'Rejected'
      default: return status
    }
  }

  const handleViewDetail = (report) => {
    navigate(`/unit/${unitId}/reports/${report.id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>Hệ thống &gt; Báo cáo</p>
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
              <option value="CHUA_NOP">Draft</option>
              <option value="CHO_DUYET">Sent</option>
              <option value="DA_DUYET">Approved</option>
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
          Hiển thị 1-{filteredReports.length} của {reports.length} báo cáo
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
      </div>

    </div>
  )
}
