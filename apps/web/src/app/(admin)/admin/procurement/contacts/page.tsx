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
              Procurement Operations
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Supplier Contacts Directory
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Direct manufacturer account reps, wholesale sales managers, credit controllers, and technical warranty liaisons.
          </p>
        </div>
      </div>

      {/* Contacts Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Contact Name / Title
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier Partner
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Role
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Email
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Phone
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Primary
              </th>
            </tr>
          </thead>
          <tbody>
            {contactRows.map((contact) => (
              <tr key={contact.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600, display: 'block' }}>
                    {contact.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {contact.title ?? 'Commercial Representative'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${contact.supplierId}`}
                    style={{ color: 'var(--colour-white)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {contact.supplier?.name ?? contact.supplierId}
                  </Link>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: 'var(--colour-charcoal)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--colour-smoke)',
                    }}
                  >
                    {contact.role.replace('_', ' ')}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {contact.email ?? '—'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {contact.phone ?? '—'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  {contact.isPrimary && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--colour-halo-10)',
                        color: 'var(--colour-halo)',
                        border: '1px solid var(--colour-halo)',
                      }}
                    >
                      PRIMARY
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
