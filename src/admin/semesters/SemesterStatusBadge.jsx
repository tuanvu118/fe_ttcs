import { mapSemesterStatusLabel } from '../../utils/semesterUtils'
import styles from './adminSemesters.module.css'

function SemesterStatusBadge({ isActive }) {
  return (
    <span className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}>
      {mapSemesterStatusLabel(isActive)}
    </span>
  )
}

export default SemesterStatusBadge
