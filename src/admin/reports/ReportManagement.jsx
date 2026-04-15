import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileArrowDown, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChartBar, 
  Funnel,
  Calendar,
  FileText,
  Export
} from '@phosphor-icons/react'
import { getAllReports, exportSummaryExcel } from '../../service/reportService'
import { getUnitById } from '../../service/unitService'
import styles from './reportManagement.module.css'
import NotificationPopup from '../../components/NotificationPopup'
import ReportDetailView from './ReportDetailView'

export default function ReportManagement({ accessToken, roleLabel, onSessionExpired }) {
  const [reports, setReports] = useState([])
  const [unitNames, setUnitNames] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState(null)
  const navigate = useNavigate()
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === 'CHO_DUYET').length,
    approved: reports.filter((r) => r.status === 'DA_DUYET').length,
    rejected: reports.filter((r) => r.status === 'YEU_CAU_NOP_LAI' || r.status === 'BI_TU_CHOI').length,
  }), [reports])

  useEffect(() => {
    loadReports()
  }, [accessToken])

  async function loadReports() {
    setIsLoading(true)
    try {
      const data = await getAllReports(accessToken)
      setReports(data)
      await loadUnitNames(data)
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách báo cáo.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadUnitNames(reportList) {
    const uniqueUnitIds = [...new Set(reportList.map((r) => r.unit_id))]
    const names = { ...unitNames }
    await Promise.all(
      uniqueUnitIds.map(async (id) => {
        if (names[id]) return
        try {
          const unit = await getUnitById(id, accessToken)
          names[id] = unit.name
        } catch {
          names[id] = 'N/A'
        }
      }),
    )
    setUnitNames(names)
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) {
      setNotice({
        title: 'Phiên đăng nhập hết hạn',
        message: 'Vui lòng đăng nhập lại để tiếp tục.',
        onClose: onSessionExpired,
      })
      return
    }
    setNotice({
      title: 'Có lỗi xảy ra',
      message: error?.message || fallbackMessage,
    })
  }

  async function handleExportSummary() {
    try {
      const blob = await exportSummaryExcel(accessToken)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bao_cao_tong_hop_${new Date().toLocaleDateString('vi-VN')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (error) {
      handleApiError(error, 'Xuất file Excel thất bại.')
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const yearMatch = r.year.toString() === filterYear
      const statusMatch = filterStatus === 'all' || r.status === filterStatus
      return yearMatch && statusMatch
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }, [reports, filterYear, filterStatus])

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CHUA_NOP': return 'Draft'
      case 'CHO_DUYET': return 'Chờ duyệt'
      case 'DA_DUYET': return 'Đã duyệt'
      case 'BI_TU_CHOI': 
      case 'YEU_CAU_NOP_LAI': return 'Yêu cầu nộp lại'
      default: return status
    }
  }

  const handleViewDetail = (report) => {
    navigate(`/admin/${report.unit_id}/reports/${report.id}`)
  }

  return (
    <div className={styles.container}>
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => {
          const callback = notice?.onClose
          setNotice(null)
          callback?.()
        }}
      />

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>Quản trị &gt; Phê duyệt báo cáo</p>
          <h1>Thẩm định Báo cáo </h1>
        </div>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={handleExportSummary}
          disabled={reports.length === 0}
        >
          <Export size={20} weight="bold" /> Xuất tổng hợp
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statIcon}><ChartBar size={28} weight="fill" /></div>
          <div className={styles.statInfo}>
             <h3>{stats.total}</h3>
             <span>Tổng báo cáo</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.pending}`}>
          <div className={styles.statIcon}><Clock size={28} weight="fill" /></div>
          <div className={styles.statInfo}>
             <h3>{stats.pending}</h3>
             <span>Đang chờ duyệt</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}><CheckCircle size={28} weight="fill" /></div>
          <div className={styles.statInfo}>
             <h3>{stats.approved}</h3>
             <span>Đã hoàn thành</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <div className={styles.statIcon}><XCircle size={28} weight="fill" /></div>
          <div className={styles.statInfo}>
             <h3>{stats.rejected}</h3>
             <span>Cần chỉnh sửa</span>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <Funnel size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, outline: 'none' }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="CHO_DUYET">Đang chờ duyệt</option>
              <option value="DA_DUYET">Đã phê duyệt</option>
              <option value="YEU_CAU_NOP_LAI">Yêu cầu nộp lại</option>
            </select>
          </div>
          <div className={styles.filterSelect}>
            <Calendar size={16} />
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 700, outline: 'none' }}
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y.toString()}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Hiển thị {filteredReports.length} của {reports.length} báo cáo
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>ĐƠN VỊ & KỲ BÁO CÁO</span>
          <span>SỐ LƯỢNG</span>
          <span>TRẠNG THÁI</span>
          <span>CẬP NHẬT</span>
          <span>THAO TÁC</span>
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className={styles.reportRow}>
              <div className={styles.reportIden}>
                <div className={styles.docIcon}><FileText size={22} weight="fill" /></div>
                <div>
                  <strong>{unitNames[report.unit_id] || 'N/A'}</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Tháng {report.month} / {report.year}</p>
                </div>
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
                   Thẩm định <Eye size={18} />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            Không tìm thấy báo cáo nào phù hợp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  )
}
