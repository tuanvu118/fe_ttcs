export function formatDateOfBirth(value) {
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
  }).format(parsedDate)
}

export function formatDateTime(value) {
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

export function getUserInitials(fullName) {
  if (!fullName) {
    return 'U'
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function getValidationMessage(error, fallbackMessage) {
  if (!error?.payload?.detail || !Array.isArray(error.payload.detail)) {
    return fallbackMessage
  }

  return error.payload.detail
    .map((item) => {
      const fieldPath = Array.isArray(item?.loc) ? item.loc.slice(1).join('.') : ''
      return fieldPath ? `${fieldPath}: ${item.msg}` : item.msg
    })
    .join('\n')
}
