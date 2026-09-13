import Link from 'next/link'
import {
  SEED_BRANDS,
  getBrandSourcingView,
} from '@halo-rc/db'
import { ProcurementNav } from '../ProcurementNav'

export default async function BrandSourcingMatrixPage() {
  const brands = SEED_BRANDS

  const brandSourcingRows = await Promise.all(
    brands.map(async (brand) => {
      const ukSourcing = await getBrandSourcingView(brand.id, 'UK')
      const usSourcing = await getBrandSourcingView(brand.id, 'USA')
      return {
        brand,
        uk: ukSourcing,
        us: usSourcing,
      }
    })
  )

  return (
    <div>
      <ProcurementNav currentTab="brands" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Multi-Market Supply Architecture
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Brand Sourcing Matrix
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Authoritative mapping of brand manufacturers to official territorial distributors and unverified reseller feeds. Distinguishes verified distribution rights from independent grey-market sources.
          </p>
        </div>

        <Link
          href="/admin/procurement/relationships"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-charcoal)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--colour-white)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
          }}
        >
          View All Relationships &rarr;
        </Link>
      </div>

      {/* Brand Sourcing Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {brandSourcingRows.map(({ brand, uk, us }) => (
          <div
            key={brand.id}
            style={{
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--colour-white)' }}>
                  {brand.name}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginLeft: 'var(--space-3)' }}>
                  Origin: {brand.countryOfOrigin ?? 'Unknown'} • Direct: {uk.directManufacturer?.name ?? 'None on file'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: uk.isPurchasableInTerritory ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                    color: uk.isPurchasableInTerritory ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                    border: `1px solid ${uk.isPurchasableInTerritory ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                  }}
                >
                  UK: {uk.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
                </span>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: us.isPurchasableInTerritory ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                    color: us.isPurchasableInTerritory ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                    border: `1px solid ${us.isPurchasableInTerritory ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                  }}
                >
                  US: {us.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {/* UK Territory Sourcing */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
                  UK Sourcing &amp; Distribution
                </span>

                {uk.verifiedDistributors.length > 0 ? (
                  <div>
                    {uk.verifiedDistributors.map((vd) => (
                      <div key={vd.relationship.id} style={{ marginBottom: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-xs)', display: 'block' }}>
                          {vd.supplier.name} ({vd.relationship.relationshipType.replace('_', ' ')})
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                          Verified via {vd.relationship.evidenceSourceType} • Account: {vd.supplier.relationshipStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    No verified UK distributors.
                  </span>
                )}

                {uk.unverifiedDistributors.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--colour-steel)' }}>
                    <span style={{ color: 'var(--colour-race)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                      ⚠️ Unverified Resellers:
                    </span>
                    {uk.unverifiedDistributors.map((ud) => (
                      <div key={ud.relationship.id} style={{ fontSize: '11px', color: 'var(--colour-smoke)' }}>
                        {ud.supplier.name} ({ud.relationship.relationshipType}) — pending contract verification
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* USA Territory Sourcing */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
                  USA Sourcing &amp; Distribution
                </span>

                {us.verifiedDistributors.length > 0 ? (
                  <div>
                    {us.verifiedDistributors.map((vd) => (
                      <div key={vd.relationship.id} style={{ marginBottom: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-xs)', display: 'block' }}>
                          {vd.supplier.name} ({vd.relationship.relationshipType.replace('_', ' ')})
                          {vd.relationship.isExclusive && ' [EXCLUSIVE]'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                          Verified via {vd.relationship.evidenceSourceType} • Account: {vd.supplier.relationshipStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    No verified US distributors.
                  </span>
                )}

                {us.hasExclusivityConstraint && us.exclusiveSupplier && (
                  <div style={{ marginTop: 'var(--space-3)', fontSize: '11px', color: 'var(--colour-smoke)' }}>
                    Exclusive territorial distributor: <strong>{us.exclusiveSupplier.name}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
