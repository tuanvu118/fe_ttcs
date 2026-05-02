import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getValidPublicEvents, getMyRegistrations } from '../service/apiStudentEvent'
import { getPublicPromotions } from '../service/eventPromotionService'
import { getUnits } from '../service/unitService'
import { PATHS } from '../utils/routes'
import '../style/HomePage.css'

const UNIT_ICON_MAP = {
  music_note: 'âm nhạc',
  code: 'lập trình',
  volunteer_activism: 'tình nguyện',
  translate: 'ngoại ngữ',
  sports_soccer: 'thể thao',
  palette: 'nghệ thuật',
}

const UNIT_ICONS = [
  'music_note', 'code', 'volunteer_activism', 'translate',
  'sports_martial_arts', 'palette', 'camera', 'science',
]

function getRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getMonthAbbr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `TH${d.getMonth() + 1}`
}

function getDay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).getDate()
}

function getTimeRange(startStr, endStr) {
  const fmt = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const s = fmt(new Date(startStr))
  const e = endStr ? fmt(new Date(endStr)) : ''
  return e ? `${s} - ${e}` : s
}

function stripHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let text = doc.body.textContent || ''
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
  return text.trim()
}

export default function HomePage() {
  const { isAuthenticated, navigate } = useAuth()
  const [events, setEvents] = useState([])
  const [units, setUnits] = useState([])
  const [news, setNews] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)

  useEffect(() => {
    loadAll()
  }, [isAuthenticated])

  useEffect(() => {
    if (events.length <= 1) return
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(events.length, 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [events.length])

  async function loadAll() {
    setLoading(true)
    try {
      const [eventsResponse, newsData, unitsData] = await Promise.all([
        getValidPublicEvents({ limit: 6 }).catch(err => { console.error('Events API Error:', err); return { items: [], total: 0 }; }),
        getPublicPromotions(0, 6).catch(err => { console.error('Promotions API Error:', err); return { items: [], total: 0 }; }),
        getUnits().catch(err => { console.error('Units API Error:', err); return { items: [] }; }),
      ])

      const eventItems = (Array.isArray(eventsResponse.items) ? eventsResponse.items : []).map(ev => {
        let imgUrl = ev.image_url;
        if (imgUrl && !imgUrl.startsWith('http')) {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
          const path = imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;
          imgUrl = baseUrl + path;
        }
        return { ...ev, image_url: imgUrl };
      })
      setEvents(eventItems)
      
      const newsItems = (Array.isArray(newsData.items) ? newsData.items : []).map(item => {
        let imgUrl = item.image_url;
        if (imgUrl && !imgUrl.startsWith('http')) {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
          const path = imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;
          imgUrl = baseUrl + path;
        }
        return { ...item, image_url: imgUrl };
      })
      setNews(newsItems.slice(0, 3))

      const allUnits = (unitsData?.items || []).map(u => {
        let logoUrl = u.logo;
        if (logoUrl && !logoUrl.startsWith('http')) {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
          const path = logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl;
          logoUrl = baseUrl + path;
        }
        return { ...u, logo: logoUrl };
      })
      
      let filteredUnits = allUnits
        .filter(u => {
          const type = u.type?.toUpperCase()
          return type === 'CLB' || type === 'LCK'
        })
        .slice(0, 6)

      if (filteredUnits.length === 0 && allUnits.length > 0) {
        filteredUnits = allUnits
          .filter(u => u.type?.toUpperCase() !== 'SYSTEM')
          .slice(0, 6)
      }
      
      setUnits(filteredUnits)

      if (isAuthenticated) {
        const myRegs = await getMyRegistrations().catch(() => [])
        const now = new Date()
        const upcoming = (Array.isArray(myRegs) ? myRegs : [])
          .filter(r => r.event_start && new Date(r.event_start) > now)
          .sort((a, b) => new Date(a.event_start) - new Date(b.event_start))
          .slice(0, 3)
        setMyEvents(upcoming)
      }
    } finally {
      setLoading(false)
    }
  }

  const featuredEvent = events[heroIndex] || null
  const upcomingEvents = events.slice(0, 3)

  const getStatusInfo = (event) => {
    const now = new Date()
    const regStart = event.registration_start ? new Date(event.registration_start) : null
    const regEnd = event.registration_end ? new Date(event.registration_end) : null
    if (!regStart && !regEnd) return { label: 'Đang mở đơn', className: 'status-open' }
    if (regStart && now < regStart) return { label: 'Sắp mở đơn', className: 'status-upcoming' }
    if (regEnd && now > regEnd) return { label: 'Đã đóng đơn', className: 'status-closed' }
    return { label: 'Đang mở đơn', className: 'status-open' }
  }

  return (
    <div className="home-page">
      {/* ── HERO BANNER ── */}
      <section className="home-hero">
        <div className="home-hero-bg">
          {events.slice(0, 3).map((ev, idx) => (
            <img
              key={ev.id}
              src={ev.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80'}
              alt={ev.title}
              className={heroIndex === idx ? 'active' : ''}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: heroIndex === idx ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: heroIndex === idx ? 1 : 0
              }}
            />
          ))}
        </div>
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <span className="home-hero-badge">SỰ KIỆN NỔI BẬT</span>
          <h1 className="home-hero-title">
            {featuredEvent?.title || 'Chào mừng đến với Cổng thông tin Sinh viên v16'}
          </h1>
          <div className="home-hero-btns">
            <div className="home-hero-btns-group">
              <Link to={PATHS.event} className="home-btn-outline">
                Sự kiện
              </Link>
              <Link to={PATHS.units} className="home-btn-outline">
                Đơn vị
              </Link>
              <Link to={PATHS.about} className="home-btn-outline">
                Tin tức
              </Link>
            </div>
            {featuredEvent && (
              <Link to={`${PATHS.event}/${featuredEvent.id}`} className="home-btn-primary">
                Tham gia ngay
              </Link>
            )}
          </div>
        </div>
        <div className="home-hero-indicators">
          {events.slice(0, 3).map((_, idx) => (
            <span
              key={idx}
              className={`indicator ${heroIndex === idx ? 'active' : ''}`}
              onClick={() => setHeroIndex(idx)}
            />
          ))}
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="home-body">
        <div className="home-grid">
          <div className="home-left">
            <section className="home-section section-upcoming">
              <div className="home-section-header">
                <div>
                  <h2 className="home-section-title">Sự kiện sắp tới</h2>
                  <p className="home-section-sub">Những hoạt động ngoại khóa dành cho bạn</p>
                </div>
                <Link to={PATHS.event} className="home-see-all">
                  Tất cả <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <p className="home-loading">Đang tải...</p>
              ) : (
                <div className="home-events-grid">
                  {upcomingEvents.length > 0 ? upcomingEvents.map((event) => {
                    const status = getStatusInfo(event);
                    return (
                      <Link
                        key={event.id}
                        to={`${PATHS.event}/${event.id}`}
                        className="home-event-card"
                      >
                        <div className="home-event-img">
                          <img
                            src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80`}
                            alt={event.title}
                          />
                          <span className={`home-event-badge ${status.className}`}>{status.label}</span>
                        </div>
                        <div className="home-event-body">
                          <p className="home-event-date">{formatDateShort(event.event_start).toUpperCase()}</p>
                          <h3 className="home-event-title">{event.title}</h3>
                          <div className="home-event-meta">
                            <div className="home-event-location">
                              <span className="material-symbols-outlined">location_on</span>
                              <span>{event.location || 'PTIT'}</span>
                            </div>
                            <div className="home-event-points">
                              <span className="material-symbols-outlined">stars</span>
                              <span>+{event.point} điểm</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  }) : (
                    <p className="home-empty">Hiện không có sự kiện nào sắp diễn ra.</p>
                  )}
                </div>
              )}
            </section>

            <section className="home-section">
              <div className="home-section-header">
                <div>
                  <h2 className="home-section-title">CLB & Liên chi</h2>
                  <p className="home-section-sub">Phát triển bản thân tại môi trường năng động</p>
                </div>
              </div>

              <div className="home-clb-scroll">
                {loading ? (
                  <p className="home-loading">Đang tải...</p>
                ) : units.length > 0 ? units.slice(0, 6).map((unit, idx) => (
                  <Link key={unit.id} to={`${PATHS.club}/${unit.id}`} className="home-clb-card">
                    <div className="home-clb-icon">
                      {unit.logo ? (
                        <img src={unit.logo} alt={unit.name} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <span className="material-symbols-outlined" style={{ display: unit.logo ? 'none' : 'flex' }}>
                        {UNIT_ICONS[idx % UNIT_ICONS.length]}
                      </span>
                    </div>
                    <h4 className="home-clb-name" title={unit.name}>
                      {unit.name}
                    </h4>
                    {unit.introduction && (
                      <p className="home-clb-intro" title={stripHtml(unit.introduction)}>
                        {unit.introduction}
                      </p>
                    )}
                  </Link>
                )) : (
                  <p className="home-empty">Chưa có dữ liệu đơn vị.</p>
                )}
              </div>
            </section>

            <section className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">Tin tức & Thông báo</h2>
              </div>

              <div className="home-news-list">
                {loading ? (
                  <p className="home-loading">Đang tải...</p>
                ) : news.length > 0 ? news.map((item) => (
                  <Link key={item.id} to={`/news/${item.id}`} className="home-news-row">
                    <img src={item.image_url || '/placeholder-news.jpg'} alt={item.title} className="home-news-img" />
                    <div className="home-news-body">
                      <p className="home-news-cat">{item.organization?.name || 'TIN TỨC'}</p>
                      <h3 className="home-news-title">{item.title}</h3>
                      <p className="home-news-desc">{stripHtml(item.description).substring(0, 100)}...</p>
                      <span className="home-news-time">{getRelativeTime(item.created_at)}</span>
                    </div>
                  </Link>
                )) : (
                  <p className="home-empty">Không có tin tức mới.</p>
                )}
              </div>
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="home-sidebar">
            <div className="home-sidebar-sticky">
              <div className="home-sidebar-card">
                <div className="home-sidebar-card-header">
                  <h2 className="home-sidebar-title">Sự kiện của bạn</h2>
                  {myEvents.length > 0 && (
                    <span className="home-sidebar-badge">{myEvents.length} SẮP TỚI</span>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="home-sidebar-login">
                    <span className="material-symbols-outlined home-sidebar-login-icon">account_circle</span>
                    <p>Đăng nhập để xem lịch sự kiện của bạn</p>
                    <Link to={PATHS.login} className="home-sidebar-login-btn">
                      Đăng nhập ngay
                    </Link>
                  </div>
                ) : myEvents.length === 0 ? (
                  <p className="home-empty">Bạn chưa đăng ký sự kiện nào sắp tới.</p>
                ) : (
                  <div className="home-my-events">
                    {myEvents.map((event) => (
                      <Link key={event.id || event.event_id} to={`${PATHS.event}/${event.id || event.event_id}`} className="home-my-event-item">
                        <div className="home-my-event-date">
                          <span className="date-month">{getMonthAbbr(event.event_start)}</span>
                          <span className="date-day">{getDay(event.event_start)}</span>
                        </div>
                        <div className="home-my-event-info">
                          <h4>{event.title}</h4>
                          <div className="home-my-event-time">
                            <span className="material-symbols-outlined">schedule</span>
                            <span>{getTimeRange(event.event_start, event.event_end)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
