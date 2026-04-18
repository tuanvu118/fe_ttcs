/**
 * @fileoverview Staff — phản hồi nhiệm vụ **HTSK** (hỗ trợ sự kiện) theo đơn vị đang chọn.
 *
 * Mọi request dùng Bearer từ phiên đăng nhập và header **`X-Unit-Id`**: đơn vị
 * đang làm việc (ví dụ URL `/staff/:unitId/tasks/:taskId` → cùng `:unitId`).
 *
 * ---
 *
 * ### `GET /unit-event-submissions/HTSK?unit_event_id={unitEventId}`
 * Lấy phản hồi HTSK hiện có của đơn vị cho một sự kiện.
 *
 * - **200**: trả body JSON (tuỳ BE; thường có `content`, `list_MSV`, …).
 * - **404** với `detail` kiểu *"Đơn vị của bạn chưa phản hồi sự kiện này"*:
 *   coi là **chưa có phản hồi** → `getStaffHtskSubmission` trả về `null` (không ném lỗi).
 * - **404 / lỗi khác**: ném {@link ApiError} từ `apiClient`.
 *
 * ---
 *
 * ### `POST /unit-event-submissions/HTSK`
 * Gửi phản hồi mới. Body JSON:
 * ```json
 * {
 *   "unitEventId": "<id sự kiện>",
 *   "unitId": "<id đơn vị>",
 *   "content": "<mô tả>",
 *   "list_MSV": ["B23DCCN001", "..."]
 * }
 * ```
 *
 * ---
 *
 * ### Danh sách sinh viên để chọn MSV
 * Không gọi trùng endpoint ở đây; dùng **`getUnitMembers`** trong `unitService.js`:
 *
 * `GET /units/{unitId}/members?skip=&limit=&semester_id=`
 *
 * Hàm `listUnitMembersForHtsk` bên dưới là wrapper gõ sẵn tham số + `authToken` cho tiện gọi từ UI.
 */

import { ApiError, apiRequest } from './apiClient'
import { getStoredAuthSession } from './authSession'
import { getUnitMembers } from './unitService'

/** Chuỗi `detail` từ BE khi đơn vị chưa gửi phản hồi HTSK (GET trả 404). */
export const HTSK_NOT_SUBMITTED_DETAIL = 'Đơn vị của bạn chưa phản hồi sự kiện này'

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isHtskNotSubmittedError(error) {
  if (!(error instanceof ApiError) || error.status !== 404) {
    return false
  }
  const detail = error.payload?.detail
  const text = typeof detail === 'string' ? detail.trim() : ''
  return text === HTSK_NOT_SUBMITTED_DETAIL || text.includes('chưa phản hồi sự kiện')
}

function requireUnitContext(unitEventId, unitId) {
  const eid = unitEventId ? String(unitEventId).trim() : ''
  const uid = unitId ? String(unitId).trim() : ''
  if (!eid || !uid) {
    throw new Error('Thiếu unit_event_id hoặc unitId.')
  }
  return { eid, uid }
}

/**
 * Lấy phản hồi HTSK của đơn vị cho sự kiện.
 *
 * @param {string} unitEventId — id nhiệm vụ / sự kiện (`taskId` trên route staff).
 * @param {string} unitId — đơn vị (`X-Unit-Id`).
 * @returns {Promise<object | null>} Dữ liệu phản hồi hoặc `null` nếu BE báo chưa phản hồi (404 đặc biệt).
 */
