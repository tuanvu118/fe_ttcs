import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus,
  PencilSimple,
  Trash,
  Funnel,
  MagnifyingGlass,
  Eye,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import { Popconfirm } from 'antd'

import styles from './EventPromotionListPage.module.css'
import { getPromotionsForUnit, deletePromotion } from '../../service/eventPromotionService'
import { getUnitById } from '../../service/unitService'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import SemesterSelector from '../../components/semesters/SemesterSelector'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export default function EventPromotionListPage() {
  const { unitId } = useParams()
  const navigate = useNavigate()

  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState(null)

  const [activeTab, setActiveTab] = useState('ALL') // ALL | DA_DUYET | CHO_DUYET | TU_CHOI
  const [searchTerm, setSearchTerm] = useState('')
  const [semester] = useCurrentSemester()
  const [semesters, setSemesters] = useState([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchInitialData()
  }, [unitId])

  useEffect(() => {
    if (unitId) loadPromotions(currentPage)
  }, [unitId, semester?.id, currentPage, activeTab])

  useEffect(() => {
    setCurrentPage(1)
  }, [semester?.id, activeTab])

  const fetchInitialData = async () => {
    if (!unitId) return
    try {
      const token = getStoredAuthSession()?.accessToken
      const [unitData, semData] = await Promise.all([
        getUnitById(unitId, token),
        getSemesters(token)
      ])
      setUnit(unitData)
      setSemesters(semData.items || [])
    } catch (err) { console.error(err) }
  }

  const loadPromotions = async (page = 1) => {
    if (!unitId) return
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      // Passing activeTab as status if it's not ALL
      const data = await getPromotionsForUnit(
        unitId, 
        semester?.id, 
        skip, 
        pageSize,
        activeTab
      )
      
      let items = data.items || []
      let total = data.total || 0
      
      // If activeTab is filtering by status, we apply it here if the backend 
      // doesn't support direct status filter for my-unit yet.
      // Wait, let's check if my-unit supports status... 
      // Current my-unit in Router doesn't take status. 
      // I should update Router to take status for my-unit too.
      // But for now, we'll filter locally if we have to, 
      // but the plan is to fix the backend.
      
      setPromotions(items)
      setTotalRows(total)
    } catch (err) { } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id, unitId)
      loadPromotions()
    } catch (err) { }
  }

  const filteredData = useMemo(() => {
    return promotions.filter(item => {
      const statusMatch = activeTab === 'ALL' || item.status === activeTab
      const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [promotions, activeTab, searchTerm])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Truyền thông</h1>
        </div>
        <button className={styles.createBtn} onClick={() => navigate(`/staff/${unitId}/promotions/create`)}>
          <Plus size={18} weight="bold" /> Viết bài mới
        </button>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <MagnifyingGlass size={16} />
            <input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, outline: 'none', width: '150px', fontSize: '0.85rem', height: '100%' }}
            />
          </div>
          <div className={styles.filterSelect}>
            <Funnel size={16} />
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
            >
              <option value="ALL">Tất cả bài viết</option>
              <option value="DA_DUYET">Đã đăng</option>
              <option value="CHO_DUYET">Chờ duyệt</option>
              <option value="TU_CHOI">Nháp / Từ chối</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <SemesterSelector variant="filter" showLabel={false} allowAll={true} />
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Tổng số <strong>{totalRows}</strong> bài viết
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Ảnh bìa</span>
          <span>Tiêu đề bài viết</span>
          <span>Học kỳ</span>
          <span>Trạng thái</span>
          <span>Ngày tạo</span>
          <span>Thao tác</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : filteredData.length === 0 ? (
          <div className={styles.emptyState}>Không có bài viết nào ở mục này.</div>
        ) : (
          filteredData.map(item => (
            <div key={item.id} className={styles.promoRow}>
              <div className={styles.bannerCell}>
                <img src={item.image_url || '/placeholder-image.png'} alt="" />
              </div>
              <div className={styles.titleCell}>
                <strong>{item.title}</strong>
              </div>
              <div className={styles.semesterCell}>
                {semesters.find(s => s.id === item.semester_id)?.name || 'N/A'}
              </div>
              <div className={styles.statusCell}>
                {item.status === 'DA_DUYET' && <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Đã đăng</span>}
                {item.status === 'CHO_DUYET' && <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ duyệt</span>}
                {item.status === 'TU_CHOI' && <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>}
              </div>
              <div className={styles.timeCell}>
                {dayjs.utc(item.created_at).local().format('DD/MM/YYYY HH:mm')}
              </div>
              <div className={styles.actionsCell}>
                <button className={styles.actionBtn} onClick={() => navigate(`/staff/${unitId}/promotions/edit/${item.id}`)} title="Sửa">
                  <PencilSimple size={18} />
                </button>
                <Popconfirm
                  title="Xóa bài viết"
                  onConfirm={() => handleDelete(item.id)}
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
    </div>
  )
}
