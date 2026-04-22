import { message } from 'antd'
import { apiRequest, ApiError } from './apiClient'
import { getStoredAuthSession } from './authSession'

function notifyPublicEventsError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        break
      case 403:
        message.error('Bạn không có quyền xem danh sách sự kiện.')
        break
      case 404:
        message.error('Không tìm thấy dữ liệu sự kiện.')
        break
      default:
        message.error(error.message || 'Không thể tải danh sách sự kiện.')
    }
    return
  }

  message.error('Không thể kết nối đến máy chủ.')
}

function notifyUnitEventsListError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        break
      case 403:
        message.error('Bạn không có quyền xem sự kiện đơn vị.')
        break
      case 404:
        message.error('Không tìm thấy kỳ học hoặc dữ liệu sự kiện.')
        break
      default:
        message.error(error.message || 'Không thể tải danh sách sự kiện đơn vị.')
    }
    return
  }

  message.error('Không thể kết nối đến máy chủ.')
}

function normalizePoint(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function eventCreatedAt(raw) {
  return raw?.created_at ?? raw?.create_at ?? ''
}

function publicEventSemesterId(raw) {
  const v = raw?.semester_id ?? raw?.semesterId
  return v != null ? String(v) : ''
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} type — "SK" | "HTSK" | "HTTT"
 */
function toAdminEventRow(item, type) {
  const created = eventCreatedAt(item)
  return {
    id: String(item?.id ?? ''),
    title: String(item?.title ?? ''),
    point: normalizePoint(item?.point),
    create_at: created,
    type,
  }
}

function parseCreatedTime(createAt) {
  const t = new Date(createAt).getTime()
  return Number.isNaN(t) ? 0 : t
}

export async function getAllUnitEventsForAdmin(semesterId, skip = 0, limit = 10) {
  const sid = semesterId ? String(semesterId).trim() : null
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const params = new URLSearchParams()
    if (sid && sid !== 'all') params.append('semesterId', sid)
    params.append('skip', skip)
    params.append('limit', limit)
    
    const response = await apiRequest(`/unit-events/all?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response || { items: [], total: 0 }
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

export async function getAllPublicEventsForAdmin(skip = 0, limit = 10) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest(`/events/?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response || { items: [], total: 0 }
  } catch (error) {
    notifyPublicEventsError(error)
    throw error
  }
}

/**
 * Gộp sự kiện đơn vị (HTSK/HTTT) và sự kiện public (type "SK") trong cùng học kỳ.
 * Sắp xếp theo ngày tạo: cũ → mới.
 * @returns {Promise<Array<{ id: string, title: string, point: number, create_at: string, type: string }>>}
 */
export async function getAllEventBySemesterIdForAdmin(semesterId, skip = 0, limit = 10) {
  if (!semesterId) {
    message.warning('Thiếu học kỳ.')
    return { items: [], total: 0 }
  }

  const sid = String(semesterId).trim()
  const [unitData, publicData] = await Promise.all([
    getAllUnitEventsForAdmin(sid === 'all' ? null : sid, skip, limit),
    getAllPublicEventsForAdmin(skip, limit),
  ])

  const unitList = unitData.items || []
  const publicList = publicData.items || []

  const unitRows = unitList.map((item) =>
    toAdminEventRow(item, String(item?.type ?? 'HTSK')),
  )

  const publicInSemester = sid === 'all' 
    ? publicList 
    : publicList.filter((item) => publicEventSemesterId(item) === sid)
    
  const publicRows = publicInSemester.map((item) => toAdminEventRow(item, 'SK'))

  const merged = [...unitRows, ...publicRows]
  merged.sort((b, a) => parseCreatedTime(a.create_at) - parseCreatedTime(b.create_at))

  // Map thêm thông tin semester_id vào row để hiển thị ở bảng nếu cần
  const items = merged.map((row) => {
    const originalItem =
      row.type === 'SK'
        ? publicList.find((p) => String(p.id) === row.id)
        : unitList.find((u) => String(u.id) === row.id)

    return {
      ...row,
      semester_id: originalItem?.semester_id ?? originalItem?.semesterId ?? '',
    }
  })

  return {
    items,
    total: Math.max(unitData.total || 0, publicData.total || 0) // Approximation for merged total
  }
}

export async function createPublicEvent(formData) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest('/events/', {
      method: 'POST',
      body: formData, // FormData doesn't need Content-Type header, fetch will set it with boundary
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Tạo sự kiện chung thất bại.')
    } else {
      message.error('Không thể kết nối đến máy chủ.')
    }
    throw error
  }
}

