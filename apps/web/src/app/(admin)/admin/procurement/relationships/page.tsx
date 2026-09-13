import Link from 'next/link'
import {
  getBrandSupplierRelationships,
  getSuppliers,
  SEED_BRANDS,
} from '@halo-rc/db'
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
    <div>
      <ProcurementNav currentTab="relationships" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Brand &amp; Supplier Distribution Rights
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Authoritative audit trail for manufacturer distribution channels. Explicitly distinguishes official authorization from unverified reseller claims.
          </p>
        </div>
      </div>

      {/* Relationships Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Brand
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Channel Type
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Territory
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Status
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Evidence Source
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600, display: 'block' }}>
                    {row.brand?.name ?? row.brandId}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${row.supplierId}`}
                    style={{ color: 'var(--colour-white)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {row.supplier?.name ?? row.supplierId}
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
                    {row.relationshipType.replace('_', ' ')}
                    {row.isExclusive ? ` [${row.exclusivityScope ?? 'EXCLUSIVE'}]` : ''}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)' }}>
                    {row.territory}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      backgroundColor: row.verificationStatus === 'VERIFIED' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                      color: row.verificationStatus === 'VERIFIED' ? 'var(--colour-halo)' : 'var(--colour-race)',
                      border: `1px solid ${row.verificationStatus === 'VERIFIED' ? 'var(--colour-halo)' : 'var(--colour-race)'}`,
                    }}
                  >
                    {row.verificationStatus}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {row.evidenceSourceType}
                    {row.evidenceNotes && ` — ${row.evidenceNotes.slice(0, 45)}...`}
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
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
                          padding: 'var(--space-1) var(--space-3)',
                          backgroundColor: 'var(--colour-carbon)',
                          border: '1px solid var(--colour-steel)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--colour-halo)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer',
                        }}
                      >
                        Verify &check;
                      </button>
                    </form>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                      Audited &check;
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
