import { useEffect, useMemo, useState } from 'react'
import NotificationPopup from '../components/NotificationPopup'
import UnitTypeBadge from '../components/units/UnitTypeBadge'
import { getUnits } from '../service/unitService'
import { buildClubDetailPath, PATHS, UNIT_TYPES } from '../utils/routes'
import { isPublicVisibleUnit } from '../utils/unitUtils'

const DEFAULT_LIMIT = 12

function parsePositiveNumber(value, fallbackValue) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallbackValue
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildSummaryText(unit) {
  const rawIntroduction = stripHtml(unit?.introduction || '')
  if (!rawIntroduction) {
    return 'Khám phá hoạt động, đội ngũ và định hướng nổi bật của đơn vị này trong hệ thống Đoàn Thanh Niên.'
  }

  if (rawIntroduction.length <= 120) {
    return rawIntroduction
  }

  return `${rawIntroduction.slice(0, 117).trimEnd()}...`
}

function ClubPreviewMedia({ unit }) {
  if (unit?.logo) {
    return (
      <div className="club-card-media">
        <img src={unit.logo} alt={unit.name || 'Đơn vị'} className="club-card-media-image" />
      </div>
    )
  }

  return (
    <div className="club-card-media club-card-media-fallback">
      <span>{String(unit?.name || 'DV').trim().slice(0, 2).toUpperCase()}</span>
    </div>
  )
}

