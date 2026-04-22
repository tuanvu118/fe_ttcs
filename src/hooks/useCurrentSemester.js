import { useState, useEffect } from 'react'
import { getStoredCurrentSemester, writeStoredCurrentSemester } from '../utils/currentSemesterStorage'

/**
 * useCurrentSemester - Hook để truy cập và theo dõi sự thay đổi của học kỳ hiện hành.
 * Hỗ trợ đồng bộ hóa giữa các tab và giữa các thành phần giao diện.
 */
export function useCurrentSemester() {
  const [semester, setSemester] = useState(() => getStoredCurrentSemester())

  useEffect(() => {
    const handleSemesterChange = (event) => {
      setSemester(event.detail || null)
    }

    const handleStorageChange = (event) => {
      if (event.key === 'dtn_current_semester') {
        try {
          const newSemester = JSON.parse(event.newValue)
          setSemester(newSemester)
        } catch {
          setSemester(null)
        }
      }
    }

    window.addEventListener('semesterChanged', handleSemesterChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('semesterChanged', handleSemesterChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const updateSemester = (newSemester) => {
    writeStoredCurrentSemester(newSemester)
  }

  return [semester, updateSemester]
}
