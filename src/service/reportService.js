import { apiRequest } from './apiClient'
import { appConfig } from '../configurations/configuration'

const BASE_URL = '/reports'

export const getAllReports = async (authToken, month, year, unitId, status) => {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)
  if (unitId) params.append('unit_id', unitId)
  if (status && status !== 'all') params.append('status_filter', status)
  
  const queryString = params.toString()
  const url = `${BASE_URL}/all${queryString ? `?${queryString}` : ''}`
  
  return await apiRequest(url, {
    method: 'GET',
    authToken,
  })
}

export const getReportDetail = async (reportId, authToken) => {
  return await apiRequest(`${BASE_URL}/${reportId}`, {
    method: 'GET',
    authToken,
  })
}

export const submitReport = async (reportId, unitId, authToken) => {
  return await apiRequest(`${BASE_URL}/${reportId}/submit`, {
    method: 'POST',
    headers: { 'X-Unit-Id': unitId },
    authToken,
  })
}

export const updateReportStatus = async (reportId, status, note, authToken) => {
  return await apiRequest(`${BASE_URL}/${reportId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
    authToken,
  })
}

export const exportSummaryExcel = async (authToken, month, year, unitId, status) => {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)
  if (unitId) params.append('unit_id', unitId)
  if (status && status !== 'all') params.append('status_filter', status)

  const queryString = params.toString()
  const url = `${appConfig.apiBaseUrl}${BASE_URL}/export/summary${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) throw new Error('Export failed')
  return await response.blob()
}

export const exportDetailExcel = async (reportId, authToken) => {
  const response = await fetch(`${appConfig.apiBaseUrl}${BASE_URL}/${reportId}/export/detail`, {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) throw new Error('Export failed')
  return await response.blob()
}