export async function getStaffHtskSubmission(unitEventId, unitId) {
  const { eid, uid } = requireUnitContext(unitEventId, unitId)
  const accessToken = getStoredAuthSession()?.accessToken || ''

  try {
    return await apiRequest(`/unit-event-submissions/HTSK?unit_event_id=${encodeURIComponent(eid)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Unit-Id': uid,
      },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
  } catch (err) {
    if (isHtskNotSubmittedError(err)) {
      return null
    }
    throw err
  }
}

/**
 * Gửi phản hồi HTSK (tạo mới).
 *
 * @param {object} params
 * @param {string} params.unitEventId
 * @param {string} params.unitId
 * @param {string | null | undefined} params.content
 * @param {string[]} params.list_MSV — danh sách mã sinh viên đã chọn.
 */
export async function postStaffHtskSubmission({ unitEventId, unitId, content, list_MSV }) {
  const { eid, uid } = requireUnitContext(unitEventId, unitId)
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const list = Array.isArray(list_MSV) ? list_MSV.map((s) => String(s).trim()).filter(Boolean) : []
  const normalizedContent = content == null ? null : String(content).trim() || null

  return apiRequest('/unit-event-submissions/HTSK', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Unit-Id': uid,
    },
    body: JSON.stringify({
      unitEventId: eid,
      unitId: uid,
      content: normalizedContent,
      list_MSV: list,
    }),
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

/**
 * Cập nhật phản hồi HTSK đã tồn tại.
 *
 * @param {object} params
 * @param {string} params.unitEventId
 * @param {string} params.unitId
 * @param {string | null | undefined} params.content
 * @param {string[]} params.list_MSV — danh sách mã sinh viên đã chọn.
 */
export async function putStaffHtskSubmission({ unitEventId, unitId, content, list_MSV }) {
  const { eid, uid } = requireUnitContext(unitEventId, unitId)
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const list = Array.isArray(list_MSV) ? list_MSV.map((s) => String(s).trim()).filter(Boolean) : []
  const normalizedContent = content == null ? null : String(content).trim() || null

  return apiRequest(`/unit-event-submissions/HTSK?unit_event_id=${encodeURIComponent(eid)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Unit-Id': uid,
    },
    body: JSON.stringify({
      content: normalizedContent,
      list_MSV: list,
    }),
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

/**
 * Danh sách thành viên đơn vị trong học kỳ (để staff chọn MSV gửi HTSK).
 * Ủy quyền `GET /units/:unitId/members` — xem `getUnitMembers` trong `unitService.js`.
 *
 * @param {string} unitId
 * @param {string} semesterId
 * @param {{
 *   skip?: number,
 *   limit?: number,
 *   student_id?: string,
 *   full_name?: string,
 *   class_name?: string,
 * }} [options] — `student_id` / `full_name` / `class_name` gửi lên query BE (lọc server, phù hợp danh sách lớn).
 */
export async function listUnitMembersForHtsk(unitId, semesterId, options = {}) {
  const uid = unitId ? String(unitId).trim() : ''
  const sid = semesterId ? String(semesterId).trim() : ''
  const accessToken = getStoredAuthSession()?.accessToken || ''
  if (!uid || !sid) {
    return { items: [], total: 0, skip: 0, limit: 0 }
  }

  const skip = Number.isFinite(options.skip) ? options.skip : 0
  const limit = Number.isFinite(options.limit) ? options.limit : 200

  const params = {
    skip,
    limit,
    semester_id: sid,
  }
  const studentIdFilter = options.student_id != null ? String(options.student_id).trim() : ''
  const nameQ = options.full_name != null ? String(options.full_name).trim() : ''
  const classQ = options.class_name != null ? String(options.class_name).trim() : ''
  if (studentIdFilter) {
    params.student_id = studentIdFilter
  }
  if (nameQ) {
    params.full_name = nameQ
  }
  if (classQ) {
    params.class_name = classQ
  }

  return getUnitMembers(uid, params, accessToken)
}

const ROSTER_CHUNK_DEFAULT = 100

/**
 * Tải **toàn bộ** thành viên đơn vị trong học kì (lặp `skip`/`limit`) để match MSV khi dán danh sách.
 *
 * @param {string} unitId
 * @param {string} semesterId
 * @param {number} [chunkSize]
 * @returns {Promise<{ byStudentId: Record<string, { full_name: string, class_name: string, user_id: string }>, totalReported: number }>}
 */
export async function fetchAllUnitMembersRosterForHtsk(unitId, semesterId, chunkSize = ROSTER_CHUNK_DEFAULT) {
  const uid = unitId ? String(unitId).trim() : ''
  const sid = semesterId ? String(semesterId).trim() : ''
  if (!uid || !sid) {
    return { byStudentId: {}, totalReported: 0 }
  }

  const byStudentId = {}
  let skip = 0
  let totalReported = 0
  const limit = Number.isFinite(chunkSize) && chunkSize > 0 ? chunkSize : ROSTER_CHUNK_DEFAULT

  for (;;) {
    const res = await listUnitMembersForHtsk(uid, sid, { skip, limit })
    const items = Array.isArray(res.items) ? res.items : []
    totalReported = Number(res.total) || totalReported || items.length

    for (const m of items) {
      const st = m.student_id != null ? String(m.student_id).trim() : ''
      if (!st) {
        continue
      }
      byStudentId[st] = {
        full_name: m.full_name || '',
        class_name: m.class_name || '',
        user_id: m.user_id || '',
      }
    }

    skip += items.length
    if (items.length < limit) {
      break
    }
    if (totalReported > 0 && skip >= totalReported) {
      break
    }
  }

  return { byStudentId, totalReported }
}
