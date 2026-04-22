import * as XLSX from 'xlsx/xlsx.mjs'

function stringifyCell(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toLocaleString('vi-VN')
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function formatViDateTime(rawValue) {
  if (!rawValue) {
    return ''
  }
  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) {
    return stringifyCell(rawValue)
  }
  return date.toLocaleString('vi-VN')
}

export function downloadPublicEventExcel({ eventData, registrations, semesterLabel }) {
  const wb = XLSX.utils.book_new()
  
  // 1. Build Headers
  const baseHeaders = ['STT', 'MSSV', 'Họ tên', 'Ngày đăng ký']
  const formFields = eventData?.form_fields || []
  
  // Add dynamic headers from form fields
  formFields.forEach(field => {
    baseHeaders.push(field.label)
  })

  // 2. Build AoA (Array of Arrays)
  const rows = [
    ['BÁO CÁO DANH SÁCH SINH VIÊN ĐĂNG KÝ SỰ KIỆN CÔNG KHAI'],
    [],
    ['THÔNG TIN SỰ KIỆN'],
    ['Tên sự kiện:', stringifyCell(eventData?.title)],
    ['Địa điểm:', stringifyCell(eventData?.location)],
    ['Học kỳ:', stringifyCell(semesterLabel || '')],
    [],
    ['DANH SÁCH CHI TIẾT'],
    baseHeaders
  ]

  // 3. Fill Data
  ;(registrations || []).forEach((reg, index) => {
    const row = [
      index + 1,
      stringifyCell(reg.student_id),
      stringifyCell(reg.full_name),
      formatViDateTime(reg.registered_at)
    ]

    // Map answers to columns
    formFields.forEach(field => {
      const answer = (reg.answers || []).find(a => a.field_id === field.id)
      row.push(stringifyCell(answer?.value || ''))
    })

    rows.push(row)
  })

  // 4. Create and Append Sheet
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách đăng ký')

  // 5. Trigger download
  const rawTitle = eventData?.title || 'Su_kien_cong_khai'
  const safeTitle = String(rawTitle).replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80)
  XLSX.writeFile(wb, `Danh_sach_dang_ky_${safeTitle}.xlsx`)
}
