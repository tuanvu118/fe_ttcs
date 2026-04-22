import { useEffect, useState } from 'react'
import NotificationPopup from '../../components/NotificationPopup'
import { createSemester, getSemesters, updateSemester } from '../../service/semesterService'
import { USER_ROLES } from '../../utils/routes'
import { getValidationMessage } from '../../utils/userUtils'
import { formatSemesterDate } from '../../utils/semesterUtils'
import SemesterFormModal from './SemesterFormModal'
import SemesterStatusBadge from './SemesterStatusBadge'
import styles from './adminSemesters.module.css'
import { Plus, Pencil, CaretLeft, CaretRight } from '@phosphor-icons/react'

const DEFAULT_LIMIT = 10

export default function SemesterManagementPage({ accessToken, roleLabel, role, onSessionExpired }) {
  const [result, setResult] = useState({
    items: [],
    total: 0,
    skip: 0,
    limit: DEFAULT_LIMIT,
  })
  const [query, setQuery] = useState({ skip: 0, limit: DEFAULT_LIMIT })
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)

  const isGlobalAdmin = role === USER_ROLES.admin
  const currentPage = Math.floor(result.skip / Math.max(result.limit, 1)) + 1
  const totalPages = Math.max(Math.ceil(result.total / Math.max(result.limit, 1)), 1)
  const canGoPrevious = result.skip > 0
  const canGoNext = result.skip + result.limit < result.total

  useEffect(() => {
    loadSemesters(query)
  }, [accessToken, query])

  async function loadSemesters(nextQuery) {
    setIsLoadingList(true)
    try {
      const response = await getSemesters(nextQuery, accessToken)
      setResult({
        items: response.items,
        total: response.total,
        skip: response.skip,
        limit: response.limit || DEFAULT_LIMIT,
      })
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách học kỳ.')
    } finally {
      setIsLoadingList(false)
    }
  }

  async function handleCreateSemester(payload) {
    setIsSubmitting(true)
    try {
      await createSemester(payload, accessToken)
      setIsCreateOpen(false)
      setQuery(p => ({ ...p, skip: 0 }))
      await loadSemesters({ ...query, skip: 0 })
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Tạo học kỳ thất bại.'))
    } finally { setIsSubmitting(false) }
  }

  async function handleEditSemester(payload) {
    if (!editingSemester?.id) return
    setIsSubmitting(true)
    try {
      await updateSemester(editingSemester.id, payload, accessToken)
      setEditingSemester(null)
      await loadSemesters(query)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật học kỳ thất bại.'))
    } finally { setIsSubmitting(false) }
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) {
      setNotice({ title: 'Phiên đăng nhập hết hạn', message: 'Vui lòng đăng nhập lại.', onClose: onSessionExpired })
      return
    }
    setNotice({ title: 'Có lỗi xảy ra', message: error?.message || fallbackMessage })
  }

  const handlePageChange = (direction) => {
    const nextSkip = direction === 'next' ? query.skip + query.limit : Math.max(query.skip - query.limit, 0)
    setQuery(prev => ({ ...prev, skip: nextSkip }))
  }

  return (
    <div className={styles.container}>
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />

      <SemesterFormModal
        isOpen={isCreateOpen}
        mode="create"
        isSubmitting={isSubmitting}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSemester}
      />

      <SemesterFormModal
        isOpen={Boolean(editingSemester)}
        mode="edit"
        initialValues={editingSemester}
        isSubmitting={isSubmitting}
        onClose={() => setEditingSemester(null)}
        onSubmit={handleEditSemester}
      />

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý học kỳ</h1>
        </div>
        {isGlobalAdmin && (
          <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} weight="bold" /> Tạo học kỳ mới
          </button>
        )}
      </header>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>Tên học kỳ</span>
          <span>Năm học</span>
          <span>Bắt đầu</span>
          <span>Kết thúc</span>
          <span>Trạng thái / Thao tác</span>
        </div>

        {isLoadingList ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : result.items.length > 0 ? (
          result.items.map((semester) => (
            <div key={semester.id} className={styles.semesterRow}>
              <div className={styles.semesterName}>{semester.name}</div>
              <div className={styles.yearValue}>{semester.academic_year}</div>
              <div className={styles.dateValue}>{formatSemesterDate(semester.start_date)}</div>
              <div className={styles.dateValue}>{formatSemesterDate(semester.end_date)}</div>
              <div className={styles.actions}>
                <span className={`${styles.statusPill} ${semester.is_active ? styles.active : styles.inactive}`}>
                  • {semester.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
                {isGlobalAdmin && (
                  <button className={styles.actionBtn} onClick={() => setEditingSemester(semester)} title="Chỉnh sửa">
                    <Pencil size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>Chưa có học kỳ nào trong hệ thống.</div>
        )}
      </div>

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
  )
}
