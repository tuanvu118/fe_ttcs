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

const DEFAULT_LIMIT = 10
const STAFF_FETCH_LIMIT = 100

function IconButton({ title, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      className={danger ? `${styles.iconButton} danger` : styles.iconButton}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 16 9.8-9.8a2.2 2.2 0 1 1 3.1 3.1L7.1 19H4v-3Zm0 0 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V5h6v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UnitsManagementPage({
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
  const [filters, setFilters] = useState({
    name: '',
    type: '',
  })
  const [query, setQuery] = useState({
    skip: 0,
    limit: DEFAULT_LIMIT,
    name: '',
    type: '',
  })
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
    if (!isStaff) {
      return []
    }

    return [
      ...new Set(
        (user?.roles || [])
          .filter(
            (roleItem) =>
              roleItem?.unit_id &&
              Array.isArray(roleItem?.roles) &&
              roleItem.roles.some(
                (roleName) => String(roleName).trim().toUpperCase() === 'STAFF',
              ),
          )
          .map((roleItem) => roleItem.unit_id),
      ),
    ]
  }, [isStaff, user?.roles])

  const currentPage = Math.floor(result.skip / Math.max(result.limit, 1)) + 1
  const totalPages = Math.max(Math.ceil(result.total / Math.max(result.limit, 1)), 1)
  const canGoPrevious = result.skip > 0
  const canGoNext = result.skip + result.limit < result.total
  const showingFrom = result.total ? result.skip + 1 : 0
  const showingTo = result.total
    ? Math.min(result.skip + result.items.length, result.total)
    : 0

  const pageTitle = 'Quản lý đơn vị / CLB'
  const pageDescription = 'Quản lý cơ cấu tổ chức, đơn vị và các câu lạc bộ trong hệ thống.'

  const activeTypeLabel = useMemo(() => {
    if (!query.type) {
      return 'Tất cả loại hình'
    }

    return query.type
  }, [query.type])

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
        const filteredItems = items.filter((unit) => staffManagedUnitIds.includes(unit.id))
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
    const baseQuery = {
      skip: 0,
      limit: STAFF_FETCH_LIMIT,
      name: nextQuery.name,
      type: nextQuery.type,
    }

    const firstPage = await getManagedUnits(baseQuery, accessToken)
    const allItems = [...firstPage.items]
    let loaded = firstPage.items.length
    const total = firstPage.total

    while (loaded < total) {
      const nextPage = await getManagedUnits(
        { ...baseQuery, skip: loaded },
        accessToken,
      )

      if (!nextPage.items.length) {
        break
      }

      allItems.push(...nextPage.items)
      loaded += nextPage.items.length
    }

    return allItems
  }

  async function loadMemberTotals(units) {
    if (!units.length) {
      setMemberTotals({})
      return
    }

    const pairs = await Promise.all(
      units.map(async (unit) => {
        try {
          const response = await getUnitMembers(unit.id, { skip: 0, limit: 1 }, accessToken)
          return [unit.id, response.total]
        } catch {
          return [unit.id, null]
        }
      }),
    )

    setMemberTotals(Object.fromEntries(pairs))
  }

  async function handleCreateUnit(form) {
    setIsSubmitting(true)

    try {
      await createUnit(form, accessToken)
      setIsCreateOpen(false)
      const nextQuery = { ...query, skip: 0 }
      setQuery(nextQuery)
      await loadUnits(nextQuery)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Tạo đơn vị thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditUnit(form) {
    if (!editingUnit?.id) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateUnit(editingUnit.id, form, accessToken)
      setEditingUnit(null)
      await loadUnits(query)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật đơn vị thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUnit() {
    if (!deletingUnit?.id) {
      return
    }

    setIsSubmitting(true)

    try {
      await deleteUnit(deletingUnit.id, accessToken)
      setDeletingUnit(null)

      const fallbackSkip =
        result.items.length <= 1 && query.skip > 0
          ? Math.max(query.skip - query.limit, 0)
          : query.skip

      const nextQuery = { ...query, skip: fallbackSkip }
      setQuery(nextQuery)
      await loadUnits(nextQuery)
    } catch (error) {
      handleApiError(error, 'Xóa đơn vị thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUnitDeleted(deletedUnitId) {
    setViewingUnit(null)
    setEditingUnit(null)
    setDeletingUnit(null)
    setMemberTotals((current) => {
      const nextTotals = { ...current }
      delete nextTotals[deletedUnitId]
      return nextTotals
    })

    const fallbackSkip =
      result.items.length <= 1 && query.skip > 0
        ? Math.max(query.skip - query.limit, 0)
        : query.skip

    const nextQuery = { ...query, skip: fallbackSkip }
    setQuery(nextQuery)
    await loadUnits(nextQuery)
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

    if (error?.status === 403) {
      setNotice({
        title: 'Không có quyền',
        message: 'Bạn không có quyền thực hiện thao tác này.',
      })
      return
    }

    if (error?.status === 404) {
      setNotice({
        title: 'Không tìm thấy đơn vị',
        message: 'Đơn vị bạn cần thao tác không còn tồn tại.',
      })
      return
    }

    if (error?.status === 400 || error?.status === 422) {
      setNotice({
        title: 'Dữ liệu chưa hợp lệ',
        message: getValidationMessage(error, fallbackMessage),
      })
      return
    }

    setNotice({
      title: 'Có lỗi xảy ra',
      message: fallbackMessage || error?.message || 'Yêu cầu thất bại.',
    })
  }

  function handleSearchSubmit(event) {
    event.preventDefault()

    setQuery((currentQuery) => ({
      ...currentQuery,
      skip: 0,
      name: filters.name.trim(),
      type: filters.type,
    }))
  }

  function handleResetFilters() {
    setFilters({
      name: '',
      type: '',
    })

    setQuery({
      skip: 0,
      limit: DEFAULT_LIMIT,
      name: '',
      type: '',
    })
  }

  function handlePageChange(direction) {
    const nextSkip =
      direction === 'next'
        ? query.skip + query.limit
        : Math.max(query.skip - query.limit, 0)

    setQuery((currentQuery) => ({ ...currentQuery, skip: nextSkip }))
  }

  return (
    <section className={styles.unitsPage}>
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
          onUnitDeleted={handleUnitDeleted}
        />
      )}

      <div className={`page-card ${styles.consoleHeader}`}>
        <div>
          <span className="dashboard-badge">{roleLabel}</span>
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className={`primary-button ${styles.consoleCreateButton}`}
            onClick={() => setIsCreateOpen(true)}
          >
            + Thêm đơn vị
          </button>
        )}
      </div>

      <form
        className={`page-card ${styles.consoleToolbar} ${styles.consoleToolbarCompact}`}
        onSubmit={handleSearchSubmit}
      >
        <label className={`field ${styles.consoleSearch}`}>
          <span>Tìm kiếm theo tên</span>
          <input
            type="search"
            value={filters.name}
            onChange={(event) =>
              setFilters((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Tìm kiếm tên đơn vị"
          />
        </label>

        <label className="field">
          <span>Loại hình</span>
          <select
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({ ...current, type: event.target.value }))
            }
          >
            <option value="">Tất cả loại hình</option>
            <option value={UNIT_TYPES.lck}>LCK</option>
            <option value={UNIT_TYPES.clb}>CLB</option>
            <option value={UNIT_TYPES.system}>SYSTEM</option>
          </select>
        </label>

        <div className={styles.consoleToolbarActions}>
          <button type="submit" className="secondary-button">
            Áp dụng
          </button>
          <button type="button" className="secondary-button" onClick={handleResetFilters}>
            Xóa lọc
          </button>
        </div>
      </form>

      <div className={styles.consoleSummary}>
        <span>Loại hình: {activeTypeLabel}</span>
        <span>
          Hiển thị {showingFrom} - {showingTo} trên tổng số {result.total} đơn vị
        </span>
      </div>

      {isLoading ? (
        <section className="page-card">
          <p>Đang tải danh sách đơn vị...</p>
        </section>
      ) : result.items.length ? (
        <section className={`page-card ${styles.managementTableShell}`}>
          <table className={styles.managementTable}>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Tên đơn vị</th>
                <th>Loại hình</th>
                <th>Tổng TV</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <UnitLogo logo={unit.logo} name={unit.name} size="small" />
                  </td>
                  <td>
                    <div className={styles.tableName}>
                      <button
                        type="button"
                        className={styles.nameLink}
                        onClick={() => setViewingUnit(unit)}
                      >
                        {unit.name || 'Chưa cập nhật'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <UnitTypeBadge type={unit.type} />
                  </td>
                  <td className={styles.totalCell}>
                    {memberTotals[unit.id] === null || memberTotals[unit.id] === undefined
                      ? '-'
                      : memberTotals[unit.id]}
                  </td>
                  <td>
                    <div className={`${styles.tableActions} ${styles.tableActionsIcon}`}>
                      {isAdmin ? (
                        <>
                          <button
                            type="button"
                            className="secondary-button unit-action-button"
                            onClick={() => setViewingUnit(unit)}
                          >
                            Mở
                          </button>
                          <IconButton
                            title="Sửa đơn vị"
                            onClick={() => setEditingUnit(unit)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            title="Xóa đơn vị"
                            danger
                            onClick={() => setDeletingUnit(unit)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button unit-action-button"
                          onClick={() => setViewingUnit(unit)}
                        >
                          Mở
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="unit-table-footer">
            <button
              type="button"
              className="secondary-button unit-page-button"
              onClick={() => handlePageChange('previous')}
              disabled={!canGoPrevious}
            >
              Trước
            </button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button unit-page-button"
              onClick={() => handlePageChange('next')}
              disabled={!canGoNext}
            >
              Sau
            </button>
          </div>
        </section>
      ) : (
        <section className="page-card">
          <h2>Không có đơn vị phù hợp</h2>
          <p>
            {query.name || query.type
              ? 'Không tìm thấy đơn vị nào khớp với bộ lọc hiện tại.'
              : 'Hiện chưa có đơn vị nào trong hệ thống.'}
          </p>
        </section>
      )}
    </section>
  )
}

export default UnitsManagementPage
