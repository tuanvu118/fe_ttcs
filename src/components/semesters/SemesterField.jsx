import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import styles from './semesterSelector.module.css'

/**
 * SemesterField - Một component chọn học kỳ chuyên dụng cho các biểu mẫu (Forms).
 * @param {Object} props
 * @param {string} props.value - Giá trị semesterId hiện tại
 * @param {Function} props.onChange - Hàm xử lý khi thay đổi giá trị
 * @param {string} props.placeholder - Text hiển thị khi chưa chọn
 * @param {boolean} props.loading - Trạng thái đang tải bên ngoài (nếu có)
 */
export default function SemesterField({ value, onChange, placeholder = "Chọn học kỳ", loading = false }) {
  const [semesters, setSemesters] = useState([])
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    fetchSemesters()
  }, [])

  const fetchSemesters = async () => {
    setFetching(true)
    try {
      const token = getStoredAuthSession()?.accessToken
      if (!token) return
      
      const res = await getSemesters({ skip: 0, limit: 100 }, token)
      setSemesters(res.items || [])
    } catch (err) {
      console.error('Failed to fetch semesters in field', err)
    } finally {
      setFetching(false)
    }
  }

  const selectedSemester = semesters.find(s => s.id === value)
  const isCurrentActive = selectedSemester?.is_active

  return (
    <Select
      className={`${styles.fieldSelect} ${isCurrentActive ? styles.activeSelect : ''}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      loading={fetching || loading}
      popupClassName="semester-select-dropdown"
      dropdownStyle={{ minWidth: '280px' }}
    >
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
  )
}
