import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Buildings,
  Calendar,
  DownloadSimple,
  Link,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react'
import { Popconfirm, message } from 'antd'
import { deleteUnitEvent, getHtttSubmissionsAllByUnitEvent } from '../../../service/apiAdminEvent'
import { getStoredCurrentSemester } from '../../../utils/currentSemesterStorage'
import { downloadUnitEventHtttExcel } from '../../../utils/exportUnitEventHtttExcel'
import { buildUnitEventCooperationRows } from '../../../utils/unitEventCooperationRows'
import UnitEventSubmissionDetailModal from './UnitEventSubmissionDetailModal'
import styles from './EUDetail.module.css'

export default function EUDetailHTTT({ data, unitId, eventId }) {
  const navigate = useNavigate()
  const [htttSubmissions, setHtttSubmissions] = useState([])
  const [htttSubmissionsLoading, setHtttSubmissionsLoading] = useState(false)
  const [htttSubmissionsError, setHtttSubmissionsError] = useState('')
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [submissionModalRow, setSubmissionModalRow] = useState(null)

  useEffect(() => {
    if (!eventId) {
      setHtttSubmissions([])
      setHtttSubmissionsError('')
      setHtttSubmissionsLoading(false)
      return
    }

    let cancelled = false

    async function loadSubmissions() {
      setHtttSubmissionsLoading(true)
      setHtttSubmissionsError('')
      try {
        const list = await getHtttSubmissionsAllByUnitEvent(eventId)
        if (!cancelled) {
          setHtttSubmissions(list)
        }
      } catch {
        if (!cancelled) {
          setHtttSubmissions([])
          setHtttSubmissionsError('Không thể tải danh sách phản hồi.')
        }
      } finally {
        if (!cancelled) {
          setHtttSubmissionsLoading(false)
        }
      }
    }

    loadSubmissions()
    return () => {
      cancelled = true
    }
  }, [eventId])

  const currentSemester = getStoredCurrentSemester()
  const semesterObj =
    data && currentSemester?.id === (data.semester_id || data.semesterId) ? currentSemester : null

  const cooperationRows = useMemo(
    () => buildUnitEventCooperationRows(data?.assigned_units, htttSubmissions),
    [data?.assigned_units, htttSubmissions],
  )

  function openSubmissionModal(row) {
    if (!row?.hasSubmission) {
      return
    }
    setSubmissionModalRow(row)
    setSubmissionModalOpen(true)
  }

  function closeSubmissionModal() {
    setSubmissionModalOpen(false)
    setSubmissionModalRow(null)
  }

  function handleExportHtttExcel() {
    try {
      const semesterLabel = semesterObj
        ? `${semesterObj.name} - ${semesterObj.academic_year}`
        : ''
      downloadUnitEventHtttExcel({
        data,
        cooperationRows,
        routeUnitId: unitId,
        routeEventId: eventId,
        semesterLabel,
      })
      message.success('Đã tải file Excel.')
    } catch (err) {
      console.error('Export HTTT excel failed', err)
      message.error('Không thể xuất file Excel.')
    }
  }

  function statusBadgeClass(status) {
    if (status === 'PENDING') {
      return styles.badgePending
    }
    if (status === 'APPROVED') {
      return styles.badgeCompleted
    }
    if (status === 'REJECTED') {
      return styles.badgeReject
    }
    return styles.badgeNone
  }

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

  return (
    <div className={styles.detailRoot}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{data.title}</h1>
        </div>
        <div className={styles.actions}>
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

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>LOẠI YÊU CẦU</span>
                  <span className={styles.infoValue}>HỖ TRỢ TRUYỀN THÔNG</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ĐIỂM THƯỞNG</span>
                  <span className={styles.infoValue}>{data.point || 0} ĐIỂM</span>
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
              </div>

              <div className={styles.descriptionSection}>
                <h3 className={styles.cardTitle}>Nội dung chi tiết</h3>
                <p className={styles.descriptionText}>{data.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.rightCard}`}>
          <div className={`${styles.cardHeader} ${styles.coopHeaderWithAction}`}>
            <h3 className={styles.cardTitle}>Đơn vị phối hợp</h3>
            <button
              type="button"
              className={styles.exportExcelBtn}
              onClick={handleExportHtttExcel}
              disabled={htttSubmissionsLoading}
              title="Xuất Excel: thông tin HTTT + danh sách đơn vị và trạng thái"
            >
              <DownloadSimple size={18} weight="bold" aria-hidden />
              Xuất Excel
            </button>
          </div>
          <div className={styles.cardBody}>
            {htttSubmissionsLoading ? (
              <p className={styles.emptyText}>Đang tải phản hồi đơn vị…</p>
            ) : null}
            {htttSubmissionsError ? (
              <p className={styles.coopError}>{htttSubmissionsError}</p>
            ) : null}
            {!htttSubmissionsLoading && cooperationRows.length > 0 ? (
              <div className={styles.coopTableWrap}>
                <table className={styles.coopTable}>
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Trạng thái phản hồi</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cooperationRows.map((row) => (
                      <tr key={row.key}>
                        <td>
                          <div className={styles.coopUnitCell}>
                            <img
                              src={row.unit.logo || 'https://via.placeholder.com/40'}
                              alt=""
                              className={styles.unitLogo}
                            />
                            <div className={styles.unitInfo}>
                              <span className={styles.unitName}>{row.unit.name}</span>
                              <p className={styles.unitType}>{row.unit.type}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${statusBadgeClass(row.status)}`}
                          >
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className={styles.coopActionCell}>
                          <button
                            type="button"
                            className={styles.coopDetailBtn}
                            disabled={!row.hasSubmission}
                            onClick={() => openSubmissionModal(row)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {!htttSubmissionsLoading && cooperationRows.length === 0 ? (
              <p className={styles.emptyText}>Chưa gán đơn vị nào.</p>
            ) : null}
          </div>
        </div>

      </div>

      <UnitEventSubmissionDetailModal
        open={submissionModalOpen}
        onClose={closeSubmissionModal}
        row={submissionModalRow}
        onAfterStatusUpdate={async () => {
          if (!eventId) {
            return
          }
          try {
            const list = await getHtttSubmissionsAllByUnitEvent(eventId)
            setHtttSubmissions(list)
          } catch {
            message.error('Không thể làm mới danh sách phản hồi.')
          }
        }}
      />
    </div>
  )
}
