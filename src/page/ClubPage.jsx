import { useEffect, useMemo, useState } from 'react'
import NotificationPopup from '../components/NotificationPopup'
import UnitLogo from '../components/units/UnitLogo'
import UnitTypeBadge from '../components/units/UnitTypeBadge'
import { getUnits } from '../service/unitService'
import { buildClubDetailPath, PATHS, UNIT_TYPES } from '../utils/routes'
import { getUnitIntroduction } from '../utils/unitUtils'

const DEFAULT_LIMIT = 12

function parsePositiveNumber(value, fallbackValue) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallbackValue
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

    console.log('Fetching units with params:', { name, type, skip, limit })

    try {
      const response = await getUnits({
        skip,
        limit,
        name: name || undefined,
        type: type || undefined,
      })

      setUnits(response.items)
      setPagination({
        total: response.total,
        skip: response.skip,
        limit: response.limit || DEFAULT_LIMIT,
      })
    } catch (error) {
      console.error('Failed to load units:', error)
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

  function handleTypeChange(event) {
    const newType = event.target.value
    setFilters(prev => ({ ...prev, type: newType }))
    updateUrl({
      skip: 0,
      name: filters.name,
      type: newType,
    })
  }

  function handlePageChange(direction) {
    const nextSkip =
      direction === 'next'
        ? pagination.skip + pagination.limit
        : Math.max(pagination.skip - pagination.limit, 0)

    updateUrl({
      skip: nextSkip
    })
  }

  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1
  const totalPages = Math.max(Math.ceil(pagination.total / pagination.limit), 1)
  const canGoPrevious = pagination.skip > 0
  const canGoNext = pagination.skip + pagination.limit < pagination.total

  return (
    <section className="club-page">
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />

      <header className="page-header-container">
        <h1 className="premium-title">Khám phá Câu lạc bộ & Liên chi đoàn</h1>
      </header>

      <div className="club-page-hero">
        <form className="club-toolbar" onSubmit={handleSearchSubmit}>
          <label className="field club-search-field">
            <span>Tìm kiếm câu lạc bộ</span>
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

          <label className="field club-filter-field">
            <span>Lọc theo loại</span>
            <select
              value={filters.type}
              onChange={handleTypeChange}
            >
              <option value="">Tất cả</option>
              <option value={UNIT_TYPES.clb}>CLB</option>
              <option value={UNIT_TYPES.lck}>LCK</option>
              <option value={UNIT_TYPES.system}>SYSTEM</option>
            </select>
          </label>

          <button type="submit" className="primary-button club-submit-button">
            Tìm kiếm
          </button>
        </form>
      </div>

      {isLoading ? (
        <section className="club-empty-state">
          <h2>Đang tải danh sách đơn vị...</h2>
        </section>
      ) : units.length ? (
        <>
          <section className="club-grid">
            {units.map((unit) => (
              <article key={unit.id} className="club-card">
                <div className="club-card-top">
                  <UnitLogo logo={unit.logo} name={unit.name} size="medium" />
                  <UnitTypeBadge type={unit.type} />
                </div>

                <div className="club-card-body">
                  <h2>{unit.name || 'Chưa cập nhật'}</h2>
                  <p>{getUnitIntroduction(unit)}</p>
                </div>

                <button
                  type="button"
                  className="club-link-button"
                  onClick={() => navigate(buildClubDetailPath(unit.id))}
                >
                  Xem giới thiệu
                </button>
              </article>
            ))}
          </section>

          <div className="club-pagination">
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
    </section>
  )
}

export default ClubPage
