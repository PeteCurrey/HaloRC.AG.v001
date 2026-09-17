import Link from 'next/link'
import {
  getSupplierContacts,
  getSuppliers,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminTable,
  AdminTableRow,
  AdminAction,
} from '@/components/admin'
import { ProcurementNav } from '../ProcurementNav'

export default async function SupplierContactsPage() {
  const contacts = await getSupplierContacts()
  const suppliers = await getSuppliers()

  const contactRows = contacts.map((c) => {
    const supplier = suppliers.find((s) => s.id === c.supplierId)
    return {
      ...c,
      supplier,
    }
  })

  return (
    <>
      <AdminPageHeader
        category="Procurement Directory"
        title="Supplier Contacts Directory"
        description="Directory of key supplier contacts: commercial sales, trade coordinators, credit control, and technical support."
        status={
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', backgroundColor: '#EFEFED', padding: '2px 8px', borderRadius: 3 }}>
            {contactRows.length} Contacts
          </span>
        }
      />

      <ProcurementNav currentTab="contacts" />

      <AdminSection>
        <AdminPanel padding="none">
          <AdminTable
            columns={[
              'Contact Person',
              'Supplier Entity',
              'Role / Function',
              'Email',
              'Phone / Mobile',
              { header: 'Action', align: 'right' },
            ]}
          >
            {contactRows.map((ct) => (
              <AdminTableRow
                key={ct.id}
                cells={[
                  <div key="person">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#111317', fontSize: '0.8125rem' }}>
                        {ct.firstName ? `${ct.firstName} ${ct.lastName}` : ct.name}
                      </span>
                      {ct.isPrimary && (
                        <span style={{ fontSize: '0.625rem', color: '#B8935A', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                          [PRIMARY]
                        </span>
                      )}
                    </div>
                    {ct.title && (
                      <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                        {ct.title}
                      </span>
                    )}
                  </div>,

                  <div key="supplier">
                    <Link
                      href={`/admin/procurement/suppliers/${ct.supplierId}`}
                      style={{ color: '#111317', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {ct.supplier?.name ?? ct.supplierId}
                    </Link>
                    <span style={{ fontSize: '0.6875rem', color: '#767A85', display: 'block' }}>
                      {ct.supplier?.country ?? 'Unknown'}
                    </span>
                  </div>,

                  <span key="role" style={{ fontSize: '0.75rem', color: '#494D55' }}>
                    {ct.role.replace(/_/g, ' ')}
                  </span>,

                  <div key="email" style={{ fontSize: '0.75rem' }}>
                    {ct.email ? (
                      <a href={`mailto:${ct.email}`} style={{ color: '#494D55', textDecoration: 'none' }}>
                        {ct.email}
                      </a>
                    ) : (
                      <span style={{ color: '#767A85' }}>None</span>
                    )}
                  </div>,

                  <span key="phone" style={{ fontSize: '0.75rem', color: '#494D55' }}>
                    {ct.phone ?? ct.mobile ?? 'None'}
                  </span>,

                  <AdminAction key="action" href={`/admin/procurement/suppliers/${ct.supplierId}`} variant="secondary" size="sm">
                    Supplier →
                  </AdminAction>,
                ]}
              />
            ))}
          </AdminTable>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
