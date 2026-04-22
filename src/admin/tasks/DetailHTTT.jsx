import { useEffect, useMemo, useState } from 'react'
import { Trophy, Clock, CheckCircle, NotePencil, Link as LinkIcon, FileText } from '@phosphor-icons/react'
import { message } from 'antd'
import {
  createUnitEventSubmission,
  getUnitEventSubmissionByEventId,
  updateUnitEventSubmissionByEventId,
} from '../../service/taskService'
import {
  getHtttSubmissionStatusLabel,
  normalizeHtttSubmissionStatus,
} from '../../utils/unitEventCooperationRows'
import styles from './detailCommon.module.css'
import u from './DetailHTTT.module.css'

function looksLikeHttpUrl(value) {
  if (!value || typeof value !== 'string') return false
  return /^https?:\/\//i.test(value.trim())
}

export default function DetailHTTT({ data, unitId, taskId, semesterDisplay }) {
  const [submission, setSubmission] = useState(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editEvidenceUrl, setEditEvidenceUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submissionLoading, setSubmissionLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchSubmission() {
      if (!taskId || !unitId) {
        setSubmissionLoading(false)
        return
      }
      setSubmissionLoading(true)
      try {
        const submissionRes = await getUnitEventSubmissionByEventId(taskId, unitId)
        if (!cancelled) {
          setSubmission(submissionRes || null)
          setIsCreateMode(false)
          setEditContent(submissionRes?.content || '')
          setEditEvidenceUrl(submissionRes?.evidenceUrl || '')
          setIsEditing(false)
        }
      } catch (err) {
        if (!cancelled) {
          const isNotFound =
            err?.status === 404 || /not\s*found/i.test(String(err?.message || ''))
          if (isNotFound) {
            setSubmission(null)
            setIsCreateMode(true)
            setEditContent('')
            setEditEvidenceUrl('')
            setIsEditing(true)
          } else {
            setSubmission(null)
            setIsCreateMode(false)
          }
        }
      } finally {
        if (!cancelled) {
          setSubmissionLoading(false)
        }
      }
    }

    fetchSubmission()
    return () => {
      cancelled = true
    }
  }, [taskId, unitId])

  const isLockedApproved = useMemo(() => {
    if (!submission) {
      return false
    }
    return normalizeHtttSubmissionStatus(submission.status) === 'APPROVED'
  }, [submission])

  useEffect(() => {
    if (isLockedApproved) {
      setIsEditing(false)
    }
  }, [isLockedApproved])

  const { statusText, statusVariant } = useMemo(() => {
    if (submissionLoading) {
      return { statusText: 'Đang tải…', statusVariant: 'loading' }
    }
    if (!submission) {
      if (isCreateMode) {
        return { statusText: 'Chưa phản hồi', statusVariant: 'empty' }
      }
      return { statusText: 'Không tải được', statusVariant: 'neutral' }
    }
    const n = normalizeHtttSubmissionStatus(submission?.status) || 'PENDING'
    if (n === 'PENDING') {
      return { statusText: getHtttSubmissionStatusLabel(n), statusVariant: 'pending' }
    }
    if (n === 'APPROVED') {
      return { statusText: getHtttSubmissionStatusLabel(n), statusVariant: 'approved' }
    }
    if (n === 'REJECTED') {
      return { statusText: getHtttSubmissionStatusLabel(n), statusVariant: 'reject' }
    }
    return {
      statusText: String(submission?.status || '').trim() || 'Không xác định',
      statusVariant: 'neutral',
    }
  }, [submission, submissionLoading, isCreateMode])

  const handleSaveSubmission = async () => {
    if (!taskId || !unitId) {
      message.error('Thiếu thông tin nhiệm vụ.')
      return
    }
    if (isLockedApproved) {
      message.warning('Phản hồi đã được duyệt, không thể chỉnh sửa.')
      return
    }

    setIsSaving(true)
    try {
      const updated = isCreateMode
        ? await createUnitEventSubmission(taskId, unitId, {
            content: editContent,
            evidenceUrl: editEvidenceUrl,
          })
        : await updateUnitEventSubmissionByEventId(taskId, unitId, {
            content: editContent,
            evidenceUrl: editEvidenceUrl,
          })
      setSubmission(updated || { ...submission, content: editContent, evidenceUrl: editEvidenceUrl })
      setIsCreateMode(false)
      setIsEditing(false)
      message.success(isCreateMode ? 'Gửi phản hồi thành công.' : 'Cập nhật phản hồi thành công.')
    } catch (err) {
      message.error(err?.message || (isCreateMode ? 'Không thể gửi phản hồi.' : 'Không thể cập nhật phản hồi.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartEdit = () => {
    if (isLockedApproved) {
      message.warning('Phản hồi đã được duyệt, không thể chỉnh sửa.')
      return
    }
    setEditContent(submission?.content || '')
    setEditEvidenceUrl(submission?.evidenceUrl || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (isCreateMode) {
      setEditContent('')
      setEditEvidenceUrl('')
      setIsEditing(false)
      return
    }
    setEditContent(submission?.content || '')
    setEditEvidenceUrl(submission?.evidenceUrl || '')
    setIsEditing(false)
  }

  const evidenceTrimmed = submission?.evidenceUrl?.trim() || ''
  const evidenceIsLink = looksLikeHttpUrl(evidenceTrimmed)

  return (
    <div className={u.detailRoot}>
      <section className={u.surfaceCard} aria-labelledby="httt-event-title">
        <header className={u.heroHeader}>
          <div className={u.heroTopRow}>
            <span className={u.kindPill}>Hỗ trợ truyền thông</span>
          </div>
          <h1 id="httt-event-title" className={u.heroTitle}>
            {data?.title || 'Chi tiết nhiệm vụ'}
          </h1>
        </header>
        <div className={u.cardBody}>
          <div className={u.infoGrid}>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Trạng thái</span>
              <span
                className={`${styles.statusBadge} ${styles[`statusBadge_${statusVariant}`] || ''}`}
              >
                {statusText}
              </span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Điểm</span>
              <span className={u.infoValue}>
                <Trophy size={18} weight="fill" color="#ca8a04" aria-hidden />
                {data?.point ?? 0}
              </span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Học kỳ</span>
              <span className={u.infoValue}>
                <Clock size={18} weight="bold" />
                {semesterDisplay}
              </span>
            </div>
          </div>
          {data?.description ? (
            <div className={u.descriptionSection}>
              <h2 className={u.sectionHeading}>Nội dung chi tiết</h2>
              <p className={u.descriptionText}>{data.description}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className={u.surfaceCard} aria-labelledby="httt-submission-heading">
        <div className={u.cardHeaderBar}>
          <h2 id="httt-submission-heading" className={u.cardHeaderTitle}>
            Phản hồi sự kiện
          </h2>
        </div>
        <div className={`${u.cardBody} ${u.submissionStack}`}>

          {submissionLoading ? (
            <p className={styles.loadingHint}>Đang tải phản hồi…</p>
          ) : (
            <>
              {isCreateMode && (
                <div className={styles.instructionCallout} role="note">
                  Hãy thực hiện theo hướng dẫn trên và gửi phản hồi theo mẫu dưới đây.
                </div>
              )}

              {isCreateMode && !isEditing ? (
                <div className={styles.inviteActions}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={styles.primaryInviteBtn}
                  >
                    Gửi phản hồi
                  </button>
                </div>
              ) : null}

              {isEditing && !isLockedApproved ? (
                <div className={u.formStack}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="httt-feedback-content">
                      Nội dung phản hồi
                    </label>
                    <textarea
                      id="httt-feedback-content"
                      rows={5}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Nhập nội dung phản hồi..."
                      className={styles.textarea}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="httt-feedback-evidence">
                      Minh chứng (URL)
                    </label>
                    <input
                      id="httt-feedback-evidence"
                      type="text"
                      value={editEvidenceUrl}
                      onChange={(e) => setEditEvidenceUrl(e.target.value)}
                      placeholder="https://..."
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.actions}>
                    <button type="button" onClick={handleCancelEdit} className={styles.secondaryBtn}>
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSubmission}
                      disabled={isSaving}
                      className={styles.saveBtn}
                    >
                      {isSaving ? 'Đang lưu...' : isCreateMode ? 'Gửi phản hồi' : 'Lưu phản hồi'}
                    </button>
                  </div>
                </div>
              ) : null}

              {!isEditing && submission ? (
                <div className={u.readonlyStack}>
                  <div className={`${u.submissionBanner} ${u.bannerSuccess}`}>
                    <CheckCircle size={24} weight="fill" />
                    <span>Đơn vị đã gửi phản hồi nhiệm vụ này thành công.</span>
                  </div>

                  <div className={u.readonlyBlock}>
                    <div className={u.readonlyLabel}>
                      <NotePencil size={18} weight="bold" />
                      Nội dung phản hồi
                    </div>
                    <p className={u.readonlyBody}>{submission?.content?.trim() || '—'}</p>
                  </div>
                  <div className={u.readonlyBlock}>
                    <div className={u.readonlyLabel}>
                      <LinkIcon size={18} weight="bold" />
                      Minh chứng đính kèm
                    </div>
                    {evidenceIsLink ? (
                      <a
                        href={evidenceTrimmed}
                        className={u.evidenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={18} />
                        {evidenceTrimmed}
                      </a>
                    ) : evidenceTrimmed ? (
                      <p className={u.readonlyBody}>{evidenceTrimmed}</p>
                    ) : (
                      <p className={u.readonlyMuted}>Chưa có minh chứng</p>
                    )}
                  </div>
                  {isLockedApproved ? (
                    <p className={styles.readonlyHint}>Phản hồi đã được duyệt, không thể chỉnh sửa.</p>
                  ) : (
                    <div className={u.editActionRow}>
                      <button type="button" onClick={handleStartEdit} className={styles.secondaryBtn}>
                        Sửa phản hồi
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
