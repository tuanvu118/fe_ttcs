import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Buildings,
  Calendar,
  DownloadSimple,
  Link,
  PencilSimple,
  QrCode,
  Trash,
  Trophy,
} from '@phosphor-icons/react'
import { Popconfirm, message } from 'antd'
import { deleteUnitEvent, getHtskRegistrationsByUnitEvent } from '../../../service/apiAdminEvent'
import { getStoredCurrentSemester } from '../../../utils/currentSemesterStorage'
import { downloadUnitEventHtskExcel } from '../../../utils/exportUnitEventHtskExcel'
import QRModalUnitEvent from '../QR/QRModalUnitEvent'
import styles from './EUDetail.module.css'

export default function EUDetailHTSK({ data, unitId, eventId }) {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [registrationsError, setRegistrationsError] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const currentSemester = getStoredCurrentSemester()
  const semesterObj =
    data && currentSemester?.id === (data.semester_id || data.semesterId) ? currentSemester : null

  const handleBack = () => navigate(`/admin/${unitId}/events`)
  const handleEdit = () => navigate(`/admin/${unitId}/events/u/${eventId}/edit`)

  const handleDelete = async () => {
    try {
      await deleteUnitEvent(eventId)
      handleBack()
    } catch {
      // Error handled by service
    }
  }

  const handleCopyUrl = () => {
    const taskUrl = `${window.location.origin}/task/${eventId}`
    navigator.clipboard.writeText(taskUrl)
      .then(() => {
        message.success('Đã sao chép đường dẫn yêu cầu!')
      })
      .catch(() => {
        message.error('Không thể sao chép đường dẫn.')
      })
  }

  const handleExportHtskExcel = () => {
    try {
      const semesterLabel = semesterObj
        ? `${semesterObj.name} - ${semesterObj.academic_year}`
        : ''
      downloadUnitEventHtskExcel({
        eventData: data,
        registrations,
        semesterLabel,
        routeEventId: eventId,
      })
      message.success('Đã tải file Excel danh sách đăng ký.')
    } catch (err) {
      console.error('Export HTSK excel failed', err)
      message.error('Không thể xuất file Excel.')
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('vi-VN')
  }

  const studentRegistrationEnabled = Boolean(data?.is_student_registration)
  const showLimit =
    data?.type === 'HTSK' && studentRegistrationEnabled

  useEffect(() => {
    if (!eventId) {
      setRegistrations([])
      setRegistrationsError('')
      setRegistrationsLoading(false)
      return
    }

    let cancelled = false
    async function loadRegistrations() {
      setRegistrationsLoading(true)
      setRegistrationsError('')
      try {
        const list = await getHtskRegistrationsByUnitEvent(eventId)
        if (!cancelled) {
          setRegistrations(Array.isArray(list) ? list : [])
        }
      } catch {
        if (!cancelled) {
          setRegistrations([])
          setRegistrationsError('Không thể tải danh sách đăng ký HTSK.')
        }
      } finally {
        if (!cancelled) {
          setRegistrationsLoading(false)
        }
      }
    }
    loadRegistrations()
    return () => {
      cancelled = true
    }
  }, [eventId])

  return (
    <div className={styles.detailRoot}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{data.title}</h1>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.copyBtn}`}
            onClick={() => setIsQrModalOpen(true)}
            title="Mở QR điểm danh"
          >
            <QrCode size={18} />
            QR Điểm danh
          </button>
          <button
            className={`${styles.actionBtn} ${styles.copyBtn}`}
            onClick={handleCopyUrl}
            title="Sao chép link xem của sinh viên"
          >
            <Link size={18} />
            Copy Link
          </button>
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleEdit}>
            <PencilSimple size={18} />
            Chỉnh sửa
          </button>
          <Popconfirm
            title="Xóa yêu cầu"
            description="Bạn có chắc muốn xóa vĩnh viễn yêu cầu này không? Hành động này không thể khôi phục."
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
              <Trash size={18} />
              Xóa yêu cầu
            </button>
          </Popconfirm>
        </div>
      </header>
      <QRModalUnitEvent open={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} eventId={eventId} />

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>LOẠI YÊU CẦU</span>
                  <span className={styles.infoValue}>HỖ TRỢ TỔ CHỨC</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ĐIỂM THƯỞNG</span>
                  <span className={styles.infoValue}>
                    <Trophy size={16} weight="fill" color="#eab308" style={{ marginRight: '0.25rem' }} />
                    {data.point || 0} ĐIỂM
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>THỜI GIAN TẠO</span>
                  <span className={styles.infoValue}>
                    {new Date(data.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>HỌC KỲ</span>
                  <span className={styles.infoValue}>
                    {semesterObj ? `${semesterObj.name} - ${semesterObj.academic_year}` : 'N/A'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>THỜI GIAN DIỄN RA</span>
                  <span className={styles.infoValue}>
                    {formatDateTime(data.event_start)} - {formatDateTime(data.event_end)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>THỜI GIAN ĐĂNG KÝ</span>
                  <span className={styles.infoValue}>
                    {formatDateTime(data.registration_start)} - {formatDateTime(data.registration_end)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>SV CHỦ ĐỘNG ĐĂNG KÝ</span>
                  <span className={styles.infoValue}>
                    {studentRegistrationEnabled ? 'Có' : 'Không'}
                  </span>
                </div>
                {showLimit ? (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>GIỚI HẠN SV/ĐƠN VỊ</span>
                    <span className={styles.infoValue}>
                      {data.limit_student_registration_in_one_unit ?? '—'}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className={styles.descriptionSection}>
                <h3 className={styles.cardTitle}>Nội dung chi tiết</h3>
                <p className={styles.descriptionText}>{data.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.rightCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Đơn vị phối hợp</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.unitList}>
              {data.assigned_units?.length > 0 ? (
                data.assigned_units.map((unit, idx) => (
                  <div key={unit.id || idx} className={styles.unitItem}>
                    <img
                      src={unit.logo || 'https://via.placeholder.com/40'}
                      alt={unit.name}
                      className={styles.unitLogo}
                    />
                    <div className={styles.unitInfo}>
                      <span className={styles.unitName}>{unit.name}</span>
                      <p className={styles.unitType}>{unit.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>Chưa gán đơn vị nào.</p>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.rightCard}`}>
          <div className={`${styles.cardHeader} ${styles.coopHeaderWithAction}`}>
            <h3 className={styles.cardTitle}>Danh sách đăng ký</h3>
            <button
              type="button"
              className={styles.exportExcelBtn}
              onClick={handleExportHtskExcel}
              disabled={registrationsLoading}
              title="Xuất Excel danh sách sinh viên đăng ký HTSK"
            >
              <DownloadSimple size={18} weight="bold" aria-hidden />
              Xuất Excel
            </button>
          </div>
          <div className={styles.cardBody}>
            {registrationsLoading ? (
              <p className={styles.emptyText}>Đang tải danh sách đăng ký…</p>
            ) : null}
            {registrationsError ? (
              <p className={styles.coopError}>{registrationsError}</p>
            ) : null}

            {!registrationsLoading && !registrationsError && registrations.length > 0 ? (
              <div className={styles.coopTableWrap}>
                <table className={styles.coopTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>MSV</th>
                      <th>Họ tên</th>
                      <th>Lớp</th>
                      <th>Email</th>
                      <th>Đơn vị nộp</th>
                      <th>Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((item, idx) => {
                      const user = item?.user || {}
                      const checkedIn = Boolean(item?.checkIn)
                      return (
                        <tr key={`${user?.student_id || 'user'}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>{user?.student_id || '—'}</td>
                          <td>{user?.full_name || '—'}</td>
                          <td>{user?.class_name || '—'}</td>
                          <td>{user?.email || '—'}</td>
                          <td>{item?.unit_name || '—'}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${checkedIn ? styles.badgeCompleted : styles.badgeNone}`}
                            >
                              {checkedIn ? 'Đã check-in' : 'Chưa check-in'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {!registrationsLoading && !registrationsError && registrations.length === 0 ? (
              <p className={styles.emptyText}>Chưa có đăng ký nào.</p>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  )
}