function ClubPage({ navigate, search = '' }) {
  const query = useMemo(() => new URLSearchParams(search), [search])
  const [units, setUnits] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    skip: parsePositiveNumber(query.get('skip'), 0),
    limit: parsePositiveNumber(query.get('limit'), DEFAULT_LIMIT) || DEFAULT_LIMIT,
  })
  const [filters, setFilters] = useState({
    name: query.get('name') || '',
    type: query.get('type') || '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const nextSkip = parsePositiveNumber(query.get('skip'), 0)
    const nextLimit = parsePositiveNumber(query.get('limit'), DEFAULT_LIMIT) || DEFAULT_LIMIT

    setFilters({
      name: query.get('name') || '',
      type: query.get('type') || '',
    })
    setPagination((currentState) => ({
      ...currentState,
      skip: nextSkip,
      limit: nextLimit,
    }))
  }, [query])

  useEffect(() => {
    loadUnits()
  }, [search])

  async function loadUnits() {
    setIsLoading(true)
    const name = query.get('name') || ''
    const type = query.get('type') || ''
    const skip = parsePositiveNumber(query.get('skip'), 0)
    const limit = parsePositiveNumber(query.get('limit'), DEFAULT_LIMIT) || DEFAULT_LIMIT

    try {
      const response = await getUnits({
        skip,
        limit,
        name: name || undefined,
        type: type || undefined,
      })

      const rawItems = Array.isArray(response?.items) ? response.items : []
      const visibleUnits = rawItems.filter(isPublicVisibleUnit)
      const hiddenCount = rawItems.length - visibleUnits.length

      setUnits(visibleUnits)
      setPagination({
        total: Math.max(Number(response.total || 0) - hiddenCount, visibleUnits.length),
        skip: response.skip,
        limit: response.limit || DEFAULT_LIMIT,
      })
    } catch (error) {
      setNotice({
        title: 'Không thể tải danh sách đơn vị',
        message: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  function updateUrl(nextValues) {
    const searchParams = new URLSearchParams()
    const nextSkip = nextValues.skip ?? 0
    const nextLimit = nextValues.limit ?? pagination.limit
    const name = nextValues.name !== undefined ? nextValues.name : filters.name
    const type = nextValues.type !== undefined ? nextValues.type : filters.type

    if (nextSkip > 0) {
      searchParams.set('skip', String(nextSkip))
    }

    if (nextLimit !== DEFAULT_LIMIT) {
      searchParams.set('limit', String(nextLimit))
    }

    if (name) {
      searchParams.set('name', name.trim())
    }

    if (type) {
      searchParams.set('type', type)
    }

    const nextQuery = searchParams.toString()
    navigate(nextQuery ? `${PATHS.club}?${nextQuery}` : PATHS.club)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    updateUrl({
      skip: 0,
      name: filters.name,
      type: filters.type,
    })
  }

  function handleTypeChange(value) {
    setFilters((currentFilters) => ({ ...currentFilters, type: value }))
    updateUrl({
      skip: 0,
      name: filters.name,
      type: value,
    })
  }

  function handlePageChange(direction) {
    const nextSkip =
      direction === 'next'
        ? pagination.skip + pagination.limit
        : Math.max(pagination.skip - pagination.limit, 0)

    updateUrl({ skip: nextSkip })
  }

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1
  const totalPages = Math.max(Math.ceil(pagination.total / pagination.limit), 1)
  const canGoPrevious = pagination.skip > 0
  const canGoNext = pagination.skip + pagination.limit < pagination.total
  return (
    <section className="club-page club-catalog-page">
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />

      <section className="club-page-hero club-catalog-hero">
        <div className="club-page-copy">
          <h1 className="premium-title">Khám phá Câu lạc bộ & Liên chi đoàn</h1>
        </div>
      </section>

      <div className="club-layout">
        <aside className="club-sidebar">
          <div className="club-sidebar-card">
            <span className="club-sidebar-label">Tìm kiếm đơn vị</span>
            <form className="club-sidebar-search" onSubmit={handleSearchSubmit}>
              <label className="field club-sidebar-field">
                <span>Tìm kiếm đơn vị</span>
                <input
                  type="search"
                  value={filters.name}
                  onChange={(event) =>
                    setFilters((currentState) => ({
                      ...currentState,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Tìm theo tên đơn vị..."
                />
              </label>

              <label className="field club-sidebar-field">
                <span>Loại hình</span>
                <select value={filters.type} onChange={(event) => handleTypeChange(event.target.value)}>
                  <option value="">Tất cả</option>
                  <option value={UNIT_TYPES.clb}>Câu lạc bộ</option>
                  <option value={UNIT_TYPES.lck}>Liên chi đoàn</option>
                </select>
              </label>

              <button type="submit" className="primary-button club-sidebar-submit">
                Tìm kiếm
              </button>
            </form>
          </div>
        </aside>

        <div className="club-main">
          {isLoading ? (
            <section className="club-empty-state">
              <h2>Đang tải danh sách đơn vị...</h2>
            </section>
          ) : units.length ? (
            <>
              <section className="club-grid club-grid-catalog">
                {units.map((unit) => (
                  <article 
                    key={unit.id} 
                    className="club-card club-card-catalog"
                    onClick={() => navigate(buildClubDetailPath(unit.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    <ClubPreviewMedia unit={unit} />

                    <div className="club-card-body">
                      <div className="club-card-badges">
                        <UnitTypeBadge type={unit.type} />
                      </div>
                      <h2>{unit.name || 'Chưa cập nhật'}</h2>
                      <p>{buildSummaryText(unit)}</p>
                    </div>
                  </article>
                ))}
              </section>

              <div className="club-pagination club-pagination-catalog">
                <button
                  type="button"
                  className="secondary-button club-page-button"
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
                  className="secondary-button club-page-button"
                  onClick={() => handlePageChange('next')}
                  disabled={!canGoNext}
                >
                  Sau
                </button>
              </div>
            </>
          ) : (
            <section className="club-empty-state">
              <h2>Không có đơn vị phù hợp</h2>
              <p>
                {filters.name || filters.type
                  ? 'Không tìm thấy đơn vị nào khớp với điều kiện tìm kiếm hiện tại.'
                  : 'Hiện chưa có đơn vị nào để hiển thị.'}
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}

export default ClubPage
