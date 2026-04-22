import { useEffect, useState } from 'react'
import { Modal, message, Skeleton, Tag, Select, Empty } from 'antd'
import { 
  Megaphone, 
  Clock, 
  Buildings, 
  Article, 
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Funnel,
  Monitor,
  Eye,
  Calendar,
  MagnifyingGlass,
  Tag as TagIcon,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import styles from './AdminPromotionManagement.module.css'
import { getAllPromotionsForAdmin, updatePromotionStatus } from '../../service/eventPromotionService'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import SemesterSelector from '../../components/semesters/SemesterSelector'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'

const STATUS_OPTIONS = [
  { value: 'CHO_DUYET', label: 'Chờ duyệt' },
  { value: 'DA_DUYET', label: 'Đã đăng' },
  { value: 'TU_CHOI', label: 'Từ chối' },
  { value: 'ALL', label: 'Tất cả trạng thái' }
]

export default function AdminPromotionManagement({ accessToken, onSessionExpired }) {
  const [promotions, setPromotions] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'ALL',
    semester_id: 'ALL'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadSemesters()
  }, [])

  useEffect(() => {
    loadData(currentPage)
  }, [filters, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const loadSemesters = async () => {
    try {
      const data = await getSemesters()
      setSemesters(data.items || [])
    } catch (err) {
      console.error('Load semesters failed', err)
    }
  }

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const params = {
        skip,
        limit: pageSize
      }
      if (filters.status !== 'ALL') params.status = filters.status
      if (filters.semester_id !== 'ALL') params.semester_id = filters.semester_id

      const data = await getAllPromotionsForAdmin(params)
      setPromotions(data.items || [])
      setTotalRows(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (promo) => {
    setSelectedPromo(promo)
    setIsDetailModalOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedPromo) return
    setIsSubmitting(true)
    try {
      await updatePromotionStatus(selectedPromo.id, 'DA_DUYET')
      message.success('Đã phê duyệt bài viết!')
      setIsDetailModalOpen(false)
      loadData()
    } catch (err) {
      // Error handled by service
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPromo || !rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối.')
      return
    }
    setIsSubmitting(true)
    try {
      await updatePromotionStatus(selectedPromo.id, 'TU_CHOI', rejectReason.trim())
      message.success('Đã từ chối bài viết.')
      setIsRejectModalOpen(false)
      setRejectReason('')
      setIsDetailModalOpen(false)
      loadData()
    } catch (err) {
      // Error handled by service
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHO_DUYET': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ duyệt</span>
      case 'DA_DUYET': return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Đã đăng</span>
      case 'TU_CHOI': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>
      default: return <span className={styles.statusBadge}>Không xác định</span>
    }
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý Tin bài & Quảng bá</h1>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <SemesterSelector variant="filter" showLabel={false} allowAll={true} />

          <div className={styles.filterSelect}>
            <TagIcon size={18} />
            <select 
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <span className={styles.filterSummary}>
          Tổng số <strong>{totalRows}</strong> bài viết
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Ảnh bìa</span>
          <span>Tiêu đề bài viết</span>
          <span>Đơn vị gửi</span>
          <span>Học kỳ</span>
          <span>Trạng thái</span>
          <span>Ngày gửi</span>
          <span>Thao tác</span>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              </div>
            ))
          ) : promotions.length === 0 ? (
            <div className={styles.emptyState}>
              <Empty description="Không có bài viết nào phù hợp với bộ lọc" />
            </div>
          ) : (
            promotions
              .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(item => (
                <div key={item.id} className={styles.tableRow} onClick={() => handleOpenDetail(item)}>
                  <div className={styles.bannerCell}>
                    <img src={item.image_url || 'https://placehold.co/600x400?text=No+Image'} alt="Banner" />
                  </div>
                  <div className={styles.titleCell}>
                    <strong>{item.title}</strong>
                  </div>
                  <div className={styles.unitCell}>
                    <Buildings size={16} weight="bold" />
                    <span>{item.organization?.name || 'N/A'}</span>
                  </div>
                  <div className={styles.semesterCell}>
                    {semesters.find(s => s.id === item.semester_id)?.name || 'N/A'}
                  </div>
                  <div className={styles.statusCell}>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className={styles.dateCell}>
                    {formatDate(item.created_at)}
                  </div>
                  <div className={styles.actionCell}>
                    <button className={styles.viewBtn}>
                      <Eye size={18} />
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* PHÂN TRANG */}
      <div className={styles.tableFooter}>
        <button 
          className={styles.pageButton} 
          disabled={currentPage === 1 || loading}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          <CaretLeft size={16} weight="bold" /> Trước
        </button>
        <div className={styles.paginationInfo}>
          Trang <strong>{currentPage}</strong> / <strong>{Math.ceil(totalRows / pageSize) || 1}</strong>
        </div>
        <button 
          className={styles.pageButton} 
          disabled={currentPage >= Math.ceil(totalRows / pageSize) || loading}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Sau <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* MODAL CHI TIẾT BÀI VIẾT */}
      <Modal
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={selectedPromo?.status === 'CHO_DUYET' ? (
          <div className={styles.modalFooter}>
            <div className={styles.footerBtns}>
              <button 
                className={styles.modalRejectBtn}
                onClick={() => setIsRejectModalOpen(true)}
              >
                <XCircle size={18} weight="bold" />
                TỪ CHỐI
              </button>
              <button 
                className={styles.modalApproveBtn}
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'ĐANG XỬ LÝ...' : (
                  <>
                    <CheckCircle size={18} weight="bold" />
                    DUYỆT BÀI
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
        width={1000}
        centered
        className={styles.detailModal}
      >
        {selectedPromo && (
          <div className={styles.modalContent}>
            <header className={styles.modalHeader}>
              <h1>{selectedPromo.title}</h1>
              <div className={styles.modalMeta}>
                <div className={styles.metaItem}>
                  <Buildings size={18} weight="bold" />
                  <span>Đơn vị: {selectedPromo.organization?.name}</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={18} weight="bold" />
                  <span>Học kỳ: {semesters.find(s => s.id === selectedPromo.semester_id)?.name}</span>
                </div>
                <div className={styles.metaItem}>
                  <Clock size={18} weight="bold" />
                  <span>Thời gian: {formatDate(selectedPromo.created_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <Monitor size={18} weight="bold" />
                  <span>Trạng thái: {getStatusBadge(selectedPromo.status)}</span>
                </div>
              </div>
            </header>

            <div className={styles.modalBody}>
              {selectedPromo.image_url && (
                <div className={styles.modalBanner}>
                  <img src={selectedPromo.image_url} alt="Banner" />
                </div>
              )}

              <div className={styles.articleContent}>
                <h3>Nội dung bài viết</h3>
                <div 
                  className={styles.richText}
                  dangerouslySetInnerHTML={{ __html: selectedPromo.description }}
                />
              </div>

              {selectedPromo.external_links && selectedPromo.external_links.length > 0 && (
                <div className={styles.modalLinks}>
                  <h3>Liên kết tham khảo</h3>
                  <div className={styles.linksGrid}>
                    {selectedPromo.external_links.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                        <LinkIcon size={16} />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedPromo.status === 'TU_CHOI' && selectedPromo.rejected_reason && (
                <div className={styles.rejectionNotice}>
                  <h3>Lý do từ chối trước đó</h3>
                  <p>{selectedPromo.rejected_reason}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* MODAL NHẬP LÝ DO TỪ CHỐI */}
      <Modal
        title={null}
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleReject}
        confirmLoading={isSubmitting}
        okText="Xác nhận từ chối"
        cancelText="Quay lại"
        okButtonProps={{ danger: true, style: { fontWeight: 700 } }}
        centered
        width={480}
      >
        <div className={styles.rejectModalInner}>
          <div className={styles.rejectModalHeader}>
            <XCircle size={32} weight="duotone" color="#ef4444" />
            <h2>Lý do từ chối</h2>
          </div>
          <p>Nhập lý do chi tiết để giúp đơn vị chỉnh sửa bài viết tốt hơn:</p>
          <textarea 
            className={styles.reasonTextArea}
            placeholder="Ví dụ: Hình ảnh không đúng kích thước, sai thông tin ngày diễn ra sự kiện..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
