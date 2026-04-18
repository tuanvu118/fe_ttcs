import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { ApiError } from '../../service/apiClient'
import {
  fetchAllUnitMembersRosterForHtsk,
  getStaffHtskSubmission,
  listUnitMembersForHtsk,
  postStaffHtskSubmission,
  putStaffHtskSubmission,
} from '../../service/UnitHTSKService'
import u from './DetailHTSK.module.css'

const PAGE_SIZE = 50

function pickListMsv(record) {
  if (!record || typeof record !== 'object') {
    return []
  }
  const raw = record.list_MSV ?? record.list_msv ?? record.listMsv ?? record.list_user_id ?? record.listUserId
  if (!Array.isArray(raw)) {
    return []
  }
  const seen = new Set()
  const out = []
  for (const s of raw) {
    const id = String(s).trim()
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    out.push(id)
  }
  return out
}

function pickContent(record) {
  if (!record || typeof record !== 'object') {
    return ''
  }
  const c = record.content ?? record.note ?? ''
  return c != null ? String(c) : ''
}

/** Sắp MSV kiểu 001…009…010… */
function compareStudentId(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'en', { numeric: true })
}

/** Paste: one MSV per line; skip empty and duplicates. */
function parsePastedMsvLines(raw) {
  if (raw == null || typeof raw !== 'string') {
    return []
  }
  const seen = new Set()
  const out = []
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || seen.has(t)) {
      continue
    }
    seen.add(t)
    out.push(t)
  }
  return out
}

