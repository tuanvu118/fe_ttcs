import { apiRequest } from './apiClient'

/**
 * @typedef {Object} UserRead
 * @property {string} id
 * @property {string} full_name
 * @property {string} email
 * @property {string} student_id
 * @property {string} class_name
 * @property {string | null} avatar_url
 * @property {string | null} date_of_birth
 */

/**
 * @typedef {Object} UnitRole
 * @property {string} unit_id
 * @property {string[]} roles
 */

/**
 * @typedef {Object} UserProfileResponse
 * @property {string} id
 * @property {string} full_name
 * @property {string} email
 * @property {string} student_id
 * @property {string} class_name
 * @property {string | null} avatar_url
 * @property {string | null} date_of_birth
 * @property {boolean} is_active
 * @property {UnitRole[]} roles
 */

/**
 * @typedef {Object} UserResponse
 * @property {string} full_name
 * @property {string} email
 * @property {string} student_id
 * @property {string} class_name
 * @property {string | null} avatar_url
 * @property {string | null} date_of_birth
 */

/**
 * @typedef {Object} UserListResponse
 * @property {UserRead[]} items
 * @property {number} total
 * @property {number} skip
 * @property {number} limit
 */

/**
 * @typedef {Object} GetUsersParams
 * @property {number} [skip]
 * @property {number} [limit]
 * @property {string} [full_name]
 * @property {string} [email]
 * @property {string} [student_id]
 * @property {string} [class_name]
 */

/**
 * @typedef {Object} CreateUserForm
 * @property {string} full_name
 * @property {string} email
 * @property {string} password
 * @property {string} student_id
 * @property {string} class_name
 * @property {File | null} [avatar]
 * @property {string | null} [date_of_birth]
 */

/**
 * @typedef {Object} UpdateUserForm
 * @property {string} [full_name]
 * @property {string} [email]
 * @property {string} [password]
 * @property {string} [student_id]
 * @property {string} [class_name]
 * @property {File | null} [avatar]
 * @property {string | null} [date_of_birth]
 */

function appendOptionalFormField(formData, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }

  formData.append(key, value)
}

function buildUserFormData(form) {
  const formData = new FormData()

  appendOptionalFormField(formData, 'full_name', form.full_name?.trim())
  appendOptionalFormField(formData, 'email', form.email?.trim())
  appendOptionalFormField(formData, 'password', form.password)
  appendOptionalFormField(formData, 'student_id', form.student_id?.trim())
  appendOptionalFormField(formData, 'class_name', form.class_name?.trim())
  appendOptionalFormField(formData, 'date_of_birth', form.date_of_birth)

  if (form.avatar instanceof File) {
    formData.append('avatar', form.avatar)
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

function normalizeRoleList(roles) {
  if (!Array.isArray(roles)) {
    return []
  }

  return roles.map((roleItem) => ({
    unit_id: roleItem?.unit_id || '',
    roles: Array.isArray(roleItem?.roles) ? roleItem.roles : [],
  }))
}

function mapUserRead(user) {
  return {
    id: user?.id || '',
    full_name: user?.full_name || '',
    email: user?.email || '',
    student_id: user?.student_id || '',
    class_name: user?.class_name || '',
    avatar_url: user?.avatar_url || null,
    date_of_birth: user?.date_of_birth || null,
  }
}

function mapUserProfile(user) {
  return {
    ...mapUserRead(user),
    is_active: Boolean(user?.is_active),
    roles: normalizeRoleList(user?.roles),
  }
}

function mapUserResponse(user) {
  return {
    full_name: user?.full_name || '',
    email: user?.email || '',
    student_id: user?.student_id || '',
    class_name: user?.class_name || '',
    avatar_url: user?.avatar_url || null,
    date_of_birth: user?.date_of_birth || null,
  }
}

function mapUserListResponse(response) {
  return {
    items: Array.isArray(response?.items) ? response.items.map(mapUserRead) : [],
    total: Number(response?.total || 0),
    skip: Number(response?.skip || 0),
    limit: Number(response?.limit || 0),
  }
}

export async function getUsers(params = {}, authToken = '') {
  const response = await apiRequest(`/users${buildQuery(params)}`, {
    method: 'GET',
    authToken,
  })

  if (Array.isArray(response)) {
    return {
      items: response.map(mapUserRead),
      total: response.length,
      skip: 0,
      limit: response.length,
    }
  }

  return mapUserListResponse(response)
}

export async function getMyProfile(authToken) {
  const response = await apiRequest('/users/me', {
    method: 'GET',
    authToken,
  })

  return mapUserProfile(response)
}

export async function getUserDetail(userId, authToken) {
  const response = await apiRequest(`/users/${userId}`, {
    method: 'GET',
    authToken,
  })

  return mapUserProfile(response)
}

export async function getUserById(userId, authToken) {
  return getUserDetail(userId, authToken)
}

export async function createUser(form, authToken) {
  const response = await apiRequest('/users', {
    method: 'POST',
    body: buildUserFormData(form),
    authToken,
  })

  return mapUserResponse(response)
}

export async function updateMyProfile(form, authToken) {
  const response = await apiRequest('/users/me', {
    method: 'PUT',
    body: buildUserFormData(form),
    authToken,
  })

  return mapUserRead(response)
}

export async function updateUser(userId, form, authToken) {
  const response = await apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: buildUserFormData(form),
    authToken,
  })

  return mapUserRead(response)
}
