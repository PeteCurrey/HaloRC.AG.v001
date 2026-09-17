import Link from 'next/link'
import {
  getBrandSupplierRelationships,
  getSuppliers,
  SEED_BRANDS,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminTable,
  AdminTableRow,
  AdminStatus,
} from '@/components/admin'
import { ProcurementNav } from '../ProcurementNav'
import { verifyBrandSupplierRelationshipAction } from '@/actions/procurement'

export default async function RelationshipsDirectoryPage() {
  const relationships = await getBrandSupplierRelationships()
  const suppliers = await getSuppliers()
  const brands = SEED_BRANDS

  const rows = relationships.map((r) => {
    const supplier = suppliers.find((s) => s.id === r.supplierId)
    const brand = brands.find((b) => b.id === r.brandId)
    return {
      ...r,
      supplier,
      brand,
    }
  })

  return (
    <>
      <AdminPageHeader
        category="Procurement Intelligence"
        title="Brand & Supplier Distribution Rights"
        description="Authoritative audit trail for manufacturer distribution channels. Explicitly distinguishes official authorization from unverified reseller claims."
      />

      <ProcurementNav currentTab="relationships" />

      <AdminSection>
        <AdminPanel padding="none">
          <AdminTable
            columns={[
              'Brand',
              'Supplier',
              'Channel Type',
              'Territory',
              'Status',
              'Evidence Source',
              { header: 'Action', align: 'right' },
            ]}
          >
            {rows.map((row) => (
              <AdminTableRow
                key={row.id}
                cells={[
                  <span key="brand" style={{ color: '#111317', fontWeight: 600 }}>
                    {row.brand?.name ?? row.brandId}
                  </span>,

                  <Link
                    key="supplier"
                    href={`/admin/procurement/suppliers/${row.supplierId}`}
                    style={{ color: '#B8935A', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {row.supplier?.name ?? row.supplierId}
                  </Link>,

                  <span
                    key="type"
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: '#EFEFED',
                      borderRadius: 3,
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: '#494D55',
                    }}
                  >
                    {row.relationshipType.replace('_', ' ')}
                    {row.isExclusive ? ` [${row.exclusivityScope ?? 'EXCLUSIVE'}]` : ''}
                  </span>,

                  <span key="terr" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#111317' }}>
                    {row.territory}
                  </span>,

                  <AdminStatus
                    key="status"
                    status={row.verificationStatus === 'VERIFIED' ? 'verified' : 'warning'}
                    label={row.verificationStatus}
                  />,

                  <div key="evidence" style={{ fontSize: '0.75rem', color: '#767A85' }}>
                    {row.evidenceSourceType}
                    {row.evidenceNotes && ` — ${row.evidenceNotes.slice(0, 45)}...`}
                  </div>,

                  <div key="action" style={{ textAlign: 'right' }}>
                    {row.verificationStatus === 'UNVERIFIED' ? (
                      <form
                        action={async () => {
                          'use server'
                          await verifyBrandSupplierRelationshipAction({
                            brandId: row.brandId,
                            supplierId: row.supplierId,
                            territory: row.territory,
                            relationshipType: row.relationshipType,
                            verificationStatus: 'VERIFIED',
                            evidenceSourceType: row.evidenceSourceType,
                            evidenceUrl: row.evidenceUrl ?? null,
                            evidenceNotes: 'Staff audited manufacturer invoice & distribution agreement.',
                          })
                        }}
                      >
                        <button
                          type="submit"
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'transparent',
                            border: '1px solid #B8935A',
                            borderRadius: 3,
                            color: '#B8935A',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Verify ✓
                        </button>
                      </form>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', color: '#1A6E34', fontFamily: 'var(--font-mono, monospace)' }}>
                        Audited ✓
                      </span>
                    )}
                  </div>,
                ]}
              />
            ))}
          </AdminTable>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
