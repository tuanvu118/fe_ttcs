import { apiRequest } from './apiClient'

/**
 * @typedef {Object} SemesterRead
 * @property {string} id
 * @property {string} name
 * @property {string} academic_year
 * @property {string} start_date
 * @property {string} end_date
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} SemesterCreate
 * @property {string} name
 * @property {string} academic_year
 * @property {string} start_date
 * @property {string} end_date
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} SemesterUpdate
 * @property {string} [name]
 * @property {string} [academic_year]
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {boolean} [is_active]
 */

/**
 * @typedef {Object} GetSemestersParams
 * @property {number} [skip]
 * @property {number} [limit]
 * @property {string} [name]
 * @property {string} [academic_year]
 * @property {boolean} [is_active]
 * @property {string} [start_date_from]
 * @property {string} [start_date_to]
 * @property {string} [end_date_from]
 * @property {string} [end_date_to]
 */

/**
 * @typedef {Object} SemesterListResponse
 * @property {SemesterRead[]} items
 * @property {number} total
 * @property {number} skip
 * @property {number} limit
 */

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (typeof value === 'boolean') {
      searchParams.set(key, String(value))
      return
    }

    searchParams.set(key, String(value).trim())
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function mapSemester(semester) {
  return {
    id: semester?.id || '',
    name: semester?.name || '',
    academic_year: semester?.academic_year || '',
    start_date: semester?.start_date || '',
    end_date: semester?.end_date || '',
    is_active: Boolean(semester?.is_active),
    created_at: semester?.created_at || '',
  }
}

function mapSemesterListResponse(response) {
  return {
    items: Array.isArray(response?.items) ? response.items.map(mapSemester) : [],
    total: Number(response?.total || 0),
    skip: Number(response?.skip || 0),
    limit: Number(response?.limit || 0),
  }
}

function buildSemesterPayload(form, mode) {
  const payload = {}

  if (mode === 'create' || form.name !== undefined) {
    payload.name = form.name
  }

  if (mode === 'create' || form.academic_year !== undefined) {
    payload.academic_year = form.academic_year
  }

  if (mode === 'create' || form.start_date !== undefined) {
    payload.start_date = form.start_date
  }

  if (mode === 'create' || form.end_date !== undefined) {
    payload.end_date = form.end_date
  }

  if (mode === 'create' || form.is_active !== undefined) {
    payload.is_active = Boolean(form.is_active)
  }

  return payload
}

function normalizeGetSemestersArgs(paramsOrToken, tokenMaybe) {
  if (typeof paramsOrToken === 'string') {
    return {
      params: {},
      authToken: paramsOrToken,
    }
  }

  return {
    params: paramsOrToken || {},
    authToken: tokenMaybe || '',
  }
}

export async function getSemesters(paramsOrToken = {}, tokenMaybe = '') {
  const { params, authToken } = normalizeGetSemestersArgs(paramsOrToken, tokenMaybe)
  const response = await apiRequest(`/semesters${buildQuery(params)}`, {
    method: 'GET',
    authToken,
  })

  if (Array.isArray(response)) {
    return {
      items: response.map(mapSemester),
      total: response.length,
      skip: Number(params?.skip || 0),
      limit: Number(params?.limit || response.length || 0),
    }
  }

  return mapSemesterListResponse(response)
}

export async function getCurrentSemester(authToken) {
  const response = await apiRequest('/semesters/current', {
    method: 'GET',
    authToken,
  })

  return mapSemester(response)
}

export async function createSemester(payload, authToken) {
  const response = await apiRequest('/semesters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildSemesterPayload(payload, 'create')),
    authToken,
  })

  return mapSemester(response)
}

export async function updateSemester(semesterId, payload, authToken) {
  const response = await apiRequest(`/semesters/${semesterId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildSemesterPayload(payload, 'update')),
    authToken,
  })

  return mapSemester(response)
}
