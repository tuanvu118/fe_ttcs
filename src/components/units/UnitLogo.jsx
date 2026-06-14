function UnitLogo({ logo, name, size = 'medium' }) {
  const className = `unit-logo unit-logo-${size}`
  const logoSrc = logo || '/HuyHieuDoan.png'

  return <img className={className} src={logoSrc} alt={name || 'Logo đơn vị'} />
}

export default UnitLogo
