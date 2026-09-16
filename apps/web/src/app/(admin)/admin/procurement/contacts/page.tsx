import Link from 'next/link'
import {
  getSupplierContacts,
  getSuppliers,
} from '@halo-rc/db'
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
    <div>
      <ProcurementNav currentTab="contacts" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement Directory
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Supplier Contacts Directory
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Directory of key supplier contacts: commercial sales, trade coordinators, credit control, and technical support.
          </p>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-sm)' }}>
          {contactRows.length} Contacts
        </span>
      </div>

      {/* Contacts Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Contact Person
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier Entity
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Role / Function
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Email
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Phone / Mobile
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {contactRows.map((ct) => (
              <tr key={ct.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--colour-white)', fontSize: 'var(--text-sm)' }}>
                      {ct.firstName ? `${ct.firstName} ${ct.lastName}` : ct.name}
                    </span>
                    {ct.isPrimary && (
                      <span style={{ fontSize: '10px', color: 'var(--colour-halo)', fontFamily: 'var(--font-mono)' }}>
                        [PRIMARY]
                      </span>
                    )}
                  </div>
                  {ct.title && (
                    <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                      {ct.title}
                    </span>
                  )}
                </td>

                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${ct.supplierId}`}
                    style={{ color: 'var(--colour-white)', textDecoration: 'none', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                  >
                    {ct.supplier?.name ?? ct.supplierId}
                  </Link>
                  <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block' }}>
                    {ct.supplier?.country ?? 'Unknown'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                  {ct.role.replace(/_/g, ' ')}
                </td>

                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                  {ct.email ? (
                    <a href={`mailto:${ct.email}`} style={{ color: 'var(--colour-smoke)', textDecoration: 'none' }}>
                      {ct.email}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--colour-slate)' }}>None</span>
                  )}
                </td>

                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                  {ct.phone ?? ct.mobile ?? 'None'}
                </td>

                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${ct.supplierId}`}
                    style={{ fontSize: '11px', color: 'var(--colour-halo)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                  >
                    Supplier &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
