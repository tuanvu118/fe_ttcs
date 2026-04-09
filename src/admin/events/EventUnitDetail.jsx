import { 
  Buildings,
  Calendar,
  Image as ImageIcon,
  Trophy
} from '@phosphor-icons/react'
import styles from './adminEventDetail.module.css'

export default function EventUnitDetail({ data, semester }) {
  if (!data) return null

  return (
    <div className={styles.contentGrid}>
      {/* CỘT TRÁI - CHI TIẾT CHÍNH */}
      <div className={styles.mainColumn}>
        <div className={styles.card}>
          <div className={styles.bannerArea}>
            {data.image_url ? (
              <img src={data.image_url} alt={data.title} className={styles.bannerImg} />
            ) : (
              <div className={styles.bannerPlaceholder}>
                <ImageIcon size={48} weight="light" />
                <p>Yêu cầu chưa có ảnh minh họa</p>
              </div>
            )}
          </div>

          <div className={styles.cardBody}>
            <div className={styles.infoGrid} style={{ marginBottom: '2.5rem' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>LOẠI YÊU CẦU</span>
                <span className={styles.infoValue}>
                  {data.type === 'HTTT' ? 'HỖ TRỢ TRUYỀN THÔNG' : 'HỖ TRỢ TỔ CHỨC'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ĐIỂM THƯỞNG</span>
                <span className={styles.infoValue}>
                  <Trophy size={16} weight="fill" color="#eab308" style={{ marginRight: '0.25rem' }} />
                  {data.point || 0} ĐIỂM
                </span>
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.cardTitle} style={{ marginBottom: '1.25rem' }}>Nội dung chi tiết</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI - SIDEBAR INFO */}
      <div className={styles.sidebarColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Đơn vị phối hợp</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.sectionDesc} style={{ marginBottom: '1.25rem' }}>
              Danh sách các CLB/Khoa tham gia thực hiện yêu cầu này.
            </p>
            
            <div className={styles.unitList}>
              {data.assigned_units?.length > 0 ? (
                data.assigned_units.map((unit, idx) => (
                  <div key={idx} className={styles.unitItem}>
                    <img 
                      src={unit.logo || 'https://via.placeholder.com/40'} 
                      alt={unit.name} 
                      className={styles.unitLogo} 
                    />
                    <div className={styles.unitInfo}>
                      <span className={styles.unitName}>{unit.name}</span>
                      <p style={{ margin: 0, fontSize: '0.625rem', color: '#94a3b8' }}>{unit.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>Chưa gán đơn vị nào.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Bối cảnh</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.timeline}>
              <div className={styles.timePoint}>
                <div className={styles.timeIcon}>
                  <Calendar size={20} />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>THỜI GIAN TẠO</span>
                  <span className={styles.timeValue}>
                    {new Date(data.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
              
              <div className={styles.timePoint}>
                <div className={styles.timeIcon}>
                  <Buildings size={20} />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>HỌC KỲ</span>
                  <span className={styles.timeValue}>{semester ? `${semester.name} - ${semester.academic_year}` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}