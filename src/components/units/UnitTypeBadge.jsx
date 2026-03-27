import { formatUnitType } from '../../utils/unitUtils'

function UnitTypeBadge({ type }) {
  const normalizedType = typeof type === 'string' ? type.toLowerCase() : 'unknown'

  return (
    <span className={`unit-type-badge unit-type-badge-${normalizedType}`}>
      {formatUnitType(type)}
    </span>
  )
}

export default UnitTypeBadge