export default function DetailHTSK({ data, unitId, taskId, semesterId, semesterDisplay }) {
  const [submission, setSubmission] = useState(null)
  const [submissionLoading, setSubmissionLoading] = useState(true)
  const [submissionError, setSubmissionError] = useState('')

  const [showRespondForm, setShowRespondForm] = useState(false)
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  /** Chọn đoàn viên → xem lại + nội dung → gửi */
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
  /** MSV → meta hiển thị bước xem lại (giữ cả khi đổi trang / lọc) */
  const [selectedMeta, setSelectedMeta] = useState(() => ({}))

  const [contentDraft, setContentDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [pastedMsvText, setPastedMsvText] = useState('')
  /** Full roster by student_id after Continue (for add-MSV on review). */
  const [rosterByStudentId, setRosterByStudentId] = useState(null)
  const [validatingReview, setValidatingReview] = useState(false)
  const [addMsvInput, setAddMsvInput] = useState('')
  const [submittedRows, setSubmittedRows] = useState([])
  const [submittedRowsLoading, setSubmittedRowsLoading] = useState(false)
  const [submittedRowsError, setSubmittedRowsError] = useState('')

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
      if (res) {
        setShowRespondForm(false)
      } else {
        setIsEditingExisting(false)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err?.message || 'Không tải được phản hồi HTSK.'
      setSubmissionError(msg)
      setSubmission(null)
      setIsEditingExisting(false)
    } finally {
      setSubmissionLoading(false)
    }
  }, [taskId, unitId])

  useEffect(() => {
    loadSubmission()
  }, [loadSubmission])

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
      setMembers([])
      setMembersTotal(0)
      setMembersError('Thiếu học kỳ hoặc đơn vị để tải danh sách thành viên.')
      return
    }
    setMembersLoading(true)
    setMembersError('')
    try {
      const skip = pageIndex * PAGE_SIZE
      const res = await listUnitMembersForHtsk(unitId, semesterId, {
        skip,
        limit: PAGE_SIZE,
        student_id: debouncedFilters.msv || undefined,
        full_name: debouncedFilters.name || undefined,
        class_name: debouncedFilters.class || undefined,
      })
      setMembers(res.items || [])
      setMembersTotal(Number(res.total) || 0)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err?.message || 'Không tải được danh sách thành viên.'
      setMembersError(msg)
      setMembers([])
      setMembersTotal(0)
    } finally {
      setMembersLoading(false)
    }
  }, [unitId, semesterId, pageIndex, debouncedFilters.msv, debouncedFilters.name, debouncedFilters.class])

  useEffect(() => {
    if (!showRespondForm || formStep !== 'pick') {
      return
    }
    loadMembers()
  }, [showRespondForm, formStep, loadMembers])

  const submittedMsv = useMemo(() => pickListMsv(submission), [submission])
  const submittedMsvSorted = useMemo(
    () => [...submittedMsv].sort((x, y) => compareStudentId(x, y)),
    [submittedMsv],
  )
  const submittedContent = useMemo(() => pickContent(submission), [submission])
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (submittedMsvSorted.length === 0) {
        setSubmittedRows([])
        setSubmittedRowsError('')
        setSubmittedRowsLoading(false)
        return
      }
      if (!unitId || !semesterId) {
        setSubmittedRows(
          submittedMsvSorted.map((id) => ({ student_id: id, full_name: '—', class_name: '—', missing: true })),
        )
        setSubmittedRowsError('')
        setSubmittedRowsLoading(false)
        return
      }
      setSubmittedRowsLoading(true)
      setSubmittedRowsError('')
      try {
        const { byStudentId } = await fetchAllUnitMembersRosterForHtsk(unitId, semesterId)
        if (cancelled) {
          return
        }
        const missing = []
        const rows = submittedMsvSorted.map((id) => {
          const m = byStudentId[id]
          if (!m) {
            missing.push(id)
            return { student_id: id, full_name: '—', class_name: '—', missing: true }
          }
          return {
            student_id: id,
            full_name: m.full_name || '—',
            class_name: m.class_name || '—',
            missing: false,
          }
        })
        setSubmittedRows(rows)
        if (missing.length > 0) {
          const preview = missing.slice(0, 10).join(', ')
          const more = missing.length > 10 ? ` (+${missing.length - 10} mã khác)` : ''
          setSubmittedRowsError(`Không tìm thấy trong roster hiện tại: ${preview}${more}`)
        }
      } catch (err) {
        if (cancelled) {
          return
        }
        const msg =
          err instanceof ApiError ? err.message : err?.message || 'Không tải được dữ liệu sinh viên đã phản hồi.'
        setSubmittedRowsError(msg)
        setSubmittedRows(
          submittedMsvSorted.map((id) => ({ student_id: id, full_name: '—', class_name: '—', missing: true })),
        )
      } finally {
        if (!cancelled) {
          setSubmittedRowsLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [submittedMsvSorted, unitId, semesterId])

  const sortedMembers = useMemo(
    () => [...members].sort((x, y) => compareStudentId(x.student_id, y.student_id)),
    [members],
  )

  const totalPages = Math.max(1, Math.ceil(membersTotal / PAGE_SIZE) || 1)
  const safePage = Math.min(pageIndex, Math.max(0, totalPages - 1))
  const pageLabelFrom = membersTotal === 0 ? 0 : safePage * PAGE_SIZE + 1
  const pageLabelTo = membersTotal === 0 ? 0 : Math.min(membersTotal, (safePage + 1) * PAGE_SIZE)

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const toggleStudent = (m) => {
    const id = m.student_id?.trim()
    if (!id) {
      return
    }
    setSelectedStudentIds((prevIds) => {
      const wasSelected = prevIds.has(id)
      const nextIds = new Set(prevIds)
      if (wasSelected) {
        nextIds.delete(id)
      } else {
        nextIds.add(id)
      }
      setSelectedMeta((prevMeta) => {
        const nextMeta = { ...prevMeta }
        if (wasSelected) {
          delete nextMeta[id]
        } else {
          nextMeta[id] = {
            full_name: m.full_name || '',
            class_name: m.class_name || '',
          }
        }
        return nextMeta
      })
      return nextIds
    })
  }

  const removeSelected = (studentId) => {
    const id = String(studentId || '').trim()
    if (!id) {
      return
    }
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setSelectedMeta((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const hasExistingSubmission = submission != null && !submissionLoading && !submissionError

  const handleOpenRespond = (editing = false) => {
    if (editing && !hasExistingSubmission) {
      return
    }
    const initialIds = editing ? pickListMsv(submission) : []
    const initialContent = editing ? pickContent(submission) : ''
    const initialMeta = {}
    if (editing) {
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
    setIsEditingExisting(editing)
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
    const combined = new Set()
    for (const id of selectedStudentIds) {
      combined.add(id)
    }
    for (const id of fromPaste) {
      combined.add(id)
    }

    if (combined.size === 0) {
      message.warning('Chọn trên bảng hoặc dán ít nhất một mã sinh viên (mỗi dòng một MSV).')
      return
    }

    if (!unitId || !semesterId) {
      message.error('Thiếu đơn vị hoặc học kỳ.')
      return
    }

    setValidatingReview(true)
    try {
      const { byStudentId } = await fetchAllUnitMembersRosterForHtsk(unitId, semesterId)
      setRosterByStudentId(byStudentId)

      const unmatched = [...combined].filter((id) => !byStudentId[id])
      if (unmatched.length > 0) {
        const preview = unmatched.slice(0, 15).join(', ')
        const more = unmatched.length > 15 ? ` (+${unmatched.length - 15} mã khác)` : ''
        message.error(
          `Các MSV sau không tồn tại trong đơn vị ở học kỳ này (hoặc chưa là thành viên): ${preview}${more}`,
        )
        return
      }

      const meta = {}
      for (const id of combined) {
        const m = byStudentId[id]
        meta[id] = {
          full_name: m?.full_name || '',
          class_name: m?.class_name || '',
        }
      }
      setSelectedStudentIds(new Set(combined))
      setSelectedMeta(meta)
      setFormStep('review')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err?.message || 'Không tải được danh sách để kiểm tra MSV.'
      message.error(msg)
    } finally {
      setValidatingReview(false)
    }
  }

  const handleAddMsvInReview = () => {
    const ids = parsePastedMsvLines(addMsvInput)
    if (ids.length === 0) {
      message.warning('Nhập ít nhất một mã sinh viên (mỗi dòng một mã).')
      return
    }
    const roster = rosterByStudentId
    if (!roster) {
      message.error('Chưa có dữ liệu thành viên để đối chiếu.')
      return
    }

    const invalid = []
    const alreadySelected = []
    const toAdd = []
    for (const id of ids) {
      if (!roster[id]) {
        invalid.push(id)
      } else if (selectedStudentIds.has(id)) {
        alreadySelected.push(id)
      } else {
        toAdd.push(id)
      }
    }

    if (invalid.length > 0) {
      const preview = invalid.slice(0, 10).join(', ')
      const more = invalid.length > 10 ? ` (+${invalid.length - 10} mã khác)` : ''
      message.error(`MSV không tồn tại trong đơn vị học kỳ này: ${preview}${more}`)
      return
    }

    if (toAdd.length === 0) {
      message.info('Các MSV dán vào đã có trong danh sách.')
      return
    }

    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      for (const id of toAdd) {
        next.add(id)
      }
      return next
    })
    setSelectedMeta((prev) => {
      const next = { ...prev }
      for (const id of toAdd) {
        const m = roster[id]
        next[id] = { full_name: m.full_name || '', class_name: m.class_name || '' }
      }
      return next
    })
    setAddMsvInput('')

    if (alreadySelected.length > 0) {
      const preview = alreadySelected.slice(0, 10).join(', ')
      const more = alreadySelected.length > 10 ? ` (+${alreadySelected.length - 10} mã khác)` : ''
      message.info(`Đã bỏ qua MSV trùng: ${preview}${more}`)
    } else {
      message.success(`Đã thêm ${toAdd.length} MSV.`)
    }
  }

  const handleSubmit = async () => {
    if (!taskId || !unitId) {
      message.error('Thiếu thông tin nhiệm vụ.')
      return
    }
    const list_MSV = Array.from(selectedStudentIds).sort(compareStudentId)
    if (list_MSV.length === 0) {
      message.warning('Chọn ít nhất một mã sinh viên.')
      return
    }
    const trimmedContent = String(contentDraft ?? '').trim()
    if (!trimmedContent) {
      message.warning('Nội dung phản hồi không được để trống.')
      return
    }
    setSubmitting(true)
    try {
      const shouldUpdate = isEditingExisting && hasExistingSubmission
      if (shouldUpdate) {
        await putStaffHtskSubmission({
          unitEventId: taskId,
          unitId,
          content: trimmedContent,
          list_MSV,
        })
      } else {
        await postStaffHtskSubmission({
          unitEventId: taskId,
          unitId,
          content: trimmedContent,
          list_MSV,
        })
      }
      setShowRespondForm(false)
      setIsEditingExisting(false)
      setFormStep('pick')
      message.success(shouldUpdate ? 'Đã cập nhật phản hồi HTSK.' : 'Đã gửi phản hồi HTSK.')
      await loadSubmission()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Gửi phản hồi thất bại.'
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const hasSubmission = hasExistingSubmission && !showRespondForm

  const reviewRows = useMemo(() => {
    return Array.from(selectedStudentIds)
      .sort(compareStudentId)
      .map((id) => ({
        student_id: id,
        full_name: selectedMeta[id]?.full_name || '—',
        class_name: selectedMeta[id]?.class_name || '—',
      }))
  }, [selectedStudentIds, selectedMeta])

  const selectedCount = selectedStudentIds.size
  const pastedLineCount = useMemo(() => parsePastedMsvLines(pastedMsvText).length, [pastedMsvText])
  const combinedPreviewCount = useMemo(() => {
    const fromPaste = new Set(parsePastedMsvLines(pastedMsvText))
    let n = fromPaste.size
    for (const id of selectedStudentIds) {
      if (!fromPaste.has(id)) {
        n += 1
      }
    }
    return n
  }, [pastedMsvText, selectedStudentIds])
  const canContinueToReview = combinedPreviewCount > 0

  return (
    <div className={u.root}>
      <section className={u.eventCard}>
        <h1 className={u.title}>{data?.title || 'Chi tiết nhiệm vụ'}</h1>
        <p className={u.meta}>{data?.description || ''}</p>
        <p className={u.meta}>
          <strong>Điểm:</strong> {data?.point ?? 0}
        </p>
        <p className={u.meta}>
          <strong>Học kỳ:</strong> {semesterDisplay}
        </p>
      </section>

      <section className={u.panel}>
        <h2 className={u.panelTitle}>Phản hồi HTSK</h2>

        {submissionLoading ? (
          <p className={u.loading}>Đang tải phản hồi…</p>
        ) : submissionError ? (
          <p className={u.errorText}>{submissionError}</p>
        ) : hasSubmission ? (
          <div>
            <div className={u.readonlyBlock}>
              <div className={u.readonlyLabel}>Nội dung</div>
              <p className={u.readonlyBody}>{submittedContent || '—'}</p>
            </div>
            <div className={u.readonlyBlock}>
              <div className={u.readonlyLabel}>Danh sách mã sinh viên</div>
              {submittedRowsLoading ? (
                <p className={u.loading}>Đang đối chiếu danh sách sinh viên…</p>
              ) : submittedRows.length ? (
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
                      {submittedRows.map((row) => (
                        <tr key={row.student_id}>
                          <td>{row.student_id}</td>
                          <td>{row.full_name}</td>
                          <td>{row.class_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={u.readonlyBody}>—</p>
              )}
              {submittedRowsError ? <p className={u.errorText}>{submittedRowsError}</p> : null}
            </div>
            <div className={u.actions}>
              <button
                type="button"
                className={u.primaryBtn}
                onClick={() => handleOpenRespond(true)}
                disabled={submittedRowsLoading}
              >
                Chỉnh sửa phản hồi
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={u.callout} role="status">
              {isEditingExisting
                ? 'Bạn đang chỉnh sửa phản hồi đã gửi. Có thể đổi danh sách MSV và nội dung, sau đó bấm gửi để cập nhật.'
                : 'Đơn vị chưa phản hồi sự kiện này. Bạn có thể chọn trên bảng và/hoặc dán danh sách MSV (mỗi dòng một mã). Khi bấm Tiếp tục, hệ thống sẽ tải đầy đủ danh sách thành viên của đơn vị trong học kỳ để kiểm tra hợp lệ trước khi gửi.'}
            </div>
            {!showRespondForm ? (
              <button type="button" className={u.primaryBtn} onClick={handleOpenRespond}>
                Phản hồi ngay
              </button>
            ) : formStep === 'pick' ? (
              <>
                <p className={u.filterHint}>
                  Lọc theo MSV, họ tên hoặc lớp.
                </p>
                <div className={u.filterRow}>
                  <label className={u.filterField}>
                    <span className={u.filterLabel}>MSV</span>
                    <input
                      className={u.filterInput}
                      value={filterMsv}
                      onChange={(e) => setFilterMsv(e.target.value)}
                      placeholder="Ví dụ B23DCCN002"
                      autoComplete="off"
                    />
                  </label>
                  <label className={u.filterField}>
                    <span className={u.filterLabel}>Họ tên</span>
                    <input
                      className={u.filterInput}
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Tên đoàn viên"
                      autoComplete="off"
                    />
                  </label>
                  <label className={u.filterField}>
                    <span className={u.filterLabel}>Lớp</span>
                    <input
                      className={u.filterInput}
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      placeholder="Mã lớp"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <div className={u.pasteBlock}>
                  <label className={u.pasteLabel} htmlFor="htsk-paste-msv">
                    Dán danh sách MSV (mỗi dòng một mã)
                  </label>
                  <textarea
                    id="htsk-paste-msv"
                    className={u.pasteTextarea}
                    value={pastedMsvText}
                    onChange={(e) => setPastedMsvText(e.target.value)}
                    placeholder={"Ví dụ:\nB23DCCN002\nB23DCCN015\nB23DCCN120"}
                  />
                </div>

                <div className={u.selectedBar}>
                  <span>
                    Trên bảng: <strong>{selectedCount}</strong>, Dòng dán: <strong>{pastedLineCount}</strong>, Dự kiến sau gộp:{' ' }
                    <strong>{combinedPreviewCount}</strong>
                  </span>
                  {membersTotal > 0 ? (
                    <span className={u.totalHint}>
                      Tổng trong học kỳ: <strong>{membersTotal}</strong> (theo bộ lọc hiện tại)
                    </span>
                  ) : null}
                </div>

                {membersLoading ? (
                  <p className={u.loading}>Đang tải danh sách…</p>
                ) : membersError ? (
                  <p className={u.errorText}>{membersError}</p>
                ) : (
                  <>
                    <div className={u.memberTableWrap}>
                      <table className={u.memberTable}>
                        <thead>
                          <tr>
                            <th style={{ width: '2.5rem' }}> </th>
                            <th>MSV</th>
                            <th>Họ tên</th>
                            <th>Lớp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMembers.map((m) => (
                            <tr key={m.user_id || m.student_id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.has(m.student_id)}
                                  onChange={() => toggleStudent(m)}
                                  disabled={!m.student_id}
                                  aria-label={`Chọn ${m.student_id || m.full_name}`}
                                />
                              </td>
                              <td>{m.student_id || '—'}</td>
                              <td>{m.full_name}</td>
                              <td>{m.class_name || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {members.length === 0 ? (
                        <p className={u.hint}>Không có bản ghi trên trang này (thử đổi bộ lọc hoặc trang).</p>
                      ) : null}
                    </div>

                    <div className={u.pagination}>
                      <button
                        type="button"
                        className={u.pageBtn}
                        disabled={safePage <= 0 || membersLoading}
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                      >
                        Trang trước
                      </button>
                      <span className={u.pageInfo}>
                        Trang <strong>{safePage + 1}</strong> / {totalPages} · hiển thị {pageLabelFrom}–{pageLabelTo}{' '}
                        / {membersTotal}
                      </span>
                      <button
                        type="button"
                        className={u.pageBtn}
                        disabled={safePage >= totalPages - 1 || membersLoading}
                        onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                      >
                        Trang sau
                      </button>
                    </div>
                  </>
                )}

                <div className={u.actions}>
                  <button
                    type="button"
                    className={u.secondaryBtn}
                    onClick={() => {
                      setShowRespondForm(false)
                      setIsEditingExisting(false)
                      setFormStep('pick')
                      setSelectedStudentIds(new Set())
                      setSelectedMeta({})
                      setContentDraft('')
                      setPastedMsvText('')
                      setRosterByStudentId(null)
                      setAddMsvInput('')
                      setPageIndex(0)
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className={u.primaryBtn}
                    onClick={handleGoReview}
                    disabled={submitting || membersLoading || validatingReview || !canContinueToReview}
                  >
                    {validatingReview ? 'Đang tải & kiểm tra…' : `Tiếp tục (${combinedPreviewCount})`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className={u.reviewTitle}>Xem lại danh sách trước khi gửi</h3>
                <p className={u.reviewHint}>
                  Kiểm tra danh sách MSV trước khi gửi. Bạn có thể xóa khỏi danh sách hoặc thêm MSV mới (MSV phải thuộc đơn vị trong học kỳ này).
                </p>
                <div className={u.addMsvRow}>
                  <textarea
                    className={u.addMsvInput}
                    value={addMsvInput}
                    onChange={(e) => setAddMsvInput(e.target.value)}
                    placeholder={'Dán danh sách MSV (mỗi dòng một mã)\nVí dụ:\nB23DCCN002\nB23DCCN003'}
                    rows={4}
                    spellCheck={false}
                  />
                  <button type="button" className={u.pageBtn} onClick={handleAddMsvInReview}>
                    Thêm
                  </button>
                </div>

                <div className={u.reviewTableWrap}>
                  <table className={u.memberTable}>
                    <thead>
                      <tr>
                        <th>MSV</th>
                        <th>Họ tên</th>
                        <th>Lớp</th>
                        <th style={{ width: '5rem' }}> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRows.map((row) => (
                        <tr key={row.student_id}>
                          <td>{row.student_id}</td>
                          <td>{row.full_name}</td>
                          <td>{row.class_name}</td>
                          <td>
                            <button
                              type="button"
                              className={u.linkishBtn}
                              onClick={() => removeSelected(row.student_id)}
                            >
                              Gỡ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reviewRows.length === 0 ? (
                    <p className={u.hint}>Chưa chọn đoàn viên nào - quay lại bước trước.</p>
                  ) : null}
                </div>

                <label className={u.readonlyLabel} htmlFor="htsk-content">
                  Nội dung phản hồi
                </label>
                <textarea
                  id="htsk-content"
                  className={u.textarea}
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                  placeholder="Ví dụ: Đơn vị nộp danh sách đoàn viên hỗ trợ sự kiện…"
                />

                <div className={u.actions}>
                  <button
                    type="button"
                    className={u.secondaryBtn}
                    onClick={() => setFormStep('pick')}
                    disabled={submitting}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className={u.primaryBtn}
                    onClick={handleSubmit}
                    disabled={submitting || reviewRows.length === 0}
                  >
                    {submitting ? 'Đang gửi…' : isEditingExisting ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
