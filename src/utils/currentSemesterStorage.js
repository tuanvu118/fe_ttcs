import { readStorage, removeStorage, writeStorage } from './storage'

export const CURRENT_SEMESTER_STORAGE_KEY = 'dtn_current_semester'

const CURRENT_SEMESTER_KEY = CURRENT_SEMESTER_STORAGE_KEY

export function getStoredCurrentSemester() {
  return readStorage(CURRENT_SEMESTER_KEY)
}

export function writeStoredCurrentSemester(semester) {
  if (!semester?.id) {
    removeStorage(CURRENT_SEMESTER_KEY)
    return
  }
  writeStorage(CURRENT_SEMESTER_KEY, semester)
}

export function clearStoredCurrentSemester() {
  removeStorage(CURRENT_SEMESTER_KEY)
}
