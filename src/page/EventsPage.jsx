import { useEffect, useState, useMemo } from 'react';
import { Calendar, MapPin, Clock, ListBullets, CheckCircle, Star, MagnifyingGlass, Funnel, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { getValidPublicEvents, getMyRegistrations } from '../service/apiStudentEvent';
import { PATHS } from '../utils/routes';
import { message } from 'antd';
import { useAuth } from '../hooks/useAuth';
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
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ALL)
  const [timeFilter, setTimeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [errorStatus, setErrorStatus] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 8

  useEffect(() => {
    loadData(currentPage)
  }, [currentPage, activeFilter, timeFilter, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, timeFilter, searchQuery])

  async function loadData(page = 1) {
    setIsLoading(true)
    setErrorStatus(null)
    try {
      const skip = (page - 1) * pageSize
      // We pass filters to the backend, except for REGISTERED which we handle specially if needed
      // Actually, for simplicity, we pass search and timeFilter
      const params = {
        skip,
        limit: pageSize,
        search: searchQuery,
        timeFilter: timeFilter
      }
      
      const [eventsResponse, regsData] = await Promise.all([
        getValidPublicEvents(params),
        isAuthenticated ? getMyRegistrations() : Promise.resolve([])
      ])
      
      let finalItems = eventsResponse.items || []
      let finalTotal = eventsResponse.total || 0
      
      // Specical handling for Registered filter if backend doesn't support it directly
      if (activeFilter === FILTER_TYPES.REGISTERED) {
        const registeredIds = new Set((regsData || []).map(r => r.event_id))
        // If we want accurate server-side pagination for Registered, we'd need a backend update.
        // For now, we filter the current page's results
        finalItems = finalItems.filter(e => registeredIds.has(e.id))
      } else if (activeFilter === FILTER_TYPES.UPCOMING) {
        // Upcoming is handled by backend timeFilter if we passed it, 
        // but the current get_valid_events already filters event_end >= now.
      }
      
      setEvents(finalItems)
      setTotal(finalTotal)
      setRegistrations(regsData)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      setErrorStatus(error.status || 500)
    } finally {
      setIsLoading(false)
    }
  }


  const filteredEvents = events

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
            <label className={`checkbox-label ${timeFilter === TIME_FILTERS.THIS_WEEK ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="time" 
                checked={timeFilter === TIME_FILTERS.THIS_WEEK}
                onChange={() => setTimeFilter(TIME_FILTERS.THIS_WEEK)}
              />
              Tuần này
            </label>
            <label className={`checkbox-label ${timeFilter === TIME_FILTERS.THIS_MONTH ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="time"
                checked={timeFilter === TIME_FILTERS.THIS_MONTH}
                onChange={() => setTimeFilter(TIME_FILTERS.THIS_MONTH)}
              />
              Tháng này
            </label>
            <label className={`checkbox-label ${timeFilter === TIME_FILTERS.UPCOMING ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="time"
                checked={timeFilter === TIME_FILTERS.UPCOMING}
                onChange={() => setTimeFilter(TIME_FILTERS.UPCOMING)}
              />
              Sắp tới
            </label>
            <label className={`checkbox-label ${timeFilter === '' ? 'active' : ''}`} style={{ opacity: 0.8 }}>
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
            <h1 style={{
              margin: 0,
              fontSize: '2.15rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #0c1f45 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Danh sách sự kiện</h1>
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
                width: '100%',
                fontSize: '16px',
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

        <div className="pagination-footer" style={{ 
          marginTop: '2.5rem', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1.25rem',
          padding: '1.5rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: currentPage === 1 ? 0.4 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <CaretLeft size={18} weight="bold" /> Trước
          </button>
          
          <div style={{ 
            fontSize: '0.95rem', 
            color: '#64748b', 
            fontWeight: 500,
            background: '#f8fafc',
            padding: '0.5rem 1rem',
            borderRadius: '8px'
          }}>
            Trang <strong style={{ color: '#1e293b' }}>{currentPage}</strong> / <strong style={{ color: '#1e293b' }}>{Math.ceil(total / pageSize) || 1}</strong>
          </div>

          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(total / pageSize) || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: currentPage >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: currentPage >= Math.ceil(total / pageSize) ? 0.4 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            Sau <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </main>
    </div>
  )
}
