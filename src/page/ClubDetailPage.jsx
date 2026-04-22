import { useEffect, useState } from 'react'
import { 
  EnvelopeSimple, 
  Globe, 
  User, 
  Info,
  Calendar,
  Users,
  ClockCounterClockwise
} from '@phosphor-icons/react'
import NotificationPopup from '../components/NotificationPopup'
import UnitLogo from '../components/units/UnitLogo'
import { getUnitDetail } from '../service/unitService'
import { getPublicPromotions } from '../service/eventPromotionService'
import { PATHS } from '../utils/routes'
import './UnitDetailPage.css'

function ClubDetailPage({ unitId, navigate }) {
  const [unit, setUnit] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPromos, setIsLoadingPromos] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadUnit()
    loadPromotions()
  }, [unitId])

  async function loadUnit() {
    setIsLoading(true)

    try {
      const nextUnit = await getUnitDetail(unitId)
      setUnit(nextUnit)
    } catch (error) {
      setNotice({
        title: error?.status === 404 ? 'Không tìm thấy đơn vị' : 'Có lỗi xảy ra',
        message:
          error?.status === 404
            ? 'Đơn vị bạn đang tìm không tồn tại hoặc đã bị xóa.'
            : error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadPromotions() {
    setIsLoadingPromos(true)
    try {
      // Get 3 latest approved promotions for this unit
      const response = await getPublicPromotions(0, 3, unitId)
      setPromotions(response.items || [])
    } catch (error) {
      console.error('Failed to load promotions:', error)
    } finally {
      setIsLoadingPromos(false)
    }
  }

  function formatEventDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <section className="page-card" style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Đang tải thông tin đơn vị...</h2>
      </section>
    )
  }

  if (!unit) {
    return (
      <section className="page-card" style={{ textAlign: 'center', padding: '5rem' }}>
        <NotificationPopup
          isOpen={Boolean(notice?.message)}
          title={notice?.title}
          message={notice?.message}
          onClose={() => setNotice(null)}
        />
        <h2>Không tìm thấy đơn vị</h2>
        <p>Thông tin chi tiết của đơn vị hiện không khả dụng.</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate(PATHS.club)}
        >
          Quay lại danh sách
        </button>
      </section>
    )
  }

  return (
    <div className="unit-detail-container">
      <NotificationPopup
        isOpen={Boolean(notice?.message)}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />

      {/* Hero Section */}
      <section className="unit-hero-section">
        <div className="unit-hero-banner">
          <img 
            src={unit.cover_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"} 
            alt={unit.name} 
          />
        </div>
        
        <div className="unit-header-info">
          <div className="unit-header-content">
            <div className="unit-logo-wrapper">
              <UnitLogo logo={unit.logo} name={unit.name} size="large" />
            </div>
            <div className="unit-identity">
              <span className="unit-category">
                {unit.type === 'clb' ? 'Câu lạc bộ' : unit.type === 'lck' ? 'Liên chi đoàn' : 'Đơn vị hệ thống'}
              </span>
              <h1 className="unit-name-title">{unit.name || 'Chưa cập nhật'}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <div className="unit-content-layout">
        <main className="unit-main-column">
          {/* Introduction Section */}
          <article>
            <h2 className="unit-section-title">
              <Info size={24} weight="bold" /> Giới thiệu
            </h2>
            <div className="unit-description-text">
              {unit.introduction || 'Hiện chưa có mô tả chi tiết cho đơn vị này.'}
            </div>
          </article>

          {/* Latest Promotions Section */}
          <section className="unit-promotions-section">
            <h2 className="unit-section-title">
              <Calendar size={24} weight="bold" /> Sự kiện nổi bật
            </h2>
            
            {isLoadingPromos ? (
              <p>Đang tải sự kiện...</p>
            ) : promotions.length > 0 ? (
              <div className="unit-promo-grid">
                {promotions.map((promo) => (
                  <div 
                    key={promo.id} 
                    className="unit-promo-card"
                    onClick={() => navigate(`/news/${promo.id}`)}
                  >
                    <div className="unit-promo-image">
                      {promo.image_url ? (
                        <img src={promo.image_url} alt={promo.title} />
                      ) : (
                        <div className="unit-promo-placeholder">
                          <Calendar size={32} weight="light" />
                        </div>
                      )}
                    </div>
                    <div className="unit-promo-content">
                      <span className="unit-promo-date">
                        {formatEventDate(promo.time?.start)}
                      </span>
                      <h3 className="unit-promo-title">{promo.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="unit-description-text" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Hiện chưa có sự kiện nào được đăng tải.
              </div>
            )}
          </section>
        </main>

        <aside className="unit-sidebar-column">
          {/* Unit Stats Card */}
          <div className="unit-sidebar-card">
            <h3 className="unit-section-title">
              Thông tin đơn vị
            </h3>
            <ul className="unit-info-list">
              <li className="unit-info-item">
                <Users size={20} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Số thành viên</p>
                  <p>{unit.member_count || 0} thành viên</p>
                </div>
              </li>
              <li className="unit-info-item">
                <ClockCounterClockwise size={20} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Năm thành lập</p>
                  <p>{unit.established_year || 'Chưa cập nhật'}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Card */}
          <div className="unit-sidebar-card">
            <h3 className="unit-section-title">
              Thông tin liên hệ
            </h3>
            <ul className="unit-info-list">
              <li className="unit-info-item">
                <EnvelopeSimple size={20} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Email</p>
                  <p>{unit.email || 'Chưa cập nhật'}</p>
                </div>
              </li>
              <li className="unit-info-item">
                <Globe size={20} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Website</p>
                  <p>
                    <a href="#" className="unit-info-link">fb.com/official.unit</a>
                  </p>
                </div>
              </li>
              <li className="unit-info-item">
                <User size={20} className="unit-info-icon" />
                <div className="unit-info-content">
                  <p>Phụ trách</p>
                  <p>Ban Quản lý Đơn vị</p>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ClubDetailPage
