import { 
  Calendar, 
  Clock, 
  Flag, 
  MapPin, 
  FileText, 
  CheckCircle,
  Image as ImageIcon
} from '@phosphor-icons/react'
import styles from './adminEventDetail.module.css'

export default function EventPublicDetail({ data, semester }) {
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
                <p>Sự kiện chưa có ảnh bìa</p>
              </div>
            )}
          </div>

          <div className={styles.cardBody}>
            <div className={styles.infoGrid} style={{ marginBottom: '2.5rem' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>LOẠI SỰ KIỆN</span>
                <span className={styles.infoValue}>SỰ KIỆN CHUNG</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ĐIỂM RÈN LUYỆN</span>
                <span className={styles.infoValue}>{data.point || 0} ĐIỂM</span>
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.cardTitle} style={{ marginBottom: '1.25rem' }}>Mô tả sự kiện</h3>
              <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: data.description }} 
              />
            </div>
          </div>
        </div>

        {/* CÂU HỎI ĐĂNG KÝ */}
        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>BIỂU MẪU ĐĂNG KÝ</h3>
          </div>
          <div className={styles.cardBody}>
            {data.form_fields?.length > 0 ? (
              <table className={styles.fieldsTable}>
                <thead>
                  <tr>
                    <th>CÂU HỎI</th>
                    <th>LOẠI PHẢN HỒI</th>
                    <th>BẮT BUỘC</th>
                  </tr>
                </thead>
                <tbody>
                  {data.form_fields.map((field, idx) => (
                    <tr key={idx}>
                      <td>{field.label}</td>
                      <td>
                        {(field.field_type || field.type) === 'text' ? 'Văn bản ngắn' : 
                         (field.field_type || field.type) === 'textarea' ? 'Văn bản dài' : 
                         (field.field_type || field.type) === 'select' ? 'Lựa chọn duy nhất' : 'Nhiều lựa chọn'}
                      </td>
                      <td>
                        {field.required && <span className={styles.requiredBadge}>Bắt buộc</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                Sự kiện này không yêu cầu điền form đăng ký đặc thù.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI - SIDEBAR INFO */}
      <div className={styles.sidebarColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thời gian thực hiện</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.timeline}>
              <div className={styles.timePoint}>
                <div className={styles.timeIcon} style={{ color: '#10b981' }}>
                  <Calendar size={20} weight="bold" />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>MỞ ĐĂNG KÝ</span>
                  <span className={styles.timeValue}>
                    {new Date(data.registration_start).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className={styles.timePoint}>
                <div className={styles.timeIcon} style={{ color: '#f43f5e' }}>
                  <Clock size={20} weight="bold" />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>ĐÓNG ĐĂNG KÝ</span>
                  <span className={styles.timeValue}>
                    {new Date(data.registration_end).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div style={{ padding: '0.5rem 0', borderTop: '1px solid #f1f5f9', margin: '0.5rem 0' }}></div>

              <div className={styles.timePoint}>
                <div className={styles.timeIcon} style={{ color: '#6366f1' }}>
                  <Flag size={20} weight="bold" />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>BẮT ĐẦU SỰ KIỆN</span>
                  <span className={styles.timeValue}>
                    {new Date(data.event_start).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className={styles.timePoint}>
                <div className={styles.timeIcon} style={{ color: '#a855f7' }}>
                  <MapPin size={20} weight="bold" />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>KẾT THÚC SỰ KIỆN</span>
                  <span className={styles.timeValue}>
                    {new Date(data.event_end).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Thông tin khác</h3>
          </div>
          <div className={styles.cardBody}>
             <div className={styles.infoItem}>
                <span className={styles.infoLabel}>HỌC KỲ</span>
                <span className={styles.infoValue}>{semester ? `${semester.name} - ${semester.academic_year}` : 'N/A'}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}