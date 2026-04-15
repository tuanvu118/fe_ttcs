import { apiRequest } from './apiClient'
import { appConfig } from '../configurations/configuration'

const BASE_URL = '/reports'

export const getAllReports = async (authToken) => {
  return await apiRequest(`${BASE_URL}/all`, {
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

export const submitReport = async (reportId, authToken) => {
  return await apiRequest(`${BASE_URL}/${reportId}/submit`, {
    method: 'POST',
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

export const exportSummaryExcel = async (authToken) => {
  const response = await fetch(`${appConfig.apiBaseUrl}${BASE_URL}/export/summary`, {
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
