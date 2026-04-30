import { getCurrentCoordinates } from '../utils/geolocation'
import { writeStorage } from '../utils/storage'

const LOCATION_STORAGE_KEY = 'lastKnownLocation'
const LOCATION_UPDATE_INTERVAL_MS = 30_000

let intervalId = null

async function saveCurrentLocation() {
  try {
    const { latitude, longitude } = await getCurrentCoordinates()
    const payload = {
      latitude,
      longitude,
      savedAt: new Date().toISOString(),
    }

    writeStorage(LOCATION_STORAGE_KEY, payload)
    console.log('[location-heartbeat] saved location:', payload)
  } catch (error) {
    // Keep silent in UI; background updater should not interrupt users.
  }
}

export function startLocationHeartbeat() {
  if (intervalId !== null) {
    return
  }

  saveCurrentLocation()
  intervalId = window.setInterval(saveCurrentLocation, LOCATION_UPDATE_INTERVAL_MS)
}

export function stopLocationHeartbeat() {
  if (intervalId === null) {
    return
  }

  window.clearInterval(intervalId)
  intervalId = null
}

export { LOCATION_STORAGE_KEY, LOCATION_UPDATE_INTERVAL_MS }
