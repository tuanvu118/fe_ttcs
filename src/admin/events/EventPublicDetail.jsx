import { 
  Calendar, 
  Clock, 
  Flag, 
  MapPin, 
  FileText, 
  CheckCircle,
  Image as ImageIcon,
  User,
  CaretRight,
  X,
  FileXls
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { getEventRegistrations } from '../../service/apiAdminEvent'
import { downloadPublicEventExcel } from '../../utils/exportPublicEventExcel'
import styles from './adminEventDetail.module.css'

export default function EventPublicDetail({ data, semester }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReg, setSelectedReg] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (data?.id) {
      fetchRegistrations()
    }
  }, [data?.id])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const res = await getEventRegistrations(data.id)
      setRegistrations(res || [])
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (reg) => {
    setSelectedReg(reg)
    setShowModal(true)
  }

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
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>TRẠNG THÁI</span>
                <span className={styles.infoValue} style={{ color: '#10b981' }}>CÔNG KHAI</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ĐỊA ĐIỂM</span>
                <span className={styles.infoValue}>{data.location || 'Chưa xác định'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>SỨC CHỨA</span>
                <span className={styles.infoValue}>{data.max_participants || 0} CHỖ</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ĐIỂM RÈN LUYỆN</span>
                <span className={styles.infoValue}>{data.point || 0} ĐIỂM</span>
              </div>
            </div>

            <div style={{ margin: '2.5rem 0', borderTop: '1px solid #f1f5f9' }} />

            <div className={styles.descriptionSection}>
              <h3 className={styles.cardTitle} style={{ marginBottom: '1.5rem', color: '#64748b' }}>Mô tả chi tiết</h3>
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
            <h3 className={styles.cardTitle}>CẤU TRÚC BIỂU MẪU ĐĂNG KÝ</h3>
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
                      <td style={{ fontWeight: 600 }}>{field.label}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#1e293b' }}>
                            {(field.field_type || field.type) === 'number' ? 'Con số' : 
                             (field.field_type || field.type) === 'checkbox' ? 'Chọn nhiều (Hộp kiểm)' : 
                             (field.field_type || field.type) === 'select' || (field.field_type || field.type) === 'radio' ? 'Chọn một (Trắc nghiệm)' :
                             'Văn bản'}
                          </span>
                          
                          {field.options?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                              {field.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx} 
                                  style={{ 
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                  }}
                                >
                                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

        {/* DANH SÁCH ĐĂNG KÝ */}
        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
          <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className={styles.cardTitle}>DANH SÁCH NGƯỜI ĐĂNG KÝ ({registrations.length})</h3>
            <button 
              className={styles.exportBtn}
              onClick={() => downloadPublicEventExcel({ 
                eventData: data, 
                registrations, 
                semesterLabel: semester ? `${semester.name} - ${semester.academic_year}` : '' 
              })}
              disabled={registrations.length === 0}
            >
              <FileXls size={18} />
              XUẤT EXCEL
            </button>
          </div>
          <div className={styles.cardBody} style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách...</div>
            ) : registrations.length > 0 ? (
              <div className={styles.registrationsTableWrapper}>
                <table className={styles.fieldsTable}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.5rem' }}>SINH VIÊN</th>
                      <th>MSSV</th>
                      <th>THỜI GIAN ĐĂNG KÝ</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, idx) => (
                      <tr 
                        key={idx} 
                        className={styles.registrantRow}
                        onClick={() => handleOpenDetail(reg)}
                      >
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className={styles.avatarPlaceholder}>
                              <User size={16} weight="bold" />
                            </div>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{reg.full_name}</span>
                          </div>
                        </td>
                        <td>{reg.student_id}</td>
                        <td style={{ color: '#64748b' }}>
                          {new Date(reg.registered_at).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                          <CaretRight size={18} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Chưa có sinh viên nào đăng ký sự kiện này.</p>
              </div>
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
                <div className={styles.timePointContent}>
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
                <div className={styles.timePointContent}>
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
                <div className={styles.timePointContent}>
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
                <div className={styles.timePointContent}>
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

      {/* MODAL CHI TIẾT ĐĂNG KÝ */}
      {showModal && selectedReg && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Chi tiết đăng ký</h3>
                <p className={styles.modalSubtitle}>{selectedReg.full_name} - {selectedReg.student_id}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.regInfoGrid}>
                <div className={styles.regInfoItem}>
                  <span className={styles.infoLabel}>Thời gian đăng ký</span>
                  <p className={styles.regInfoValue}>{new Date(selectedReg.registered_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h4 className={styles.answersTitle}>Phản hồi biểu mẫu</h4>
                <div className={styles.answersList}>
                  {data.form_fields?.map((field, idx) => {
                    const answer = selectedReg.answers?.find(a => a.field_id === field.id)
                    return (
                      <div key={idx} className={styles.answerItem}>
                        <label className={styles.answerLabel}>{field.label}</label>
                        <div className={styles.answerValue}>
                          {answer?.value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có câu trả lời</span>}
                        </div>
                      </div>
                    )
                  })}
                  {(!data.form_fields || data.form_fields.length === 0) && (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Sự kiện không có câu hỏi form.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}