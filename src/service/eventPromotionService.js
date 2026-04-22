import { message } from 'antd'
import { apiRequest, ApiError } from './apiClient'
import { getStoredAuthSession } from './authSession'

function notifyPromotionError(error) {
  if (error instanceof ApiError) {
    message.error(error.message || 'Thao tác bản tin thất bại.')
  } else {
    message.error('Không thể kết nối đến máy chủ.')
  }
}

export async function getPromotion(id) {
  const token = getStoredAuthSession()?.accessToken
  try {
    return await apiRequest(`/event-promotions/${id}`, {
      method: 'GET',
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function getPromotionsForUnit(unitId, semesterId = null, skip = 0, limit = 10, status = null) {
  const token = getStoredAuthSession()?.accessToken
  try {
    const params = new URLSearchParams()
    if (semesterId && semesterId !== 'all') params.append('semester_id', semesterId)
    if (status && status !== 'ALL') params.append('status', status)
    params.append('skip', skip)
    params.append('limit', limit)
    
    return await apiRequest(`/event-promotions/my-unit?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-Unit-Id': unitId,
      },
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function deletePromotion(id, unitId) {
  const token = getStoredAuthSession()?.accessToken
  try {
    await apiRequest(`/event-promotions/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Unit-Id': unitId,
      },
      authToken: token,
    })
    message.success('Xóa bản tin thành công.')
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function updatePromotionStatus(id, status, rejectedReason = null) {
  const token = getStoredAuthSession()?.accessToken
  try {
    return await apiRequest(`/event-promotions/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        rejected_reason: rejectedReason,
      }),
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}
export async function createPromotion(formData, unitId) {
  const token = getStoredAuthSession()?.accessToken
  try {
    return await apiRequest('/event-promotions', {
      method: 'POST',
      headers: {
        'X-Unit-Id': unitId,
      },
      body: formData,
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function updatePromotion(id, formData, unitId) {
  const token = getStoredAuthSession()?.accessToken
  try {
    return await apiRequest(`/event-promotions/${id}`, {
      method: 'PUT',
      headers: {
        'X-Unit-Id': unitId,
      },
      body: formData,
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function getAllPromotionsForAdmin(filters = {}) {
  const token = getStoredAuthSession()?.accessToken
  try {
    const { status, semester_id, skip = 0, limit = 10 } = filters
    const params = new URLSearchParams()
    if (status && status !== 'ALL') params.append('status', status)
    if (semester_id && semester_id !== 'ALL') params.append('semester_id', semester_id)
    params.append('skip', skip)
    params.append('limit', limit)

    return await apiRequest(`/event-promotions/admin?${params.toString()}`, {
      method: 'GET',
      authToken: token,
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}

export async function getPublicPromotions(skip = 0, limit = 10) {
  try {
    const params = new URLSearchParams()
    params.append('skip', skip)
    params.append('limit', limit)
    
    return await apiRequest(`/event-promotions/public?${params.toString()}`, {
      method: 'GET',
    })
  } catch (error) {
    notifyPromotionError(error)
    throw error
  }
}
