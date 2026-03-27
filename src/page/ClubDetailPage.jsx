import { useEffect, useState } from 'react'
import NotificationPopup from '../components/NotificationPopup'
import UnitLogo from '../components/units/UnitLogo'
import UnitTypeBadge from '../components/units/UnitTypeBadge'
import { getUnitDetail } from '../service/unitService'
import { PATHS } from '../utils/routes'
import { getUnitIntroduction } from '../utils/unitUtils'

function ClubDetailPage({ unitId, navigate }) {
  const [unit, setUnit] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    loadUnit()
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

  if (isLoading) {
    return (
      <section className="club-detail-page club-empty-state">
        <h2>Đang tải thông tin đơn vị...</h2>
      </section>
    )
  }

  if (!unit) {
    return (
      <section className="club-detail-page club-empty-state">
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
    <section className="club-detail-page">
      <button
        type="button"
        className="secondary-button club-back-button"
        onClick={() => navigate(PATHS.club)}
      >
        Quay lại câu lạc bộ
      </button>

      <article className="club-detail-card">
        <div className="club-detail-hero">
          <UnitLogo logo={unit.logo} name={unit.name} size="large" />
          <div className="club-detail-copy">
            <UnitTypeBadge type={unit.type} />
            <h1>{unit.name || 'Chưa cập nhật'}</h1>
            <p>Mã đơn vị: {unit.id}</p>
          </div>
        </div>

        <div className="club-detail-section">
          <h2>Giới thiệu</h2>
          <p>{getUnitIntroduction(unit)}</p>
        </div>
      </article>
    </section>
  )
}

export default ClubDetailPage
