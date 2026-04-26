const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

function mapGeolocationError(error) {
  switch (error?.code) {
    case 1:
      return new Error('Bạn đã từ chối quyền truy cập vị trí.')
    case 2:
      return new Error('Không thể xác định vị trí hiện tại.')
    case 3:
      return new Error('Yêu cầu lấy vị trí đã hết thời gian chờ.')
    default:
      return new Error('Không thể lấy vị trí người dùng.')
  }
}

export function getCurrentCoordinates(options = {}) {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ định vị.'))
  }

  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      },
      (error) => {
        reject(mapGeolocationError(error))
      },
      mergedOptions,
    )
  })
}
