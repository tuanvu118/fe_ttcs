import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Buildings, Link as LinkIcon, CalendarBlank } from '@phosphor-icons/react'
import { apiRequest } from '../service/apiClient'
import '../style/NewsDetailPage.css'

export default function NewsDetailPage({ newsId }) {
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!newsId) return
    fetchArticle()
  }, [newsId])

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const data = await apiRequest(`/event-promotions/${newsId}`, { method: 'GET' })
      setArticle(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="news-detail-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Đang tải bài viết...</p>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="news-detail-page" style={{ alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p>Bài viết không tồn tại hoặc đã bị xóa.</p>
        <button className="news-back-btn-minimal" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    )
  }

  return (
    <div className="news-detail-page">
      {/* Hero Section */}
      <section className="news-hero">
        <div className="news-hero-bg">
          <img
            src={article.image_url || 'https://via.placeholder.com/1920x600?text=Bảng+tin'}
            alt={article.title}
          />
        </div>
        <div className="news-hero-overlay" />
        <div className="news-hero-content">
          <div className="news-hero-top">
            <button className="news-back-btn-minimal" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> QUAY LẠI
            </button>
            {article.organization?.name && (
              <span className="news-tag-premium">{article.organization.name}</span>
            )}
          </div>
          <h1 className="news-hero-title">{article.title}</h1>
          <div className="news-hero-meta">
            {article.created_at && (
              <div className="news-meta-item">
                <CalendarBlank size={18} weight="fill" />
                <span>{formatDate(article.created_at)}</span>
              </div>
            )}
            {article.time?.start && (
              <div className="news-meta-item">
                <Clock size={18} weight="fill" />
                <span>Sự kiện: {formatDate(article.time.start)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <main className="news-detail-body">
        {/* Main Content */}
        <section className="news-main-content">
          <div className="news-detail-section">
            <h2 className="news-section-title">Nội dung bài viết</h2>
            <div
              className="rich-text-content-student"
              dangerouslySetInnerHTML={{ __html: article.description }}
            />
          </div>

          {article.external_links?.length > 0 && (
            <div className="news-detail-section">
              <h2 className="news-section-title">Liên kết liên quan</h2>
              <ul className="news-links-list">
                {article.external_links.map((url, i) => (
                  <li key={i}>
                    <LinkIcon size={16} weight="bold" />
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="news-sidebar">
          <div className="news-info-card">
            <span className="news-info-label">Đơn vị đăng tải</span>
            <div className="news-info-org">
              <Buildings size={20} weight="bold" color="#2563eb" />
              <strong>{article.organization?.name || 'Chưa có đơn vị'}</strong>
            </div>

            {article.time?.start && (
              <>
                <div className="news-info-divider" />
                <span className="news-info-label">Thời gian sự kiện</span>
                <div className="news-time-row">
                  <span className="news-time-label">BẮT ĐẦU</span>
                  <span className="news-time-value">{formatDate(article.time.start)}</span>
                </div>
                {article.time?.end && (
                  <div className="news-time-row">
                    <span className="news-time-label">KẾT THÚC</span>
                    <span className="news-time-value">{formatDate(article.time.end)}</span>
                  </div>
                )}
              </>
            )}

            <div className="news-info-divider" />
            <span className="news-info-label">Ngày đăng</span>
            <span className="news-time-value">{formatDate(article.created_at)}</span>
          </div>
        </aside>
      </main>
    </div>
  )
}
