/**
 * Ghép danh sách đơn vị được giao với danh sách phản hồi HTTT để render bảng "Đơn vị phối hợp".
 */

function getSubmissionUnitId(submission) {
  if (!submission || typeof submission !== 'object') {
    return ''
  }
  const direct =
    submission.unitId ||
    submission.unit_id ||
    (submission.unit && submission.unit.id)
  return direct != null && direct !== '' ? String(direct).trim() : ''
}

/**
 * Chuẩn hóa trạng thái phản hồi HTTT về PENDING | APPROVED | REJECTED.
 * Map từ giá trị API cũ: COMPLETED / COMPLED → APPROVED; REJECT / REJECTED → REJECTED.
 */
export function normalizeHtttSubmissionStatus(raw) {
  const s = String(raw || '').toUpperCase().trim()
  if (s === 'PENDING') {
    return 'PENDING'
  }
  if (s === 'APPROVED' || s === 'COMPLETED' || s === 'COMPLED') {
    return 'APPROVED'
  }
  if (s === 'REJECTED' || s === 'REJECT') {
    return 'REJECTED'
  }
  return ''
}

/** Nhãn hiển thị tiếng Việt (mã API: PENDING / APPROVED / REJECTED). */
export function getHtttSubmissionStatusLabel(status) {
  const n = normalizeHtttSubmissionStatus(status)
  if (!n) {
    return 'Chưa phản hồi'
  }
  if (n === 'PENDING') {
    return 'Chờ duyệt'
  }
  if (n === 'APPROVED') {
    return 'Đã duyệt'
  }
  if (n === 'REJECTED') {
    return 'Từ chối'
  }
  return n
}

/**
 * @param {Array<{ id?: string, name?: string, logo?: string|null, type?: string, introduction?: string|null }>} assignedUnits
 * @param {Array<Record<string, unknown>>} submissions
 * @returns {Array<{
 *   key: string,
 *   unitId: string,
 *   unit: { id: string, name: string, logo: string|null, type: string, introduction: string|null },
 *   hasSubmission: boolean,
 *   submission: Record<string, unknown>|null,
 *   status: 'NONE'|'PENDING'|'APPROVED'|'REJECTED',
 *   statusLabel: string,
 * }>}
 */
export function buildUnitEventCooperationRows(assignedUnits = [], submissions = []) {
  const list = Array.isArray(assignedUnits) ? assignedUnits : []
  const subs = Array.isArray(submissions) ? submissions : []

  const byUnitId = new Map()
  for (const sub of subs) {
    const uid = getSubmissionUnitId(sub)
    if (uid) {
      byUnitId.set(uid, sub)
    }
  }

  const rows = list.map((unit) => {
    const unitId = unit?.id != null ? String(unit.id).trim() : ''
    let submission = unitId ? byUnitId.get(unitId) : null

    if (!submission) {
      const name = String(unit?.name || '').trim()
      if (name) {
        const byName = subs.find(
          (s) =>
            !getSubmissionUnitId(s) &&
            String(s?.unit?.name || '').trim() === name,
        )
        if (byName) {
          submission = byName
        }
      }
    }

    const statusRaw = submission ? normalizeHtttSubmissionStatus(submission.status) : ''
    const status = !submission ? 'NONE' : statusRaw || 'PENDING'
    const statusLabel = !submission ? 'Chưa phản hồi' : getHtttSubmissionStatusLabel(status)
    const hasSubmission = Boolean(submission)

    return {
      key: unitId || `idx-${unit?.name || ''}`,
      unitId,
      unit: {
        id: unitId,
        name: unit?.name || '',
        logo: unit?.logo ?? null,
        type: unit?.type || '',
        introduction: unit?.introduction ?? null,
      },
      hasSubmission,
      submission: submission || null,
      status,
      statusLabel,
    }
  })

  return rows
}
