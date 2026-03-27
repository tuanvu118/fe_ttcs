export function mapSemesterStatusLabel(isActive) {
  return isActive ? 'Đang hoạt động' : 'Không hoạt động'
}

export function formatSemesterDate(value) {
  if (!value) {
    return 'Chưa cập nhật'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Chưa cập nhật'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

export function toDateTimeLocalValue(value) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export function toApiDateTimeValue(value) {
  if (!value) {
    return null
  }

  return value.length === 16 ? `${value}:00` : value
}
