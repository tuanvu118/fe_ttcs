import { getUnitInitials } from '../../utils/unitUtils'

function UnitLogo({ logo, name, size = 'medium' }) {
  const className = `unit-logo unit-logo-${size}`

  if (logo) {
    return <img className={className} src={logo} alt={name || 'Logo đơn vị'} />
  }

  return <span className={`${className} unit-logo-fallback`}>{getUnitInitials(name)}</span>
}

export default UnitLogo
