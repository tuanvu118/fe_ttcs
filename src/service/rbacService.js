import { apiRequest } from './apiClient'

/**
 * @typedef {Object} RoleRead
 * @property {string} id
 * @property {"ADMIN" | "MANAGER" | "STAFF" | "USER"} code
 */

/**
 * @typedef {Object} AssignRoleRequest
 * @property {string} target_user_id
 * @property {string} role_id
 * @property {string} unit_id
 * @property {string | null} [semester_id]
 */

/**
 * @typedef {Object} UserRoleAssignmentRead
 * @property {string} id
 * @property {string} user_id
 * @property {string} role_id
 * @property {string} role_code
 * @property {string} unit_id
 * @property {string} semester_id
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} UserRoleAssignmentListResponse
 * @property {UserRoleAssignmentRead[]} items
 * @property {number} total
 */

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

function mapRole(role) {
  return {
    id: role?.id || '',
    code: role?.code || 'USER',
  }
}

function mapAssignment(assignment) {
  return {
    id: assignment?.id || '',
    user_id: assignment?.user_id || '',
    role_id: assignment?.role_id || '',
    role_code: assignment?.role_code || '',
    unit_id: assignment?.unit_id || '',
    semester_id: assignment?.semester_id || '',
    is_active: Boolean(assignment?.is_active),
    created_at: assignment?.created_at || '',
  }
}

function mapAssignmentList(response) {
  return {
    items: Array.isArray(response?.items) ? response.items.map(mapAssignment) : [],
    total: Number(response?.total || 0),
  }
}

export async function getRoles(authToken) {
  const response = await apiRequest('/rbac/roles', {
    method: 'GET',
    authToken,
  })

  return Array.isArray(response) ? response.map(mapRole) : []
}

export async function getUserAssignments(userId, authToken, semesterId) {
  const response = await apiRequest(
    `/rbac/users/${userId}/assignments${buildQuery({ semester_id: semesterId })}`,
    {
      method: 'GET',
      authToken,
    },
  )

  return mapAssignmentList(response)
}

export async function assignRole(payload, authToken) {
  const response = await apiRequest('/rbac/assign-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_user_id: payload.target_user_id,
      role_id: payload.role_id,
      unit_id: payload.unit_id,
      ...(payload.semester_id ? { semester_id: payload.semester_id } : {}),
    }),
    authToken,
  })

  return mapAssignment(response)
}

export async function removeAssignment(assignmentId, authToken) {
  await apiRequest(`/rbac/assignments/${assignmentId}`, {
    method: 'DELETE',
    authToken,
  })
}