export async function createUnitEvent(formData) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest('/unit-events/', {
      method: 'POST',
      body: formData,
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Tạo sự kiện đơn vị thất bại.')
    } else {
      message.error('Không thể kết nối đến máy chủ.')
    }
    throw error
  }
}

export async function getPublicEventById(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest(`/events/${eventId}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    notifyPublicEventsError(error)
    throw error
  }
}

export async function getUnitEventById(eventId, unitId = null) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const headers = { Accept: 'application/json' }
    if (unitId) {
      headers['X-Unit-Id'] = unitId
    }

    const response = await apiRequest(`/unit-events/${eventId}`, {
      method: 'GET',
      headers,
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

/** Danh sách phản hồi HTTT theo sự kiện (admin/manager). */
export async function getHtttSubmissionsAllByUnitEvent(unitEventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const eid = unitEventId ? String(unitEventId).trim() : ''
  if (!eid) {
    return []
  }
  try {
    const response = await apiRequest(
      `/unit-event-submissions/HTTT/all?unit_event_id=${encodeURIComponent(eid)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        ...(accessToken ? { authToken: accessToken } : {}),
      },
    )
    return Array.isArray(response) ? response : []
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

/** Danh sách đăng ký HTSK theo sự kiện (admin/manager). */
export async function getHtskRegistrationsByUnitEvent(unitEventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const eid = unitEventId ? String(unitEventId).trim() : ''
  if (!eid) {
    return []
  }
  try {
    const response = await apiRequest(
      `/unit-event-submissions/HTSK/list?unit_event_id=${encodeURIComponent(eid)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        ...(accessToken ? { authToken: accessToken } : {}),
      },
    )
    return Array.isArray(response) ? response : []
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

const HTTT_STATUS_VALUES = new Set(['PENDING', 'APPROVED', 'REJECTED'])

/** Admin/Manager: cập nhật trạng thái duyệt phản hồi HTTT (POST /unit-event-submissions/status). */
export async function updateHtttSubmissionStatus(unitEventSubmissionId, status) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  const sid = unitEventSubmissionId ? String(unitEventSubmissionId).trim() : ''
  const st = String(status || '').toUpperCase().trim()
  if (!sid || !HTTT_STATUS_VALUES.has(st)) {
    throw new Error('Thiếu id phản hồi hoặc trạng thái không hợp lệ.')
  }
  try {
    return await apiRequest('/unit-event-submissions/status', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unit_event_submission_id: sid,
        status: st,
      }),
      ...(accessToken ? { authToken: accessToken } : {}),
    })
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

export async function updatePublicEvent(eventId, formData) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: formData,
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Cập nhật sự kiện chung thất bại.')
    }
    throw error
  }
}

export async function updateUnitEvent(eventId, formData) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest(`/unit-events/${eventId}`, {
      method: 'PUT',
      body: formData,
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return response
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Cập nhật sự kiện đơn vị thất bại.')
    }
    throw error
  }
}

export async function deletePublicEvent(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    await apiRequest(`/events/${eventId}`, {
      method: 'DELETE',
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    message.success('Xóa sự kiện chung thành công.')
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Xóa sự kiện chung thất bại.')
    }
    throw error
  }
}

export async function deleteUnitEvent(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    await apiRequest(`/unit-events/${eventId}`, {
      method: 'DELETE',
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    message.success('Xóa sự kiện đơn vị thành công.')
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Xóa sự kiện đơn vị thất bại.')
    }
    throw error
  }
}

export async function getEventRegistrations(eventId) {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    return await apiRequest(`/events/${eventId}/registrations`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      authToken: accessToken,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message || 'Không thể tải danh sách đăng ký.')
    }
    throw error
  }
}

