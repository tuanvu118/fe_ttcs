import { apiRequest } from './apiClient'

/**
 * @typedef {"LCK" | "CLB" | "SYSTEM"} UnitType
 */

/**
 * @typedef {Object} UnitRead
 * @property {string} id
 * @property {string} name
 * @property {string | null} logo
 * @property {string | null} introduction
 * @property {UnitType | null} type
 */

/**
 * @typedef {Object} UnitListResponse
 * @property {UnitRead[]} items
 * @property {number} total
 * @property {number} skip
 * @property {number} limit
 */

/**
 * @typedef {Object} GetUnitsParams
 * @property {number} [skip]
 * @property {number} [limit]
 * @property {string} [name]
 * @property {UnitType} [type]
 * @property {string} [introduction]
 */

/**
 * @typedef {Object} UnitMemberCreate
 * @property {string} student_id
 */

/**
 * @typedef {Object} UnitMemberRead
 * @property {string} user_id
 * @property {string} full_name
 * @property {string} student_id
 * @property {string} class_name
 * @property {string} email
 * @property {string | null} avatar_url
 * @property {string} unit_id
 * @property {string} semester_id
 * @property {string} joined_at
 */

/**
 * @typedef {Object} GetUnitMembersParams
 * @property {number} [skip]
 * @property {number} [limit]
 * @property {string} [semester_id]
 * @property {string} [full_name]
 * @property {string} [email]
 * @property {string} [student_id]
 * @property {string} [class_name]
 */

/**
 * @typedef {Object} UnitMemberListResponse
 * @property {UnitMemberRead[]} items
 * @property {number} total
 * @property {number} skip
 * @property {number} limit
 */

function appendOptionalFormField(formData, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }

  formData.append(key, value)
}

function buildUnitFormData(form) {
  const formData = new FormData()

  appendOptionalFormField(formData, 'name', form.name?.trim())
  appendOptionalFormField(formData, 'type', form.type)
  appendOptionalFormField(formData, 'introduction', form.introduction?.trim())
  appendOptionalFormField(formData, 'established_year', form.established_year)
  appendOptionalFormField(formData, 'member_count', form.member_count)
  appendOptionalFormField(formData, 'email', form.email?.trim())

  if (form.logo instanceof File) {
    formData.append('logo', form.logo)
  }

  if (form.cover instanceof File) {
    formData.append('cover', form.cover)
  }

  return formData
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value).trim())
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function mapUnit(data) {
  return {
    id: data?._id || data?.id || '',
    name: data?.name || '',
    logo: data?.logo || null,
    cover_url: data?.cover_url || null,
    introduction: data?.introduction || null,
    type: data?.type || null,
    established_year: data?.established_year || null,
    member_count: data?.member_count || 0,
    email: data?.email || ''
  }
}

function mapUnitListResponse(response) {
  return {
    items: Array.isArray(response?.items) ? response.items.map(mapUnit) : [],
    total: Number(response?.total || 0),
    skip: Number(response?.skip || 0),
    limit: Number(response?.limit || 0),
  }
}

function mapUnitMember(member) {
  return {
    user_id: member?.user_id || '',
    full_name: member?.full_name || '',
    student_id: member?.student_id || '',
    class_name: member?.class_name || '',
    email: member?.email || '',
    avatar_url: member?.avatar_url || null,
    unit_id: member?.unit_id || '',
    semester_id: member?.semester_id || '',
    joined_at: member?.joined_at || '',
  }
}

function mapUnitMemberListResponse(response) {
  return {
    items: Array.isArray(response?.items) ? response.items.map(mapUnitMember) : [],
    total: Number(response?.total || 0),
    skip: Number(response?.skip || 0),
    limit: Number(response?.limit || 0),
  }
}

export async function getUnits(params = {}) {
  const response = await apiRequest(`/units${buildQuery(params)}`, {
    method: 'GET',
  })

  return mapUnitListResponse(response)
}

export async function getUnitDetail(unitId) {
  const response = await apiRequest(`/units/${unitId}`, {
    method: 'GET',
  })

  return mapUnit(response)
}

export async function getManagedUnits(params = {}, authToken) {
  const response = await apiRequest(`/units${buildQuery(params)}`, {
    method: 'GET',
    authToken,
  })

  return mapUnitListResponse(response)
}

export async function getUnitById(unitId, authToken) {
  const response = await apiRequest(`/units/${unitId}`, {
    method: 'GET',
    authToken,
  })

  return mapUnit(response)
}

export async function createUnit(form, authToken) {
  const response = await apiRequest('/units', {
    method: 'POST',
    body: buildUnitFormData(form),
    authToken,
  })

  return mapUnit(response)
}

export async function updateUnit(unitId, form, authToken) {
  const response = await apiRequest(`/units/${unitId}`, {
    method: 'PUT',
    body: buildUnitFormData(form),
    authToken,
  })

  return mapUnit(response)
}

export async function deleteUnit(unitId, authToken) {
  await apiRequest(`/units/${unitId}`, {
    method: 'DELETE',
    authToken,
  })
}

export async function getUnitMembers(unitId, params = {}, authToken) {
  const response = await apiRequest(`/units/${unitId}/members${buildQuery(params)}`, {
    method: 'GET',
    authToken,
  })

  return mapUnitMemberListResponse(response)
}

export async function addUnitMember(unitId, payload, authToken) {
  const response = await apiRequest(`/units/${unitId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student_id: payload.student_id,
    }),
    authToken,
  })

  return mapUnitMember(response)
}

export async function removeUnitMember(unitId, userId, authToken, semesterId) {
  await apiRequest(
    `/units/${unitId}/members/${userId}${buildQuery({ semester_id: semesterId })}`,
    {
      method: 'DELETE',
      authToken,
    },
  )
}
