import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Clock, 
  ArrowRight, 
  TrendUp, 
  User,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react'
import { getPublicPromotions } from '../service/eventPromotionService'
import styles from './NewsPortalPage.module.css'

export default function NewsPortalPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('latest') // 'latest' | 'popular'

  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 8

  useEffect(() => {
    fetchNews(currentPage)
  }, [currentPage])

  const fetchNews = async (page = 1) => {
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const data = await getPublicPromotions(skip, pageSize)
      setNews(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch news', err)
    } finally {
      setLoading(false)
    }
  }

  const stripHtml = (html) => {
    if (!html) return ''
    const doc = new DOMParser().parseFromString(html, 'text/html')
    let text = doc.body.textContent || ''
    // Loại bỏ emoji/icon dải unicode
    text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    return text.trim()
  }

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // seconds

    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const sortedNews = [...news].sort((a, b) => {
    if (activeTab === 'latest') return new Date(b.created_at) - new Date(a.created_at)
    return b.id.localeCompare(a.id)
  })

  // Tin nổi bật
  const hotNews = [...news].slice(0, 5)

  if (loading) return <div className={styles.loading}>Đang tải bản tin...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.mainTitle}>Tin tức mới nhất</h1>

      </header>

      <div className={styles.contentLayout}>
        {/* ARTICLES LIST */}
        <div className={styles.mainFeed}>
          {sortedNews.map((item) => (
            <Link 
              key={item.id} 
              to={`/news/${item.id}`} 
              className={styles.newsCard}
            >
              <div className={styles.cardCover}>
                <img src={item.image_url || '/placeholder-news.jpg'} alt={item.title} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <span className={styles.badge}>{item.organization?.name || 'TIN TỨC'}</span>
                    <span className={styles.time}>{getRelativeTime(item.created_at)}</span>
                  </div>
                  <h2 className={styles.cardTitle}>{item.title}</h2>
                  <p className={styles.cardDesc}>
                    {stripHtml(item.description).substring(0, 100)}...
                  </p>
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.author}>
                    <div className={styles.authorIcon}>
                      <User size={14} weight="bold" />
                    </div>
                    <span>{item.organization?.name || 'Ban Truyền thông'}</span>
                  </div>
                  <span className={styles.readMore}>
                    Đọc thêm <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {sortedNews.length === 0 && <div className={styles.empty}>Chưa có bài viết nào được đăng.</div>}

          {total > 0 && (
            <div className={styles.pagination}>
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                <CaretLeft size={16} weight="bold" /> Trước
              </button>
              <div className={styles.pageInfo}>
                Trang <strong>{currentPage}</strong> / {Math.ceil(total / pageSize)}
              </div>
              <button 
                className={styles.pageBtn}
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(total / pageSize) || loading}
              >
                Sau <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.trendingWidget}>
            <div className={styles.widgetTitle}>
              <TrendUp size={20} weight="bold" />
              <h3>Tin nổi bật</h3>
            </div>
            
            <div className={styles.trendingList}>
              {hotNews.map((item, index) => (
                <Link key={item.id} to={`/news/${item.id}`} className={styles.trendingItem}>
                  <span className={styles.rank}>{(index + 1).toString().padStart(2, '0')}</span>
                  <div className={styles.trendInfo}>
                    <h4>{item.title}</h4>
                  </div>
                </Link>

              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
