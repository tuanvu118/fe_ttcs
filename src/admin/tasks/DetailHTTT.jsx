import { useEffect, useMemo, useState } from 'react'
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
            err?.status === 404 ||
            /not\s*found/i.test(String(err?.message || ''))
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

  return (
    <div className={styles.stack}>
      <section className={`page-card ${styles.card}`}>
        <h1 className={styles.title}>{data?.title || ''}</h1>
        <p className={styles.paragraph}>{data?.description || ''}</p>
        <p className={styles.line}>
          <strong>Điểm:</strong> {data?.point ?? 0}
        </p>
        <p className={styles.line}>
          <strong>Học kỳ:</strong> {semesterDisplay}
        </p>
      </section>

      <section className={`page-card ${styles.card}`}>
        <h2 className={styles.subTitle}>Phản hồi sự kiện</h2>

        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>Trạng thái phản hồi</span>
          <span
            className={`${styles.statusBadge} ${styles[`statusBadge_${statusVariant}`] || ''}`}
          >
            {statusText}
          </span>
        </div>

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

            {isEditing ? (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Nội dung phản hồi</label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    className={styles.textarea}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Minh chứng (URL)</label>
                  <input
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
              </>
            ) : null}

            {!isEditing && submission ? (
              <>
                <p className={styles.line}>
                  <strong>Nội dung phản hồi:</strong> {submission?.content || 'Chưa có phản hồi'}
                </p>
                <p className={styles.line}>
                  <strong>Minh chứng:</strong> {submission?.evidenceUrl || 'Chưa có minh chứng'}
                </p>
                <div>
                  <button type="button" onClick={handleStartEdit} className={styles.secondaryBtn}>
                    Sửa phản hồi
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
