import * as XLSX from 'xlsx'

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
    return value.toISOString()
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '[Không thể chuyển thành chuỗi]'
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

function pickEventDate(data) {
  const candidates = [
    data?.start_at,
    data?.startAt,
    data?.event_date,
    data?.eventDate,
    data?.date,
    data?.occurred_at,
    data?.occurredAt,
    data?.created_at,
    data?.createdAt,
  ]
  for (const value of candidates) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value
    }
  }
  return ''
}

function buildSheetAoA({ eventData, registrations, semesterLabel }) {
  const eventDate = pickEventDate(eventData)
  const rows = [
    ['DANH SÁCH ĐĂNG KÝ HỖ TRỢ SỰ KIỆN'],
    [],
    ['THÔNG TIN SỰ KIỆN'],
    ['Tên sự kiện', stringifyCell(eventData?.title)],
    ['Ngày diễn ra sự kiện', formatViDateTime(eventDate)],
    ['Điểm thưởng', stringifyCell(eventData?.point)],
    ['Học kỳ', stringifyCell(semesterLabel || '')],
    [],
    ['Danh sách sinh viên đăng ký'],
    ['STT', 'MSV', 'Họ tên', 'Lớp', 'Email', 'Đơn vị', 'Điểm danh'],
  ]

  ;(registrations || []).forEach((item, index) => {
    const user = item?.user || {}
    rows.push([
      index + 1,
      stringifyCell(user.student_id),
      stringifyCell(user.full_name),
      stringifyCell(user.class_name),
      stringifyCell(user.email),
      stringifyCell(item?.unit_name),
      item?.checkIn ? 'Đã điểm danh' : 'Chưa điểm danh',
    ])
  })

  return rows
}

export function downloadUnitEventHtskExcel({ eventData, registrations, semesterLabel, routeEventId }) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(
    buildSheetAoA({
      eventData,
      registrations,
      semesterLabel,
    }),
  )
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách')

  const rawTitle = eventData?.title || 'HTSK'
  const safeTitle = String(rawTitle).replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80) || 'HTSK'
  const idSuffix = routeEventId ? `_${String(routeEventId)}` : ''
  XLSX.writeFile(wb, `${safeTitle}${idSuffix}_HTSK.xlsx`)
}
