import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import NotificationPopup from '../../components/NotificationPopup'
import UnitFormModal from '../../components/units/UnitFormModal'
import UnitLogo from '../../components/units/UnitLogo'
import UnitTypeBadge from '../../components/units/UnitTypeBadge'
import {
  createUnit,
  deleteUnit,
  getManagedUnits,
  getUnitMembers,
  updateUnit,
} from '../../service/unitService'
import { UNIT_TYPES, USER_ROLES } from '../../utils/routes'
import { getValidationMessage } from '../../utils/userUtils'
import UnitDetailModal from './UnitDetailModal'
import styles from './adminUnits.module.css'
import { Plus, MagnifyingGlass, Funnel, Pencil, Trash, Eye, CaretLeft, CaretRight } from '@phosphor-icons/react'

const DEFAULT_LIMIT = 10
const STAFF_FETCH_LIMIT = 100
const EMPTY_ARRAY = []

export default function UnitsManagementPage({
  accessToken,
  role,
  roleLabel,
  user,
  onSessionExpired,
}) {
  const [result, setResult] = useState({
    items: [],
    total: 0,
    skip: 0,
    limit: DEFAULT_LIMIT,
  })
  const [memberTotals, setMemberTotals] = useState({})
  const [query, setQuery] = useState({ skip: 0, limit: 10, name: '', type: '' })
  const [filters, setFilters] = useState({ name: '', type: '' })

  useEffect(() => {
    // Tránh chạy lúc mount nếu giá trị giống hệt query mặc định
    if (filters.name === query.name && filters.type === query.type) return

    const timer = setTimeout(() => {
      setQuery(prev => ({ ...prev, skip: 0, name: filters.name, type: filters.type }))
    }, 400)
    return () => clearTimeout(timer)
  }, [filters, query.name, query.type])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [deletingUnit, setDeletingUnit] = useState(null)
  const [viewingUnit, setViewingUnit] = useState(null)

  const isAdmin = role === USER_ROLES.admin
  const isStaff = role === USER_ROLES.staff
  const staffManagedUnitIds = useMemo(() => {
    if (!isStaff) return EMPTY_ARRAY
    return [
      ...new Set(
        (user?.roles || [])
          .filter(r => r?.unit_id && (r?.roles || []).some(rn => rn.toUpperCase() === 'STAFF'))
          .map(r => r.unit_id)
      ),
    ]
  }, [isStaff, JSON.stringify(user?.roles)])

  const currentPage = Math.floor(result.skip / Math.max(result.limit, 1)) + 1
  const totalPages = Math.max(Math.ceil(result.total / Math.max(result.limit, 1)), 1)
  const canGoPrevious = result.skip > 0
  const canGoNext = result.skip + result.limit < result.total
  const showingFrom = result.total ? result.skip + 1 : 0
  const showingTo = result.total ? Math.min(result.skip + result.items.length, result.total) : 0

  const pageTitle = 'Quản lý đơn vị / CLB'

  useEffect(() => {
    loadUnits(query)
  }, [accessToken, query, isStaff, staffManagedUnitIds])

  useEffect(() => {
    loadMemberTotals(result.items)
  }, [result.items, accessToken])

  async function loadUnits(nextQuery) {
    setIsLoading(true)
    try {
      if (isStaff) {
        const items = await getAllUnitsForStaff(nextQuery)
        const filteredItems = items.filter(unit => staffManagedUnitIds.includes(unit.id))
        const start = nextQuery.skip || 0
        const end = start + (nextQuery.limit || DEFAULT_LIMIT)
        setResult({
          items: filteredItems.slice(start, end),
          total: filteredItems.length,
          skip: start,
          limit: nextQuery.limit || DEFAULT_LIMIT,
        })
        return
      }
      const response = await getManagedUnits(nextQuery, accessToken)
      setResult({
        items: response.items,
        total: response.total,
        skip: response.skip,
        limit: response.limit || DEFAULT_LIMIT,
      })
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách đơn vị.')
    } finally {
      setIsLoading(false)
    }
  }

  async function getAllUnitsForStaff(nextQuery) {
    const baseQuery = { skip: 0, limit: STAFF_FETCH_LIMIT, name: nextQuery.name, type: nextQuery.type }
    const firstPage = await getManagedUnits(baseQuery, accessToken)
    const allItems = [...firstPage.items]
    let loaded = firstPage.items.length
    while (loaded < firstPage.total) {
      const nextPage = await getManagedUnits({ ...baseQuery, skip: loaded }, accessToken)
      if (!nextPage.items.length) break
      allItems.push(...nextPage.items)
      loaded += nextPage.items.length
    }
    return allItems
  }

  async function loadMemberTotals(units) {
    if (!units.length) { setMemberTotals({}); return; }
    const pairs = await Promise.all(units.map(async (unit) => {
      try {
        const response = await getUnitMembers(unit.id, { skip: 0, limit: 1 }, accessToken)
        return [unit.id, response.total]
      } catch { return [unit.id, null] }
    }))
    setMemberTotals(Object.fromEntries(pairs))
  }

  async function handleCreateUnit(form) {
    setIsSubmitting(true)
    try {
      await createUnit(form, accessToken)
      setIsCreateOpen(false)
      setQuery({ ...query, skip: 0 })
      await loadUnits({ ...query, skip: 0 })
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Tạo đơn vị thất bại.'))
    } finally { setIsSubmitting(false) }
  }

  async function handleEditUnit(form) {
    if (!editingUnit?.id) return
    setIsSubmitting(true)
    try {
      await updateUnit(editingUnit.id, form, accessToken)
      setEditingUnit(null)
      await loadUnits(query)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật đơn vị thất bại.'))
    } finally { setIsSubmitting(false) }
  }

  async function handleDeleteUnit() {
    if (!deletingUnit?.id) return
    setIsSubmitting(true)
    try {
      await deleteUnit(deletingUnit.id, accessToken)
      setDeletingUnit(null)
      const fallbackSkip = result.items.length <= 1 && query.skip > 0 ? Math.max(query.skip - query.limit, 0) : query.skip
      setQuery({ ...query, skip: fallbackSkip })
      await loadUnits({ ...query, skip: fallbackSkip })
    } catch (error) {
      handleApiError(error, 'Xóa đơn vị thất bại.')
    } finally { setIsSubmitting(false) }
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) {
      setNotice({ title: 'Phiên đăng nhập hết hạn', message: 'Vui lòng đăng nhập lại.', onClose: onSessionExpired })
      return
    }
    setNotice({ title: 'Có lỗi xảy ra', message: error?.message || fallbackMessage })
  }

  function handlePageChange(direction) {
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

      <UnitFormModal
        isOpen={isCreateOpen}
        mode="create"
        title="Tạo đơn vị mới"
        submitLabel="Tạo đơn vị"
        isSubmitting={isSubmitting}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateUnit}
      />

      <UnitFormModal
        isOpen={Boolean(editingUnit)}
        mode="edit"
        title="Cập nhật đơn vị"
        submitLabel="Lưu thay đổi"
        initialValues={editingUnit}
        isSubmitting={isSubmitting}
        onClose={() => setEditingUnit(null)}
        onSubmit={handleEditUnit}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingUnit)}
        title="Xóa đơn vị"
        message={`Bạn có chắc muốn xóa đơn vị "${deletingUnit?.name || ''}" không?`}
        confirmLabel="Xóa đơn vị"
        isSubmitting={isSubmitting}
        danger
        onClose={() => setDeletingUnit(null)}
        onConfirm={handleDeleteUnit}
      />

      {viewingUnit?.id && (
        <UnitDetailModal
          unitId={viewingUnit.id}
          accessToken={accessToken}
          role={role}
          roleLabel={roleLabel}
          user={user}
          onClose={() => setViewingUnit(null)}
          onSessionExpired={onSessionExpired}
          onUnitDeleted={() => loadUnits(query)}
        />
      )}

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>{pageTitle}</h1>
        </div>
        {isAdmin && (
          <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} weight="bold" /> Thêm đơn vị mới
          </button>
        )}
      </header>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSelect}>
            <MagnifyingGlass size={16} />
            <input 
              placeholder="Tìm theo tên..." 
              value={filters.name}
              onChange={e => setFilters(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className={styles.filterSelect}>
            <Funnel size={16} />
            <select 
              value={filters.type} 
              onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
            >
              <option value="">Tất cả loại hình</option>
              <option value={UNIT_TYPES.lck}>Liên chi khoa</option>
              <option value={UNIT_TYPES.clb}>Câu lạc bộ</option>
              <option value={UNIT_TYPES.system}>Hệ thống</option>
            </select>
          </div>
        </div>
        <span className={styles.filterSummary}>
          Hiển thị {result.items.length} đơn vị
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <span>LOGO</span>
          <span>Tên đơn vị</span>
          <span>Loại hình</span>
          <span>Thành viên</span>
          <span>Thao tác</span>
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : result.items.length > 0 ? (
          result.items.map((unit) => (
            <div key={unit.id} className={styles.unitRow}>
              <div className={styles.logoCell}>
                <UnitLogo logo={unit.logo} name={unit.name} size="small" />
              </div>
              <div className={styles.nameCell}>
                <strong>{unit.name}</strong>
              </div>
              <div className={styles.typeCell}>
                <UnitTypeBadge type={unit.type} />
              </div>
              <div className={styles.membersCell}>
                {memberTotals[unit.id] ?? '-'}
              </div>
              <div className={styles.actionsCell}>
                <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => setViewingUnit(unit)} title="Xem chi tiết">
                  <Eye size={18} />
                </button>
                {isAdmin && (
                  <>
                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => setEditingUnit(unit)} title="Chỉnh sửa">
                      <Pencil size={18} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeletingUnit(unit)} title="Xóa">
                      <Trash size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>Không tìm thấy đơn vị nào phù hợp.</div>
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

