import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { CalendarBlank } from '@phosphor-icons/react'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import { useCurrentSemester } from '../../hooks/useCurrentSemester'
import styles from './semesterSelector.module.css'

/**
 * SemesterSelector - Một component chọn học kỳ cao cấp.
 * @param {Object} props
 * @param {string} props.variant - 'sidebar' hoặc 'filter'
 * @param {boolean} props.showLabel - Có hiện nhãn mô tả không
 * @param {boolean} props.allowAll - Có cho phép chọn "Tất cả học kỳ" không
 */
export default function SemesterSelector({ 
  variant = 'filter', 
  showLabel = true, 
  allowAll = true,
  getPopupContainer
}) {
  const isSidebar = variant === 'sidebar'
  const [semester, updateSemester] = useCurrentSemester()
  const [semesters, setSemesters] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchSemesters()
  }, [])

  const fetchSemesters = async () => {
    setIsLoading(true)
    try {
      const token = getStoredAuthSession()?.accessToken
      if (!token) return
      
      const res = await getSemesters({ skip: 0, limit: 100 }, token)
      const list = res.items || []
      setSemesters(list)
      
      // If no semester is stored, try to use the active one
      if (!semester?.id && list.length > 0) {
        const active = list.find(s => s.is_active)
        if (active) updateSemester(active)
      }
    } catch (err) {
      console.error('Failed to fetch semesters in selector', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (id) => {
    if (id === 'all') {
      updateSemester({ id: 'all', name: 'Tất cả học kỳ' })
      return
    }
    const selected = semesters.find(s => s.id === id)
    if (selected) {
      updateSemester(selected)
    }
  }

  const currentId = semester?.id || 'all'
  const isCurrentActive = semester?.id !== 'all' ? semester?.is_active : false

  return (
    <div className={`${styles.selectorContainer} ${isSidebar ? styles.inSidebar : styles.inPage}`}>
      {!isSidebar && (
        <div className={styles.icon}>
           <CalendarBlank size={16} />
        </div>
      )}
      
      {isSidebar && (
        <>
          <div className={`${styles.icon} ${isCurrentActive ? styles.activeText : styles.inactiveText}`}>
            <CalendarBlank size={22} weight="duotone" />
          </div>
          {showLabel && (
            <div className={styles.label}>
              <small>Học kỳ</small>
              <strong>{currentId === 'all' ? 'Tổng quát' : 'Đang làm việc'}</strong>
            </div>
          )}
        </>
      )}

      <Select
        className={`${styles.select} ${!isSidebar && isCurrentActive ? styles.activeSelect : ''}`}
        value={currentId}
        loading={isLoading}
        onChange={handleChange}
        popupClassName="semester-select-dropdown"
        variant="borderless"
        getPopupContainer={getPopupContainer}
        dropdownStyle={{ minWidth: '220px' }}
      >
        {allowAll && (
          <Select.Option value="all">
            <span className={styles.optionName}>Tất cả học kỳ</span>
          </Select.Option>
        )}
        {semesters.map(s => (
          <Select.Option key={s.id} value={s.id}>
            <div className={styles.optionContent}>
              <span className={s.is_active ? styles.activeName : styles.inactiveName}>
                {s.name} <span className={styles.optionYear}>({s.academic_year})</span>
              </span>
            </div>
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}
