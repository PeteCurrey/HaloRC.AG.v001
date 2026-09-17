import { AdminTabs } from '@/components/admin'

interface ProcurementNavProps {
  currentTab?: string
}

export function ProcurementNav({ currentTab }: ProcurementNavProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', href: '/admin/procurement' },
    { id: 'suppliers', label: 'Suppliers', href: '/admin/procurement/suppliers' },
    { id: 'brands', label: 'Brand Sourcing', href: '/admin/procurement/brands' },
    { id: 'contacts', label: 'Contacts', href: '/admin/procurement/contacts' },
    { id: 'applications', label: 'Applications', href: '/admin/procurement/applications' },
    { id: 'tasks', label: 'Tasks', href: '/admin/procurement/tasks' },
    { id: 'relationships', label: 'Relationships', href: '/admin/procurement/relationships' },
    { id: 'pipeline', label: 'Pipeline Board', href: '/admin/procurement/pipeline' },
    { id: 'unmatched', label: 'Unmatched Queue', href: '/admin/procurement/unmatched' },
    { id: 'import', label: 'Import Feed', href: '/admin/procurement/import' },
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      <AdminTabs tabs={tabs} activeId={currentTab} />
    </div>
  )
}
