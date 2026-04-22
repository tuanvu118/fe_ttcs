import { useEffect, useState } from 'react'
import NotificationPopup from '../../components/NotificationPopup'
import UserAvatar from '../../components/users/UserAvatar'
import UserFormModal from '../../components/users/UserFormModal'
import { createUser, getUserDetail, getUsers, updateUser } from '../../service/userService'
import { USER_ROLES } from '../../utils/routes'
import { getValidationMessage } from '../../utils/userUtils'
import UserDetailDrawer from './UserDetailDrawer'
import styles from './adminUsers.module.css'
import { MagnifyingGlass, Funnel, Plus, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Select, Popconfirm, Pagination } from 'antd'

const DEFAULT_LIMIT = 10

function UserManagementPage({
  accessToken,
  role,
  roleLabel,
  pageTitle,
  pageDescription,
  initialCreateOpen = false,
  onSessionExpired,
}) {
  const [result, setResult] = useState({
    items: [],
    total: 0,
    skip: 0,
    limit: DEFAULT_LIMIT,
  })
  const [filters, setFilters] = useState({
    full_name: '',
    email: '',
    student_id: '',
    class_name: '',
  })
  const [query, setQuery] = useState({
    skip: 0,
    limit: DEFAULT_LIMIT,
    full_name: '',
    email: '',
    student_id: '',
    class_name: '',
  })
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [notice, setNotice] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(initialCreateOpen)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  const canCreateUser = role === USER_ROLES.admin || role === USER_ROLES.manager
  const canEditOtherUsers = canCreateUser

  const currentPage = Math.floor(result.skip / Math.max(result.limit, 1)) + 1
  const totalPages = Math.max(Math.ceil(result.total / Math.max(result.limit, 1)), 1)
  const canGoPrevious = result.skip > 0
  const canGoNext = result.skip + result.limit < result.total
  const showingFrom = result.total ? result.skip + 1 : 0
  const showingTo = result.total ? Math.min(result.skip + result.items.length, result.total) : 0

  useEffect(() => {
    loadUsers(query)
  }, [accessToken, query])

  useEffect(() => {
    if (initialCreateOpen) {
      setIsCreateOpen(true)
    }
  }, [initialCreateOpen])

  async function loadUsers(nextQuery) {
    setIsLoadingUsers(true)

    try {
      const response = await getUsers(nextQuery, accessToken)
      setResult({
        items: response.items,
        total: response.total,
        skip: response.skip,
        limit: response.limit || DEFAULT_LIMIT,
      })
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách người dùng.')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  async function reloadSelectedUserDetail() {
    if (!selectedUser?.id) {
      return
    }

    const refreshedDetail = await getUserDetail(selectedUser.id, accessToken)
    setSelectedUser(refreshedDetail)
  }

  async function handleViewDetail(userId) {
    setIsDrawerOpen(true)
    setIsDetailLoading(true)

    try {
      const userDetail = await getUserDetail(userId, accessToken)
      setSelectedUser(userDetail)
    } catch (error) {
      setSelectedUser(null)
      handleApiError(error, 'Không thể tải chi tiết người dùng.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function handleOpenEdit(userId) {
    setIsSubmittingForm(false)

    try {
      const userDetail = await getUserDetail(userId, accessToken)
      setEditingUser(userDetail)
      setIsEditOpen(true)
    } catch (error) {
      handleApiError(error, 'Không thể tải thông tin người dùng để chỉnh sửa.')
    }
  }

  async function handleCreateSubmit(form) {
    setIsSubmittingForm(true)

    try {
      await createUser(form, accessToken)
      setIsCreateOpen(false)

      const nextQuery = { ...query, skip: 0 }
      setQuery(nextQuery)
      await loadUsers(nextQuery)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Tạo người dùng thất bại.'))
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleEditSubmit(form) {
    if (!editingUser?.id) {
      return
    }

    setIsSubmittingForm(true)

    try {
      await updateUser(editingUser.id, form, accessToken)
      setIsEditOpen(false)
      setEditingUser(null)
      await reloadSelectedUserDetail()
      await loadUsers(query)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật người dùng thất bại.'))
    } finally {
      setIsSubmittingForm(false)
    }
  }

  async function handleRoleChanged() {
    try {
      await reloadSelectedUserDetail()
      await loadUsers(query)
    } catch (error) {
      handleApiError(error, 'Không thể đồng bộ dữ liệu người dùng sau khi cập nhật quyền.')
    }
  }

  function handleApiError(error, fallbackMessage) {
    if (error?.status === 401) {
      setNotice({
        title: 'Phiên đăng nhập hết hạn',
        message: 'Vui lòng đăng nhập lại để tiếp tục.',
        onClose: () => {
          setNotice(null)
          onSessionExpired()
        },
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
        title: 'Không tìm thấy người dùng',
        message: 'Người dùng bạn cần thao tác không còn tồn tại.',
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

  function handleFilterSubmit(event) {
    event.preventDefault()

    setQuery((currentQuery) => ({
      ...currentQuery,
      skip: 0,
      full_name: filters.full_name.trim(),
      email: filters.email.trim(),
      student_id: filters.student_id.trim(),
      class_name: filters.class_name.trim(),
    }))
  }

  function handleResetFilters() {
    const nextFilters = {
      full_name: '',
      email: '',
      student_id: '',
      class_name: '',
    }

    setFilters(nextFilters)
    setQuery({
      skip: 0,
      limit: DEFAULT_LIMIT,
      full_name: '',
      email: '',
      student_id: '',
      class_name: '',
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
    <section className={styles.managementPage}>
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

      <UserFormModal
        isOpen={isCreateOpen}
        mode="create"
        title="Tạo người dùng mới"
        submitLabel="Tạo người dùng"
        isSubmitting={isSubmittingForm}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <UserFormModal
        isOpen={isEditOpen}
        mode="edit"
        title="Chỉnh sửa người dùng"
        submitLabel="Lưu thay đổi"
        initialValues={editingUser}
        isSubmitting={isSubmittingForm}
        onClose={() => {
          setIsEditOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleEditSubmit}
      />

      <UserDetailDrawer
        isOpen={isDrawerOpen}
        isLoading={isDetailLoading}
        user={selectedUser}
        role={role}
        accessToken={accessToken}
        canEdit={canEditOtherUsers && Boolean(selectedUser?.id)}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={() => {
          setIsDrawerOpen(false)
          handleOpenEdit(selectedUser.id)
        }}
        onApiError={handleApiError}
        onRoleChanged={handleRoleChanged}
      />

      <section className={styles.consoleHeader}>
        <div>
          <h1>{pageTitle}</h1>
        </div>
        {canCreateUser && (
          <button
            type="button"
            className={styles.consoleCreateButton}
            onClick={() => setIsCreateOpen(true)}
          >
            + Thêm người dùng
          </button>
        )}
      </section>

      <form className={styles.consoleToolbar} onSubmit={handleFilterSubmit}>
        <div className={styles.consoleFilterGrid}>
          <label className="field">
            <span>Họ và tên</span>
            <input
              type="search"
              value={filters.full_name}
              onChange={(event) =>
                setFilters((current) => ({ ...current, full_name: event.target.value }))
              }
              placeholder="Lọc theo họ tên"
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="search"
              value={filters.email}
              onChange={(event) =>
                setFilters((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="Lọc theo email"
            />
          </label>

          <label className="field">
            <span>Mã sinh viên</span>
            <input
              type="search"
              value={filters.student_id}
              onChange={(event) =>
                setFilters((current) => ({ ...current, student_id: event.target.value }))
              }
              placeholder="Lọc theo mã sinh viên"
            />
          </label>

          <label className="field">
            <span>Lớp</span>
            <input
              type="search"
              value={filters.class_name}
              onChange={(event) =>
                setFilters((current) => ({ ...current, class_name: event.target.value }))
              }
              placeholder="Lọc theo lớp"
            />
          </label>
        </div>

        <div className={styles.consoleToolbarActions}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Hiển thị {showingFrom}-{showingTo} của {result.total} người dùng
          </span>
          <button type="submit" className={styles.applyBtn}>
            Áp dụng
          </button>
          <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
            Xóa lọc
          </button>
        </div>
      </form>

      {isLoadingUsers ? (
        <section className={styles.tableShell}>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách người dùng...</div>
        </section>
      ) : result.items.length ? (
        <section className={styles.tableShell}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Mã sinh viên</th>
                <th>Lớp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((userItem) => (
                <tr key={userItem.id}>
                  <td>
                    <UserAvatar avatarUrl={userItem.avatar_url} fullName={userItem.full_name} />
                  </td>
                  <td>{userItem.full_name || 'Chưa cập nhật'}</td>
                  <td>{userItem.email || 'Chưa cập nhật'}</td>
                  <td>{userItem.student_id || 'Chưa cập nhật'}</td>
                  <td>{userItem.class_name || 'Chưa cập nhật'}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.tableActionButton}
                      onClick={() => handleViewDetail(userItem.id)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </section>
      ) : (
        <section className={styles.tableShell}>
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Không có người dùng phù hợp</h2>
            <p>Không tìm thấy người dùng nào khớp với bộ lọc hiện tại.</p>
          </div>
        </section>
      )}
    </section>
  )
}

export default UserManagementPage
