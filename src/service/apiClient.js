import { appConfig } from '../configurations/configuration'
import {
  clearAuthSession,
  getStoredAuthSession,
  writeAuthSession,
} from './authSession'

export class ApiError extends Error {
  constructor(status, message, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

let refreshRequest = null

export async function apiRequest(path, options = {}) {
  const {
    authToken,
    headers,
    skipAuthRefresh = false,
    retryOnAuthFailure = true,
    ...requestOptions
  } = options
  const activeSession = getStoredAuthSession()
  const requestAuthToken =
    typeof authToken === 'string' && authToken
      ? activeSession?.accessToken || authToken
      : ''

  const response = await executeRequest(path, requestOptions, headers, requestAuthToken)
  const payload = await parseResponse(response)

  if (
    response.status === 401 &&
    requestAuthToken &&
    !skipAuthRefresh &&
    retryOnAuthFailure
  ) {
    try {
      const refreshedSession = await refreshAuthSession()

      if (refreshedSession?.accessToken) {
        return apiRequest(path, {
          ...options,
          authToken: refreshedSession.accessToken,
          retryOnAuthFailure: false,
        })
      }
    } catch {
      clearAuthSession()
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorMessage(payload), payload)
  }

  return payload
}

async function executeRequest(path, requestOptions, headers, authToken) {
  const requestHeaders = new Headers(headers || {})

  if (authToken) {
    requestHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  return fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  })
}

async function refreshAuthSession() {
  if (refreshRequest) {
    return refreshRequest
  }

  const authSession = getStoredAuthSession()

  if (!authSession?.refreshToken) {
    clearAuthSession()
    throw new ApiError(401, 'Phiên đăng nhập hết hạn.', null)
  }

  refreshRequest = (async () => {
    const response = await executeRequest(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: authSession.refreshToken,
        }),
      },
      {
        'Content-Type': 'application/json',
      },
      '',
    )
    const payload = await parseResponse(response)

    if (!response.ok) {
      clearAuthSession()
      throw new ApiError(response.status, extractErrorMessage(payload), payload)
    }

    return writeAuthSession({
      accessToken: payload?.access_token || '',
      refreshToken: payload?.refresh_token || '',
      tokenType: payload?.token_type || 'bearer',
    })
  })()

  try {
    return await refreshRequest
  } finally {
    refreshRequest = null
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function extractErrorMessage(payload) {
  if (!payload) {
    return 'Không thể kết nối đến máy chủ.'
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg).join('\n')
  }

  return payload.detail || payload.message || 'Yêu cầu thất bại.'
}
