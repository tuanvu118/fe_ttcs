export function readStorage(key) {
  const rawValue = window.localStorage.getItem(key)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

export function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key) {
  window.localStorage.removeItem(key)
}
