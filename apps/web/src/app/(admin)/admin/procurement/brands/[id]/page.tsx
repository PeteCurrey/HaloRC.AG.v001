import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  SEED_BRANDS,
  getBrandSourcingView,
  getBrandSupplierRelationships,
  getSuppliers,
} from '@halo-rc/db'
import { ProcurementNav } from '../../ProcurementNav'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BrandProcurementDetailPage({ params }: PageProps) {
  const { id } = await params
  const brand = SEED_BRANDS.find((b) => b.id === id || b.slug === id)
  if (!brand) notFound()

  const [ukSourcing, usSourcing, allRelationships, suppliers] = await Promise.all([
    getBrandSourcingView(brand.id, 'UK'),
    getBrandSourcingView(brand.id, 'USA'),
    getBrandSupplierRelationships(brand.id),
    getSuppliers(),
  ])

  const relsWithSupplier = allRelationships.map((r) => {
    const supplier = suppliers.find((s) => s.id === r.supplierId)
    return {
      ...r,
      supplier,
    }
  })

  return (
    <div>
      <ProcurementNav currentTab="brands" />

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/procurement/brands" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          &larr; Back to Brands
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-halo)' }}>{brand.name}</span>
      </div>

      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              {brand.name}
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--colour-halo-10)',
                color: 'var(--colour-halo)',
                border: '1px solid var(--colour-halo)',
              }}
            >
              {brand.tier}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            <span>Origin: <strong style={{ color: 'var(--colour-white)' }}>{brand.countryOfOrigin ?? 'Unknown'}</strong></span>
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colour-smoke)' }}>
                Official Site &nearr;
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sourcing Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* UK Route */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-3)' }}>
            UK Sourcing Route: {ukSourcing.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
          </span>
          {ukSourcing.directManufacturer && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', display: 'block' }}>Direct Manufacturer</span>
              <Link href={`/admin/procurement/suppliers/${ukSourcing.directManufacturer.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                {ukSourcing.directManufacturer.name}
              </Link>
            </div>
          )}
          {ukSourcing.verifiedDistributors.map((vd) => (
            <div key={vd.relationship.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', display: 'block' }}>Official Distributor</span>
              <Link href={`/admin/procurement/suppliers/${vd.supplier.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                {vd.supplier.name}
              </Link>
              <div style={{ fontSize: '11px', color: 'var(--colour-ash)', marginTop: 2 }}>
                Account: {vd.supplier.procurementStatus ?? vd.supplier.relationshipStatus}
              </div>
            </div>
          ))}
          {ukSourcing.verifiedDistributors.length === 0 && !ukSourcing.directManufacturer && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
              No verified UK supply routes.
            </p>
          )}
        </div>

        {/* US Route */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-3)' }}>
            USA Sourcing Route: {usSourcing.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
          </span>
          {usSourcing.verifiedDistributors.map((vd) => (
            <div key={vd.relationship.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', display: 'block' }}>
                Official Distributor {vd.relationship.isExclusive && '[EXCLUSIVE]'}
              </span>
              <Link href={`/admin/procurement/suppliers/${vd.supplier.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                {vd.supplier.name}
              </Link>
            </div>
          ))}
          {usSourcing.verifiedDistributors.length === 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
              No verified US supply routes.
            </p>
          )}
        </div>
      </div>

      {/* All Suppliers Mapping Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            All Sourcing &amp; Distribution Relationships ({relsWithSupplier.length})
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Supplier</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Relationship</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Territory</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Verification</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Evidence</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {relsWithSupplier.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Link href={`/admin/procurement/suppliers/${r.supplierId}`} style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
                    {r.supplier?.name ?? r.supplierId}
                  </Link>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)' }}>
                  {r.relationshipType.replace(/_/g, ' ')} {r.isExclusive && '• [EXCLUSIVE]'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                  {r.territory}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: r.verificationStatus === 'VERIFIED' ? 'var(--colour-halo-10)' : 'var(--colour-carbon)', color: r.verificationStatus === 'VERIFIED' ? 'var(--colour-halo)' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                    {r.verificationStatus}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--colour-ash)' }}>
                  {r.evidenceSourceType} {r.evidenceNotes ? `— ${r.evidenceNotes}` : ''}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  <Link href={`/admin/procurement/suppliers/${r.supplierId}`} style={{ fontSize: '11px', color: 'var(--colour-halo)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
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
