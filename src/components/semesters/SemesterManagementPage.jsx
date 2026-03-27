import { useEffect, useState } from 'react'
import NotificationPopup from '../NotificationPopup'
import { createSemester, getSemesters, updateSemester } from '../../service/semesterService'
import { USER_ROLES } from '../../utils/routes'
import { getValidationMessage } from '../../utils/userUtils'
import { formatSemesterDate } from '../../utils/semesterUtils'
import SemesterFormModal from './SemesterFormModal'
import SemesterStatusBadge from './SemesterStatusBadge'

const DEFAULT_LIMIT = 10

function SemesterManagementPage({ accessToken, roleLabel, role, onSessionExpired }) {
  const [result, setResult] = useState({
    items: [],
    total: 0,
    skip: 0,
    limit: DEFAULT_LIMIT,
  })
  const [query, setQuery] = useState({
    skip: 0,
    limit: DEFAULT_LIMIT,
  })
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
  const showingFrom = result.total ? result.skip + 1 : 0
  const showingTo = result.total ? Math.min(result.skip + result.items.length, result.total) : 0

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
      const nextQuery = { ...query, skip: 0 }
      setQuery(nextQuery)
      await loadSemesters(nextQuery)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Tạo học kỳ thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditSemester(payload) {
    if (!editingSemester?.id) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateSemester(editingSemester.id, payload, accessToken)
      setEditingSemester(null)
      await loadSemesters(query)
    } catch (error) {
      handleApiError(error, getValidationMessage(error, 'Cập nhật học kỳ thất bại.'))
    } finally {
      setIsSubmitting(false)
    }
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
        title: 'Không tìm thấy học kỳ',
        message: 'Học kỳ bạn cần thao tác không tồn tại.',
      })
      return
    }

    if (error?.status === 400) {
      setNotice({
        title: 'Thời gian học kỳ không hợp lệ',
        message: fallbackMessage || 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.',
      })
      return
    }

    if (error?.status === 422) {
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

  function handlePageChange(direction) {
    const nextSkip =
      direction === 'next'
        ? query.skip + query.limit
        : Math.max(query.skip - query.limit, 0)

    setQuery((currentQuery) => ({
      ...currentQuery,
      skip: nextSkip,
    }))
  }

  return (
    <section className="semester-page">
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

      <div className="page-card semester-page-header">
        <div>
          <span className="dashboard-badge">{roleLabel}</span>
          <h1>Quản lý học kỳ</h1>
          <p>Theo dõi và cấu hình học kỳ trong hệ thống.</p>
        </div>

        {isGlobalAdmin && (
          <button type="button" className="primary-button" onClick={() => setIsCreateOpen(true)}>
            Tạo học kỳ
          </button>
        )}
      </div>

      <div className="semester-summary">
        <span>
          Hiển thị {showingFrom} - {showingTo} trên tổng số {result.total} học kỳ
        </span>
      </div>

      {isLoadingList ? (
        <section className="page-card">
          <p>Đang tải danh sách học kỳ...</p>
        </section>
      ) : result.items.length ? (
        <section className="page-card semester-table-shell">
          <table className="semester-table">
            <thead>
              <tr>
                <th>Tên học kỳ</th>
                <th>Năm học</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                {isGlobalAdmin && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {result.items.map((semester) => (
                <tr key={semester.id} className={semester.is_active ? 'semester-row-active' : ''}>
                  <td>
                    <div className="semester-name-cell">
                      <strong>{semester.name || 'Chưa cập nhật'}</strong>
                    </div>
                  </td>
                  <td>{semester.academic_year || 'Chưa cập nhật'}</td>
                  <td>{formatSemesterDate(semester.start_date)}</td>
                  <td>{formatSemesterDate(semester.end_date)}</td>
                  <td>
                    <SemesterStatusBadge isActive={semester.is_active} />
                  </td>
                  <td>{formatSemesterDate(semester.created_at)}</td>
                  {isGlobalAdmin && (
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingSemester(semester)}
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  )}
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
        <section className="page-card semester-empty-state">
          <h3>Chưa có học kỳ</h3>
          <p>Danh sách học kỳ hiện đang trống.</p>
        </section>
      )}
    </section>
  )
}

export default SemesterManagementPage
