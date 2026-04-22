import { useEffect, useState } from 'react'
import { Button, Modal, message } from 'antd'
import { CheckCircle, Clock, NotePencil, Link as LinkIcon, FileText, CalendarBlank } from '@phosphor-icons/react'
import { updateHtttSubmissionStatus } from '../../../service/apiAdminEvent'
import { getHtttSubmissionStatusLabel, normalizeHtttSubmissionStatus } from '../../../utils/unitEventCooperationRows'
import styles from './UnitEventSubmissionDetailModal.module.css'

function submissionEvidenceUrlText(sub) {
  if (!sub || typeof sub !== 'object') {
    return ''
  }
  const raw = sub.evidenceUrl ?? sub.evidence_url
  if (raw == null) {
    return ''
  }
  return String(raw).trim()
}

function mergeSubmissionFromStatusResponse(sub, payload) {
  if (!payload || typeof payload !== 'object') {
    return sub
  }
  return {
    ...sub,
    content: payload.content ?? sub.content,
    evidenceUrl: payload.evidenceUrl ?? payload.evidence_url ?? sub.evidenceUrl,
    evidence_url: payload.evidence_url ?? payload.evidenceUrl ?? sub.evidence_url,
    status: payload.status ?? sub.status,
    submittedAt: payload.submittedAt ?? payload.submitted_at ?? sub.submittedAt,
    submitted_at: payload.submitted_at ?? payload.submittedAt ?? sub.submitted_at,
  }
}

function formatDate(value) {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return String(value)
  }
  return d.toLocaleString('vi-VN')
}

export default function UnitEventSubmissionDetailModal({ open, onClose, row, onAfterStatusUpdate }) {
  const submissionId = row?.submissionId || ''
  const [localSub, setLocalSub] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    if (open && row?.submission) {
      setLocalSub({ ...row.submission })
    }
    if (!open) {
      setLocalSub(null)
      setStatusSaving(false)
    }
  }, [open, row])

  const sub = localSub ?? row?.submission
  const unit = row?.unit
  const statusLabel = sub ? getHtttSubmissionStatusLabel(sub.status ?? 'PENDING') : 'Chưa phản hồi'
  const evidenceUrlText = submissionEvidenceUrlText(sub)
  const normalizedStatus = sub ? normalizeHtttSubmissionStatus(sub.status) || 'PENDING' : ''

  async function handleSetStatus(nextStatus) {
    if (!submissionId) {
      message.warning('Thiếu mã phản hồi, không thể cập nhật trạng thái.')
      return
    }
    setStatusSaving(true)
    try {
      const updated = await updateHtttSubmissionStatus(submissionId, nextStatus)
      setLocalSub((prev) => mergeSubmissionFromStatusResponse(prev || row?.submission, updated))
      message.success('Đã cập nhật trạng thái phản hồi.')
      await onAfterStatusUpdate?.()
    } catch (err) {
      message.error(err?.message || 'Không thể cập nhật trạng thái.')
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <Modal
      title="Chi tiết phản hồi đơn vị"
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {!row || !sub ? (
        <p className={styles.empty}>Không có dữ liệu phản hồi.</p>
      ) : (
        <div className={styles.body}>
          <div className={styles.unitRow}>
            {unit?.logo ? (
              <img src={unit.logo.startsWith('http') ? unit.logo : `${import.meta.env.VITE_API_BASE_URL}${unit.logo}`} alt="" className={styles.logo} />
            ) : (
              <div className={styles.logoPlaceholder} aria-hidden />
            )}
            <div>
              <div className={styles.unitName}>{unit?.name || '—'}</div>
              <div className={styles.unitMeta}>{unit?.type || ''}</div>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <CheckCircle size={14} weight="bold" /> Trạng thái phản hồi
            </span>
            <span className={styles.statusBadge}>{statusLabel}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <NotePencil size={14} weight="bold" /> Nội dung phản hồi
            </span>
            <div className={styles.blockTextCard}>
              <p className={styles.blockText}>{sub.content || '—'}</p>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <LinkIcon size={14} weight="bold" /> Minh chứng (URL)
            </span>
            {evidenceUrlText ? (
              <a 
                href={evidenceUrlText} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.evidenceBtnLink}
              >
                <FileText size={18} />
                <span>Mở minh chứng đơn vị gửi</span>
              </a>
            ) : (
              <span className={styles.muted}>Chưa có minh chứng</span>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <CalendarBlank size={14} weight="bold" /> Thời gian gửi
            </span>
            <span className={styles.timeValue}>{formatDate(sub.submittedAt ?? sub.submitted_at)}</span>
          </div>

          <div className={styles.statusActions}>
            <span className={styles.label}>Cập nhật trạng thái duyệt</span>
            {!submissionId ? (
              <p className={styles.muted}>Không có mã phản hồi để gửi lên máy chủ.</p>
            ) : (
              <div className={styles.statusBtnRow}>
                <Button
                  className={normalizedStatus === 'PENDING' ? styles.btnPendingActive : ''}
                  type={normalizedStatus === 'PENDING' ? 'primary' : 'default'}
                  disabled={statusSaving || normalizedStatus === 'PENDING'}
                  onClick={() => handleSetStatus('PENDING')}
                >
                  Chờ duyệt
                </Button>
                <Button
                  className={normalizedStatus === 'APPROVED' ? styles.btnApprovedActive : ''}
                  type={normalizedStatus === 'APPROVED' ? 'primary' : 'default'}
                  disabled={statusSaving || normalizedStatus === 'APPROVED'}
                  onClick={() => handleSetStatus('APPROVED')}
                >
                  Đã duyệt
                </Button>
                <Button
                  danger
                  disabled={statusSaving || normalizedStatus === 'REJECTED'}
                  onClick={() => handleSetStatus('REJECTED')}
                >
                  Từ chối
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
