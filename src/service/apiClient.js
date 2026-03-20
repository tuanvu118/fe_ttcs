import { appConfig } from '../configurations/configuration'

export async function apiRequest(path, options = {}) {
  const { authToken, headers, ...requestOptions } = options
  const requestHeaders = new Headers(headers || {})

  if (authToken) {
    requestHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload))
  }

  return payload
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
    return 'Khong the ket noi den may chu.'
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload.detail)) {
    return payload.detail.map((item) => item.msg).join(', ')
  }

  return payload.detail || payload.message || 'Yeu cau that bai.'
}
