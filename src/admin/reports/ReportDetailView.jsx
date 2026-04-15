import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Trash, 
  PencilSimple,
  Checks,
  CaretLeft,
  Paperclip,
  SealCheck,
  WarningOctagon,
  Article,
  UserGear
} from '@phosphor-icons/react'
import styles from './reportDetail.module.css'
import { apiRequest } from '../../service/apiClient'
import InternalEventModal from './components/InternalEventModal'
import StatusReviewModal from './components/StatusReviewModal'

export default function ReportDetailView({ 
  accessToken, 
  onSessionExpired,
  isManager = false
}) {
  const { reportId, unitId } = useParams()
  const navigate = useNavigate()
  
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  
  const [editingEvent, setEditingEvent] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    location: '', 
    participant_count: 0, 
    event_date: '',
    evidence_url: '' 
  })

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`/reports/${reportId}`, {
        method: 'GET',
        authToken: accessToken,
      })
      if (data) setReport(data)
    } catch (error) {
       if (error.status === 401) onSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (reportId) fetchDetail()
  }, [reportId])

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event)
      setForm({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        participant_count: event.participant_count || 0,
        event_date: event.event_date ? event.event_date.substring(0, 10) : '',
        evidence_url: event.evidence_url || ''
      })
    } else {
      setEditingEvent(null)
      setForm({ 
        title: '', 
        description: '', 
        location: '', 
        participant_count: 0, 
        event_date: '', 
        evidence_url: '' 
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingEvent 
        ? `/reports/${reportId}/internal-events/${editingEvent.id}`
        : `/reports/${reportId}/internal-events`
      const method = editingEvent ? 'PUT' : 'POST'
      
      const submitData = {
        ...form,
        event_date: form.event_date || null,
        evidence_url: form.evidence_url || null,
        location: form.location || null,
        description: form.description || null,
        participant_count: form.participant_count || 0
      }

      await apiRequest(url, {
        method,
        headers: { 
          'X-Unit-Id': unitId,
          'Content-Type': 'application/json'
        },
        authToken: accessToken,
        body: JSON.stringify(submitData)
      })
      setShowModal(false)
      fetchDetail()
    } catch (error) {
      alert(error.message || 'Lỗi khi lưu hoạt động')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (eventId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) return
    try {
      await apiRequest(`/reports/${reportId}/internal-events/${eventId}`, {
        method: 'DELETE',
        headers: { 'X-Unit-Id': unitId },
        authToken: accessToken
      })
      fetchDetail()
    } catch (error) {
      alert(error.message || 'Lỗi khi xóa')
    }
  }

  const updateReportStatus = async (status) => {
    setIsSubmitting(true)
    try {
      await apiRequest(`/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        authToken: accessToken,
        body: JSON.stringify({ status, note: reviewNote })
      })
      setShowApproveModal(false)
      setReviewNote('')
      fetchDetail()
    } catch (error) {
      alert(error.message || 'Lỗi khi cập nhật trạng thái')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!window.confirm('Sau khi gửi, bạn sẽ không thể chỉnh sửa báo cáo này. Xác nhận gửi?')) return
    try {
      await apiRequest(`/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        authToken: accessToken,
        body: JSON.stringify({ status: 'CHO_DUYET' })
      })
      fetchDetail()
    } catch (error) {
      alert(error.message || 'Lỗi khi gửi báo cáo')
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/export/detail`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (!response.ok) throw new Error('Xuất file thất bại')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bao_cao_chi_tiet_${report.month}_${report.year}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      alert(error.message)
    }
  }

  if (loading) return <div className={styles.pageContainer}><p>Đang tải dữ liệu báo cáo...</p></div>
  if (!report) return <div className={styles.pageContainer}><p>Không tìm thấy báo cáo.</p></div>

  const isLocked = report.status !== 'CHUA_NOP' && report.status !== 'YEU_CAU_NOP_LAI'
  const isPendingApproval = report.status === 'CHO_DUYET'

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button className={styles.backBtn} onClick={handleBack}>
            <CaretLeft size={20} weight="bold" /> Quay lại
          </button>
          <div className={styles.reportTitle}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Chi tiết Báo cáo Tháng {report.month}/{report.year}</h2>
            <div className={styles.compactStats}>
              <span>Tổng: <strong>{report.internal_events.length + (report.unit_events?.length || 0)}</strong></span>
              <span className={styles.dot}>•</span>
              <span>Được giao: <strong>{report.unit_events?.length || 0}</strong></span>
              <span className={styles.dot}>•</span>
              <span>Nội bộ: <strong>{report.internal_events.length}</strong></span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerActions}>
           <button 
             className={`${styles.actionBtn} ${styles.export}`}
             onClick={handleExport}
           >
             <Article size={18} /> Xuất báo cáo
           </button>

           {isManager && isPendingApproval && (
             <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className={`${styles.actionBtn} ${styles.reject}`}
                  onClick={() => { setShowApproveModal(true); setReviewNote('') }}
                >
                  <WarningOctagon size={18} /> Yêu cầu chỉnh sửa
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.approve}`}
                  onClick={() => { if(window.confirm('Xác nhận phê duyệt báo cáo này?')) updateReportStatus('DA_DUYET') }}
                >
                  <SealCheck size={18} weight="fill" /> Phê duyệt
                </button>
             </div>
           )}
           {!isManager && !isLocked && (
             <button className={styles.submitBtn} onClick={handleFinalSubmit}>
               Nộp báo cáo <Checks size={18} weight="bold" />
             </button>
           )}
        </div>
      </div>

      <div className={styles.standalonePage}>
        {report.note && (
          <div className={`${styles.sectionCard} ${styles.noteCard}`} style={{ borderLeft: '4px solid #ef4444' }}>
              <div className={styles.sectionHeader} style={{ background: '#fef2f2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <WarningOctagon size={22} weight="fill" color="#ef4444" />
                  <h3 style={{ color: '#991b1b' }}>Phản hồi từ cấp quản lý</h3>
                </div>
              </div>
              <div style={{ padding: '1.25rem 2rem', color: '#b91c1c', fontWeight: 600 }}>
                {report.note}
              </div>
          </div>
        )}

        {/* 1. SỰ KIỆN ĐƯỢC PHÂN CÔNG */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserGear size={22} weight="bold" color="#2563eb" />
              <h3>1. Sự kiện được phân công cho đơn vị</h3>
            </div>
          </div>
          <div className={styles.tableWrapper}>
              <table className={styles.activityTable}>
                <thead>
                  <tr>
                    <th>TÊN SỰ KIỆN</th>
                    <th>LOẠI</th>
                    <th>NGÀY GIAO</th>
                    <th>TRẠNG THÁI NHIỆM VỤ</th>
                  </tr>
                </thead>
                <tbody>
                  {report.unit_events?.map((ev, index) => (
                    <tr key={ev.id} className={styles.tableRow} style={{ animationDelay: `${index * 50}ms` }}>
                      <td className={styles.activityName}><strong>{ev.title}</strong></td>
                      <td>
                        <span className={styles.badge} style={{ background: '#eff6ff', color: '#2563eb' }}>
                          {ev.type === 'HTSK' ? 'Sự kiện' : 'Tham quan'}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{new Date(ev.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                         <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>✓ Đã hoàn thành hệ thống</span>
                      </td>
                    </tr>
                  ))}
                   {(!report.unit_events || report.unit_events.length === 0) && (
                    <tr><td colSpan={4} className={styles.emptyRow}>Đơn vị không được phân công sự kiện nào trong kỳ này.</td></tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>

        {/* 2. HOẠT ĐỘNG NỘI BỘ */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Article size={22} weight="bold" color="#059669" />
              <h3>2. Hoạt động nội bộ chuyên môn (Tự quản)</h3>
            </div>
            {!isLocked && !isManager && (
              <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                <Plus size={16} weight="bold" /> Thêm hoạt động
              </button>
            )}
          </div>
          
          <div className={styles.tableWrapper}>
              <table className={styles.activityTable}>
                <thead>
                  <tr>
                    <th>TÊN HOẠT ĐỘNG / ĐỊA ĐIỂM</th>
                    <th>NGÀY DIỄN RA</th>
                    <th>SỐ NGƯỜI THAM GIA</th>
                    <th>MINH CHỨNG</th>
                    {!isLocked && !isManager && <th>THAO TÁC</th>}
                  </tr>
                </thead>
                <tbody>
                  {report.internal_events.map((ev, index) => (
                    <tr key={ev.id} className={styles.tableRow} style={{ animationDelay: `${index * 50}ms` }}>
                      <td className={styles.activityName}>
                        <strong>{ev.title}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>📍 {ev.location || 'Không rõ địa điểm'}</p>
                      </td>
                      <td className={styles.dateCell}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td className={styles.countCell}><strong>{ev.participant_count || 0}</strong> thành viên</td>
                      <td>
                        {ev.evidence_url ? (
                            <a href={ev.evidence_url} target="_blank" rel="noreferrer" className={styles.evidenceLink}>
                              <Paperclip size={20} /> Xem minh chứng
                            </a>
                        ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Chưa đính kèm</span>
                        )}
                      </td>
                      {!isLocked && !isManager && (
                          <td>
                              <div className={styles.rowActions}>
                                  <button className={styles.editBtn} title="Chỉnh sửa" onClick={() => handleOpenModal(ev)}><PencilSimple size={18} /></button>
                                  <button className={styles.delBtn} title="Xóa" onClick={() => handleDelete(ev.id)}><Trash size={18} /></button>
                              </div>
                          </td>
                      )}
                    </tr>
                  ))}
                  {report.internal_events.length === 0 && (
                      <tr>
                          <td colSpan={5} className={styles.emptyRow}>
                              Chưa có hoạt động nội bộ nào được ghi nhận.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      {/* Internal Event Modal */}
      <InternalEventModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        form={form}
        setForm={setForm}
        isEditing={!!editingEvent}
        isSubmitting={isSubmitting}
      />

      {/* Status Review Modal */}
      <StatusReviewModal 
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={() => updateReportStatus('YEU_CAU_NOP_LAI')}
        reviewNote={reviewNote}
        setReviewNote={setReviewNote}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
