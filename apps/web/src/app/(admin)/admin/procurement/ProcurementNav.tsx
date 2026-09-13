import Link from 'next/link'

interface ProcurementNavProps {
  currentTab?: string
}

export function ProcurementNav({ currentTab }: ProcurementNavProps) {
  const tabs = [
    { label: 'Overview', href: '/admin/procurement', key: 'overview' },
    { label: 'Suppliers', href: '/admin/procurement/suppliers', key: 'suppliers' },
    { label: 'Trade Applications', href: '/admin/procurement/applications', key: 'applications' },
    { label: 'Brand Sourcing', href: '/admin/procurement/brands', key: 'brands' },
    { label: 'Relationships', href: '/admin/procurement/relationships', key: 'relationships' },
    { label: 'Contacts', href: '/admin/procurement/contacts', key: 'contacts' },
    { label: 'Pipeline Board', href: '/admin/procurement/pipeline', key: 'pipeline' },
    { label: 'Unmatched Queue', href: '/admin/procurement/unmatched', key: 'unmatched' },
    { label: 'Import Feed', href: '/admin/procurement/import', key: 'import' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        backgroundColor: 'var(--colour-carbon)',
        border: '1px solid var(--colour-steel)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-6)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              backgroundColor: isActive ? 'var(--colour-halo-10)' : 'transparent',
              color: isActive ? 'var(--colour-halo)' : 'var(--colour-ash)',
              border: `1px solid ${isActive ? 'var(--colour-halo)' : 'transparent'}`,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
