import { useEffect, useState, useMemo } from 'react';
import { Calendar, MapPin, Clock, ListBullets, CheckCircle, Star, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { getValidPublicEvents, getMyRegistrations } from '../service/apiStudentEvent';
import { PATHS } from '../utils/routes';
import { message } from 'antd';
import '../style/EventsPage.css';

const FILTER_TYPES = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  REGISTERED: 'registered'
}

const TIME_FILTERS = {
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  UPCOMING: 'upcoming'
}

export default function EventsPage({ navigate }) {
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ALL)
  const [timeFilter, setTimeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [errorStatus, setErrorStatus] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setErrorStatus(null)
    try {
      const [eventsData, regsData] = await Promise.all([
        getValidPublicEvents(),
        getMyRegistrations()
      ])
      setEvents(eventsData)
      setRegistrations(regsData)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      setErrorStatus(error.status || 500)
    } finally {
      setIsLoading(false)
    }
  }


  const filteredEvents = useMemo(() => {
    let result = [...events]

    // 1. Status Filter
    if (activeFilter === FILTER_TYPES.UPCOMING) {
      const now = new Date()
      result = result.filter(e => new Date(e.event_start) > now)
    } else if (activeFilter === FILTER_TYPES.REGISTERED) {
      const registeredIds = new Set(registrations.map(r => r.event_id))
      result = result.filter(e => registeredIds.has(e.id))
    }

    // 2. Time Filter
    if (timeFilter) {
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

      result = result.filter(e => {
        const start = new Date(e.event_start)
        if (timeFilter === TIME_FILTERS.THIS_WEEK) return start <= nextWeek && start >= now
        if (timeFilter === TIME_FILTERS.THIS_MONTH) return start <= nextMonth && start >= now
        if (timeFilter === TIME_FILTERS.UPCOMING) return start > now
        return true
      })
    }

    // 3. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q)
      )
    }

    return result
  }, [events, registrations, activeFilter, timeFilter, searchQuery])

  function getStatusLabel(event) {
    const now = new Date()
    const regStart = new Date(event.registration_start)
    const regEnd = new Date(event.registration_end)

    if (now < regStart) return { label: 'Sắp mở đơn', class: 'upcoming' }
    if (now > regEnd) return { label: 'Đã đóng đơn', class: 'closed' }
    return { label: 'Đang mở đơn', class: 'open' }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="events-page">
      <aside className="events-sidebar">
        <div className="filter-group">
          <h3>Bộ lọc</h3>
          <div className="filter-list">
            <button 
              className={`filter-item ${activeFilter === FILTER_TYPES.ALL ? 'active' : ''}`}
              onClick={() => setActiveFilter(FILTER_TYPES.ALL)}
            >
              <ListBullets weight="bold" />
              Tất cả sự kiện
            </button>
            <button 
              className={`filter-item ${activeFilter === FILTER_TYPES.UPCOMING ? 'active' : ''}`}
              onClick={() => setActiveFilter(FILTER_TYPES.UPCOMING)}
            >
              <Calendar weight="bold" />
              Sắp diễn ra
            </button>
            <button 
              className={`filter-item ${activeFilter === FILTER_TYPES.REGISTERED ? 'active' : ''}`}
              onClick={() => setActiveFilter(FILTER_TYPES.REGISTERED)}
            >
              <CheckCircle weight="bold" />
              Đã đăng ký
            </button>
          </div>
        </div>

        <div className="filter-group">
          <h3>Thời gian diễn ra</h3>
          <div className="category-list">
            <label className="checkbox-label">
              <input 
                type="radio" 
                name="time" 
                checked={timeFilter === TIME_FILTERS.THIS_WEEK}
                onChange={() => setTimeFilter(TIME_FILTERS.THIS_WEEK)}
              />
              Tuần này
            </label>
            <label className="checkbox-label">
              <input 
                type="radio" 
                name="time"
                checked={timeFilter === TIME_FILTERS.THIS_MONTH}
                onChange={() => setTimeFilter(TIME_FILTERS.THIS_MONTH)}
              />
              Tháng này
            </label>
            <label className="checkbox-label">
              <input 
                type="radio" 
                name="time"
                checked={timeFilter === TIME_FILTERS.UPCOMING}
                onChange={() => setTimeFilter(TIME_FILTERS.UPCOMING)}
              />
              Sắp tới
            </label>
            <label className="checkbox-label" style={{ opacity: 0.6 }}>
              <input 
                type="radio" 
                name="time"
                checked={timeFilter === ''}
                onChange={() => setTimeFilter('')}
              />
              Bỏ lọc
            </label>
          </div>
        </div>
      </aside>

      <main className="events-content">
        <header className="events-header">
          <div className="events-header-copy">
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f4d93', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Portal › Sự kiện</p>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Danh sách sự kiện</h1>
          </div>
          <div className="search-bar" style={{ position: 'relative' }}>
            <MagnifyingGlass 
              size={18} 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
            />
            <input 
              type="text" 
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.6rem 1rem 0.6rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                width: '240px',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </header>


        {isLoading ? (
          <div className="events-empty">Đang tải danh sách sự kiện...</div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map(event => {
              const status = getStatusLabel(event)
              return (
                <article 
                  key={event.id} 
                  className="event-card"
                  onClick={() => navigate(`${PATHS.event}/${event.id}`)}
                >
                  <div className="event-card-image">
                    <span className={`status-badge ${status.class}`}>
                      {status.label}
                    </span>
                    <img src={event.image_url || 'https://via.placeholder.com/400x250?text=Event+Image'} alt={event.title} />
                  </div>
                  <div className="event-card-body">
                    <h2 className="event-card-title">{event.title}</h2>
                    <div className="event-card-info">
                      <div className="info-item">
                        <Calendar weight="fill" />
                        <span>{formatDate(event.event_start)}</span>
                      </div>
                      <div className="info-item">
                        <Clock weight="fill" />
                        <span>{formatTime(event.event_start)} - {formatTime(event.event_end)}</span>
                      </div>
                      <div className="info-item">
                        <MapPin weight="fill" />
                        <span>Xem chi tiết để biết địa điểm</span>
                      </div>
                    </div>
                    <div className="event-card-footer">
                      <div className="point-badge">
                        <Star weight="fill" />
                        <span>{event.point} điểm RL</span>
                      </div>
                      <span className="learn-more">
                        Chi tiết →
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}


          </div>
        ) : (
          <div className="events-empty">
            <Calendar size={48} weight="thin" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>{errorStatus ? 'Đã có lỗi xảy ra' : 'Không tìm thấy sự kiện nào'}</h3>
            <p>{errorStatus ? 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'}</p>
          </div>
        )}
      </main>
    </div>
  )
}
