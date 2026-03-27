import { mapSemesterStatusLabel } from '../../utils/semesterUtils'

function SemesterStatusBadge({ isActive }) {
  return (
    <span className={isActive ? 'semester-status-badge active' : 'semester-status-badge inactive'}>
      {mapSemesterStatusLabel(isActive)}
    </span>
  )
}

export default SemesterStatusBadge
