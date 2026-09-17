import Link from 'next/link'
import {
  SEED_BRANDS,
  getBrandSourcingView,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminAction,
  AdminStatus,
} from '@/components/admin'
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
    <>
      <AdminPageHeader
        category="Multi-Market Supply Architecture"
        title="Brand Sourcing Matrix"
        description="Authoritative mapping of brand manufacturers to official territorial distributors and unverified reseller feeds. Distinguishes verified distribution rights from independent grey-market sources."
        actions={
          <AdminAction href="/admin/procurement/relationships" variant="secondary">
            View All Relationships →
          </AdminAction>
        }
      />

      <ProcurementNav currentTab="brands" />

      {/* Brand Sourcing Cards */}
      <AdminSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {brandSourcingRows.map(({ brand, uk, us }) => (
            <AdminPanel
              key={brand.id}
              title={brand.name}
              subtitle={`Origin: ${brand.countryOfOrigin ?? 'Unknown'} • Direct: ${uk.directManufacturer?.name ?? 'None on file'}`}
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <AdminStatus
                    status={uk.isPurchasableInTerritory ? 'verified' : 'neutral'}
                    label={`UK: ${uk.isPurchasableInTerritory ? 'Purchasable' : 'No Route'}`}
                  />
                  <AdminStatus
                    status={us.isPurchasableInTerritory ? 'verified' : 'neutral'}
                    label={`US: ${us.isPurchasableInTerritory ? 'Purchasable' : 'No Route'}`}
                  />
                </div>
              }
              padding="md"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {/* UK Territory Sourcing */}
                <div style={{ padding: 14, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#B8935A', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    UK Sourcing &amp; Distribution
                  </span>

                  {uk.verifiedDistributors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {uk.verifiedDistributors.map((vd) => (
                        <div key={vd.relationship.id}>
                          <span style={{ color: '#111317', fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>
                            {vd.supplier.name} ({vd.relationship.relationshipType.replace('_', ' ')})
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                            Verified via {vd.relationship.evidenceSourceType} • Account: {vd.supplier.relationshipStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#767A85' }}>
                      No verified UK distributors.
                    </span>
                  )}

                  {uk.unverifiedDistributors.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #E2E2DE' }}>
                      <span style={{ color: '#C8001A', fontSize: '0.625rem', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                        ⚠ Unverified Resellers:
                      </span>
                      {uk.unverifiedDistributors.map((ud) => (
                        <div key={ud.relationship.id} style={{ fontSize: '0.6875rem', color: '#494D55' }}>
                          {ud.supplier.name} ({ud.relationship.relationshipType}) — pending contract verification
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* USA Territory Sourcing */}
                <div style={{ padding: 14, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    USA Sourcing &amp; Distribution
                  </span>

                  {us.verifiedDistributors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {us.verifiedDistributors.map((vd) => (
                        <div key={vd.relationship.id}>
                          <span style={{ color: '#111317', fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>
                            {vd.supplier.name} ({vd.relationship.relationshipType.replace('_', ' ')})
                            {vd.relationship.isExclusive && ' [EXCLUSIVE]'}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                            Verified via {vd.relationship.evidenceSourceType} • Account: {vd.supplier.relationshipStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#767A85' }}>
                      No verified US distributors.
                    </span>
                  )}

                  {us.hasExclusivityConstraint && us.exclusiveSupplier && (
                    <div style={{ marginTop: 12, fontSize: '0.6875rem', color: '#767A85' }}>
                      Exclusive territorial distributor: <strong style={{ color: '#111317' }}>{us.exclusiveSupplier.name}</strong>
                    </div>
                  )}
                </div>
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>
    </>
  )
}
