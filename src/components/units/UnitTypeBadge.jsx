import { Buildings, UsersThree, Gear } from '@phosphor-icons/react'

const TYPE_CONFIG = {
  lck: {
    label: 'Liên chi khoa',
    icon: <UsersThree size={14} weight="bold" color="#2563eb" />,
    style: { background: '#f4f7ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  },
  clb: {
    label: 'Câu lạc bộ',
    icon: <Buildings size={14} weight="bold" color="#0d9488" />,
    style: { background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1' },
  },
  system: {
    label: 'Hệ thống',
    icon: <Gear size={14} weight="bold" color="#334155" />,
    style: { background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' },
  },
  unknown: {
    label: 'Không rõ',
    icon: null,
    style: { background: '#ffffff', color: '#64748b', border: '1px dashed #cbd5e1' },
  },
}

function UnitTypeBadge({ type }) {
  const key = typeof type === 'string' ? type.toLowerCase() : 'unknown'
  const config = TYPE_CONFIG[key] || TYPE_CONFIG.unknown

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0.4rem 0.85rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      ...config.style,
    }}>
      {config.icon}
      {config.label}
    </span>
  )
}

export default UnitTypeBadge
