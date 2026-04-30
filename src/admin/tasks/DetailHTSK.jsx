import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { Users, NotePencil, Clock, CheckCircle, Warning, CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'
import { ApiError } from '../../service/apiClient'
import {
  fetchAllUnitMembersRosterForHtsk,
  getStaffHtskSubmission,
  listUnitMembersForHtsk,
  postStaffHtskSubmission,
  putStaffHtskSubmission,
} from '../../service/UnitHTSKService'
import styles from './detailCommon.module.css'
import u from './DetailHTSK.module.css'

const PAGE_SIZE = 50

function pickListMsv(record) {
  if (!record || typeof record !== 'object') return []
  const raw = record.list_MSV ?? record.list_msv ?? record.listMsv ?? record.list_user_id ?? record.listUserId
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const s of raw) {
    const id = String(s).trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function pickContent(record) {
  if (!record || typeof record !== 'object') return ''
  return record.content ?? record.note ?? ''
}

function compareStudentId(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'en', { numeric: true })
}

function parsePastedMsvLines(raw) {
  if (raw == null || typeof raw !== 'string') return []
  const seen = new Set()
  const out = []
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN')
}

export default function DetailHTSK({ data, unitId, taskId, semesterId, semesterDisplay }) {
  const [submission, setSubmission] = useState(null)
  const [submissionLoading, setSubmissionLoading] = useState(true)
  const [submissionError, setSubmissionError] = useState('')

  const [showRespondForm, setShowRespondForm] = useState(false)
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const [formStep, setFormStep] = useState('pick')

  const [members, setMembers] = useState([])
  const [membersTotal, setMembersTotal] = useState(0)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')

  const [pageIndex, setPageIndex] = useState(0)
  const [filterMsv, setFilterMsv] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [debouncedFilters, setDebouncedFilters] = useState({ msv: '', name: '', class: '' })

  const [selectedStudentIds, setSelectedStudentIds] = useState(() => new Set())
  const [selectedMeta, setSelectedMeta] = useState(() => ({}))

  const [contentDraft, setContentDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [pastedMsvText, setPastedMsvText] = useState('')
  const [rosterByStudentId, setRosterByStudentId] = useState(null)
  const [validatingReview, setValidatingReview] = useState(false)
  const [addMsvInput, setAddMsvInput] = useState('')
  const [submittedRows, setSubmittedRows] = useState([])
  const [submittedRowsLoading, setSubmittedRowsLoading] = useState(false)
  const [submittedRowsError, setSubmittedRowsError] = useState('')
  const isWaitingSubmission = submission?.status === 'WAITING'

  const loadSubmission = useCallback(async () => {
    if (!taskId || !unitId) {
      setSubmissionLoading(false)
      return
    }
    setSubmissionLoading(true)
    setSubmissionError('')
    try {
      const res = await getStaffHtskSubmission(taskId, unitId)
      setSubmission(res)
      if (res) setShowRespondForm(false)
      else setIsEditingExisting(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Không tải được phản hồi HTSK.'
      setSubmissionError(msg)
      setSubmission(null)
      setIsEditingExisting(false)
    } finally {
      setSubmissionLoading(false)
    }
  }, [taskId, unitId])

  useEffect(() => { loadSubmission() }, [loadSubmission])

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedFilters({
        msv: filterMsv.trim(),
        name: filterName.trim(),
        class: filterClass.trim(),
      })
      setPageIndex(0)
    }, 450)
    return () => clearTimeout(id)
  }, [filterMsv, filterName, filterClass])

  const loadMembers = useCallback(async () => {
    if (!unitId || !semesterId) {
      setMembers([]); setMembersTotal(0)
      setMembersError('Thiếu học kỳ hoặc đơn vị để tải danh sách thành viên.')
      return
    }
    setMembersLoading(true); setMembersError('')
    try {
      const skip = pageIndex * PAGE_SIZE
      const res = await listUnitMembersForHtsk(unitId, semesterId, {
        skip, limit: PAGE_SIZE,
        student_id: debouncedFilters.msv || undefined,
        full_name: debouncedFilters.name || undefined,
        class_name: debouncedFilters.class || undefined,
      })
      setMembers(res.items || [])
      setMembersTotal(Number(res.total) || 0)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Không tải được danh sách thành viên.'
      setMembersError(msg); setMembers([]); setMembersTotal(0)
    } finally { setMembersLoading(false) }
  }, [unitId, semesterId, pageIndex, debouncedFilters])

  useEffect(() => {
    if (!showRespondForm || formStep !== 'pick') return
    loadMembers()
  }, [showRespondForm, formStep, loadMembers])

  const submittedMsvSorted = useMemo(() => {
    const list = pickListMsv(submission)
    return [...list].sort(compareStudentId)
  }, [submission])

  const submittedContent = useMemo(() => pickContent(submission), [submission])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (submittedMsvSorted.length === 0) {
        setSubmittedRows([]); setSubmittedRowsError(''); setSubmittedRowsLoading(false)
        return
      }
      if (!unitId || !semesterId) {
        setSubmittedRows(submittedMsvSorted.map(id => ({ student_id: id, full_name: '—', class_name: '—', missing: true })))
        setSubmittedRowsLoading(false); return
      }
      setSubmittedRowsLoading(true); setSubmittedRowsError('')
      try {
        const { byStudentId } = await fetchAllUnitMembersRosterForHtsk(unitId, semesterId)
        if (cancelled) return
        const missing = []
        const rows = submittedMsvSorted.map(id => {
          const m = byStudentId[id]
          if (!m) { missing.push(id); return { student_id: id, full_name: '—', class_name: '—', missing: true } }
          return { student_id: id, full_name: m.full_name || '—', class_name: m.class_name || '—', missing: false }
        })
        setSubmittedRows(rows)
        if (missing.length > 0) {
          setSubmittedRowsError(`Không tìm thấy trong roster hiện tại: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`)
        }
      } catch (err) {
        if (cancelled) return
        setSubmittedRowsError(err?.message || 'Lỗi tải dữ liệu sinh viên.')
      } finally { if (!cancelled) setSubmittedRowsLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [submittedMsvSorted, unitId, semesterId])

  const totalPages = Math.max(1, Math.ceil(membersTotal / PAGE_SIZE) || 1)
  const safePage = Math.min(pageIndex, Math.max(0, totalPages - 1))

  const toggleStudent = (m) => {
    const id = m.student_id?.trim()
    if (!id) return
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelectedMeta(prev => {
      const next = { ...prev }
      if (selectedStudentIds.has(id)) delete next[id]
      else next[id] = { full_name: m.full_name || '', class_name: m.class_name || '' }
      return next
    })
  }

  const handleOpenRespond = (editing = false) => {
    const canEditExisting = editing && Boolean(submission)
    const initialIds = canEditExisting ? pickListMsv(submission) : []
    const initialContent = canEditExisting ? pickContent(submission) : ''
    const initialMeta = {}
    if (canEditExisting) {
      for (const row of submittedRows) {
        const id = String(row?.student_id || '').trim()
        if (!id) {
          continue
        }
        initialMeta[id] = {
          full_name: row?.full_name || '',
          class_name: row?.class_name || '',
        }
      }
    }
    setShowRespondForm(true)
    setIsEditingExisting(canEditExisting)
    setFormStep('pick')
    setPageIndex(0)
    setFilterMsv('')
    setFilterName('')
    setFilterClass('')
    setDebouncedFilters({ msv: '', name: '', class: '' })
    setSelectedStudentIds(new Set(initialIds))
    setSelectedMeta(initialMeta)
    setContentDraft(initialContent)
    setPastedMsvText('')
    setRosterByStudentId(null)
    setAddMsvInput('')
  }

  const handleGoReview = async () => {
    const fromPaste = parsePastedMsvLines(pastedMsvText)
    const combined = new Set([...selectedStudentIds, ...fromPaste])
    if (combined.size === 0) { message.warning('Vui lòng chọn hoặc dán ít nhất một MSV.'); return }
    setValidatingReview(true)
    try {
      const { byStudentId } = await fetchAllUnitMembersRosterForHtsk(unitId, semesterId)
      setRosterByStudentId(byStudentId)
      const unmatched = [...combined].filter(id => !byStudentId[id])
      if (unmatched.length > 0) {
        message.error(`MSV không tồn tại trong đơn vị: ${unmatched.slice(0, 10).join(', ')}...`)
        return
      }
      const meta = {}
      combined.forEach(id => {
        const m = byStudentId[id]
        meta[id] = { full_name: m?.full_name || '', class_name: m?.class_name || '' }
      })
      setSelectedStudentIds(combined); setSelectedMeta(meta); setFormStep('review')
    } catch (err) { message.error(err?.message || 'Lỗi kiểm tra MSV.') }
    finally { setValidatingReview(false) }
  }

  const handleAddMsvInReview = () => {
    const ids = parsePastedMsvLines(addMsvInput)
    if (!ids.length || !rosterByStudentId) return
    const invalid = ids.filter(id => !rosterByStudentId[id])
    if (invalid.length) { message.error(`MSV không hợp lệ: ${invalid.slice(0, 5).join(', ')}`); return }
    const toAdd = ids.filter(id => !selectedStudentIds.has(id))
    if (!toAdd.length) { message.info('MSV đã có trong danh sách.'); return }
    setSelectedStudentIds(prev => new Set([...prev, ...toAdd]))
    setSelectedMeta(prev => {
      const next = { ...prev }
      toAdd.forEach(id => {
        const m = rosterByStudentId[id]
        next[id] = { full_name: m.full_name, class_name: m.class_name }
      })
      return next
    })
    setAddMsvInput(''); message.success(`Đã thêm ${toAdd.length} MSV.`)
  }

  const handleSubmit = async () => {
    const list_MSV = Array.from(selectedStudentIds).sort(compareStudentId)
    const content = contentDraft.trim()
    if (!list_MSV.length) { message.warning('Chọn ít nhất một MSV.'); return }
    if (!content) { message.warning('Nội dung phản hồi không được để trống.'); return }
    setSubmitting(true)
    try {
      if (isEditingExisting) await putStaffHtskSubmission({ unitEventId: taskId, unitId, content, list_MSV })
      else await postStaffHtskSubmission({ unitEventId: taskId, unitId, content, list_MSV })
      message.success('Đã gửi phản hồi thành công.'); await loadSubmission()
    } catch (err) { message.error(err?.message || 'Gửi phản hồi thất bại.') }
    finally { setSubmitting(false) }
  }

  const handleCopyStudentRegistrationLink = async () => {
    const shareUrl = `${window.location.origin}/events/u/${unitId}/${taskId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      message.success('Đã sao chép link đăng ký cho sinh viên.')
    } catch {
      message.error('Không thể sao chép link. Vui lòng thử lại.')
    }
  }

  const { statusText, statusVariant } = useMemo(() => {
    if (submissionLoading) return { statusText: 'Đang tải…', statusVariant: 'loading' }
    if (!submission) return { statusText: 'Chưa phản hồi', statusVariant: 'empty' }
    if (submission?.status === 'WAITING') {
      return { statusText: 'Đang chờ đăng ký', statusVariant: 'pending' }
    }
    return { statusText: 'Đã phản hồi', statusVariant: 'approved' }
  }, [submission, submissionLoading])

  return (
    <div className={u.detailRoot}>
      <section className={u.surfaceCard}>
        <header className={u.heroHeader}>
          <div className={u.heroTopRow}>
            <span className={u.kindPill}>Hỗ trợ sự kiện</span>
          </div>
          <h1 className={u.heroTitle}>{data?.title || 'Chi tiết nhiệm vụ'}</h1>
        </header>
        <div className={u.cardBody}>
          <div className={u.infoGrid}>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Trạng thái</span>
              <span className={`${styles.statusBadge} ${styles[`statusBadge_${statusVariant}`] || ''}`}>
                {statusText}
              </span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Học kỳ</span>
              <span className={u.infoValue}><Clock size={18} /> {semesterDisplay}</span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Điểm</span>
              <span className={u.infoValue}>{data?.point ?? 0}</span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Thời gian diễn ra</span>
              <span className={u.infoValue}>
                {formatDateTime(data?.event_start)} - {formatDateTime(data?.event_end)}
              </span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>Thời gian đăng ký</span>
              <span className={u.infoValue}>
                {formatDateTime(data?.registration_start)} - {formatDateTime(data?.registration_end)}
              </span>
            </div>
            <div className={u.infoItem}>
              <span className={u.infoLabel}>SV chủ động đăng ký</span>
              <span className={u.infoValue}>{data?.is_student_registration ? 'Có' : 'Không'}</span>
            </div>
            {data?.is_student_registration ? (
              <div className={u.infoItem}>
                <span className={u.infoLabel}>Giới hạn SV/đơn vị</span>
                <span className={u.infoValue}>
                  {data?.limit_student_registration_in_one_unit ?? '—'}
                </span>
              </div>
            ) : null}
          </div>
          {data?.is_student_registration ? (
            <div
              className={u.readonlyBlock}
              style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}
            >
              <div className={u.readonlyLabel}>Đăng ký sinh viên theo link</div>
              <p className={u.descriptionText} style={{ marginBottom: '0.75rem' }}>
                Hãy gửi link sau cho các thành viên thuộc đơn vị của bạn để họ đăng ký.
              </p>
              <button className={u.primaryBtn} onClick={handleCopyStudentRegistrationLink}>
                Sao chép link đăng ký
              </button>
            </div>
          ) : null}
          {data?.description && (
            <div className={u.descriptionSection}>
              <h2 className={u.sectionHeading}>Mô tả nhiệm vụ</h2>
              <p className={u.descriptionText}>{data.description}</p>
            </div>
          )}
        </div>
      </section>

      <section className={u.surfaceCard}>
        <div className={u.cardHeaderBar}>
          <h2 className={u.cardHeaderTitle}>Phản hồi đơn vị</h2>
          {submission && !showRespondForm && !isWaitingSubmission && (
            <button className={u.primaryBtn} onClick={() => handleOpenRespond(true)}>Chỉnh sửa</button>
          )}
        </div>
        <div className={u.cardBody}>
          {submissionLoading ? <p className={u.loading}>Đang tải phản hồi...</p> : 
           submissionError ? <p className={u.errorText}>{submissionError}</p> :
           !showRespondForm && submission ? (
             <div className={u.submissionView}>
               <div className={`${u.submissionBanner} ${isWaitingSubmission ? u.bannerInfo : u.bannerSuccess}`}>
                 <CheckCircle size={24} weight="fill" />
                 <span>
                   {isWaitingSubmission
                     ? 'Đang trong thời gian đợi sinh viên đăng ký. Danh sách sẽ tự động nộp khi hết thời gian đăng ký sự kiện. Bạn không có quyền sửa danh sách này.'
                     : 'Đơn vị đã gửi phản hồi nhiệm vụ này thành công.'}
                 </span>
               </div>

               <div className={u.readonlyBlock}>
                 <div className={u.readonlyLabel}>
                   <NotePencil size={18} weight="bold" />
                   Nội dung phản hồi từ đơn vị
                 </div>
                 <p className={u.readonlyBody}>{submittedContent || '—'}</p>
               </div>

               <div className={u.readonlyBlock}>
                 <div className={u.readonlyLabel}>
                   <Users size={18} weight="bold" />
                   Danh sách đoàn viên tham gia ({submittedMsvSorted.length})
                 </div>
                 {submittedRowsLoading ? (
                   <div className={u.loading}>
                     <Clock size={24} className="spin-slow" />
                     <p>Đang đối chiếu dữ liệu thành viên...</p>
                   </div>
                 ) : (
                   <div className={u.memberTableWrap}>
                     <table className={u.memberTable}>
                       <thead>
                         <tr>
                           <th>MSV</th>
                           <th>Họ tên</th>
                           <th>Lớp</th>
                         </tr>
                       </thead>
                       <tbody>
                         {submittedRows.map(row => (
                           <tr key={row.student_id}>
                             <td>
                               <span style={{ fontWeight: 800, color: '#2563eb' }}>
                                 {row.student_id}
                               </span>
                             </td>
                             <td style={{ fontWeight: 600 }}>{row.full_name}</td>
                             <td>{row.class_name}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
             </div>
           ) : !showRespondForm ? (
             <div style={{ textAlign: 'center', padding: '1rem 0' }}>
               <p className={u.descriptionText}>Đơn vị chưa phản hồi nhiệm vụ này.</p>
               <button className={u.primaryBtn} style={{ marginTop: '1rem' }} onClick={() => handleOpenRespond()}>Gửi phản hồi ngay</button>
             </div>
           ) : formStep === 'pick' ? (
             <div className={u.formStack}>
                <div className={u.callout}>
                  Chọn đoàn viên từ danh sách hoặc dán danh sách mã sinh viên vào ô dưới đây.
                </div>
                <div className={u.filterRow}>
                  <div className={u.filterField}>
                    <span className={u.filterLabel}>MSV</span>
                    <input className={u.filterInput} value={filterMsv} onChange={e => setFilterMsv(e.target.value)} placeholder="Tìm MSV..." />
                  </div>
                  <div className={u.filterField}>
                    <span className={u.filterLabel}>Họ tên</span>
                    <input className={u.filterInput} value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Tìm tên..." />
                  </div>
                </div>
                <div className={u.pasteBlock}>
                  <span className={u.pasteLabel}>Dán danh sách MSV</span>
                  <textarea className={u.pasteTextarea} value={pastedMsvText} onChange={e => setPastedMsvText(e.target.value)} placeholder="B20DCCN001&#10;B20DCCN002..." />
                </div>
                <div className={u.selectedBar}>
                  <span>Đã chọn: <strong>{selectedStudentIds.size + parsePastedMsvLines(pastedMsvText).length}</strong> sinh viên</span>
                </div>
                {membersLoading ? <p className={u.loading}>Đang tải danh sách...</p> : (
                  <div className={u.memberTableWrap}>
                    <table className={u.memberTable}>
                      <thead><tr><th style={{width: 40}}></th><th>MSV</th><th>Họ tên</th><th>Lớp</th></tr></thead>
                      <tbody>
                        {members.map(m => (
                          <tr key={m.student_id} onClick={() => toggleStudent(m)} style={{ cursor: 'pointer' }}>
                            <td><input type="checkbox" checked={selectedStudentIds.has(m.student_id)} readOnly /></td>
                            <td>{m.student_id}</td>
                            <td>{m.full_name}</td>
                            <td>{m.class_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className={u.pagination}>
                  <button className={u.pageBtn} disabled={safePage === 0} onClick={() => setPageIndex(p => p - 1)}><CaretLeft /></button>
                  <span>Trang {safePage + 1} / {totalPages}</span>
                  <button className={u.pageBtn} disabled={safePage >= totalPages - 1} onClick={() => setPageIndex(p => p + 1)}><CaretRight /></button>
                </div>
                <div className={u.actions}>
                  <button className={u.secondaryBtn} onClick={() => setShowRespondForm(false)}>Hủy</button>
                  <button className={u.primaryBtn} onClick={handleGoReview} disabled={validatingReview}>Tiếp tục</button>
                </div>
             </div>
           ) : (
             <div className={u.formStack}>
                <h3 className={u.sectionHeading}>Xem lại và Gửi</h3>
                <div className={u.readonlyBlock}>
                  <span className={u.readonlyLabel}>Nội dung phản hồi</span>
                  <textarea className={u.pasteTextarea} value={contentDraft} onChange={e => setContentDraft(e.target.value)} placeholder="Nhập nội dung phản hồi công việc..." />
                </div>
                <div className={u.addMsvRow}>
                  <input className={u.filterInput} style={{ flex: 1 }} value={addMsvInput} onChange={e => setAddMsvInput(e.target.value)} placeholder="Thêm MSV nhanh..." />
                  <button className={u.secondaryBtn} onClick={handleAddMsvInReview}><Plus /></button>
                </div>
                <div className={u.memberTableWrap} style={{ maxHeight: 300 }}>
                  <table className={u.memberTable}>
                    <thead><tr><th>MSV</th><th>Họ tên</th><th>Lớp</th><th style={{ width: 60 }}></th></tr></thead>
                    <tbody>
                      {Array.from(selectedStudentIds).sort(compareStudentId).map(id => (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{selectedMeta[id]?.full_name || '—'}</td>
                          <td>{selectedMeta[id]?.class_name || '—'}</td>
                          <td><button className={u.errorText} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => {
                            setSelectedStudentIds(prev => { const n = new Set(prev); n.delete(id); return n })
                          }}>Xóa</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={u.actions}>
                  <button className={u.secondaryBtn} onClick={() => setFormStep('pick')}>Quay lại</button>
                  <button className={u.primaryBtn} onClick={handleSubmit} disabled={submitting}>{submitting ? 'Đang gửi...' : 'Xác nhận và Gửi'}</button>
                </div>
             </div>
           )
          }
        </div>
      </section>
    </div>
  )
}
