import type { Metadata } from 'next'
import Link from 'next/link'
import { getBrandsList } from '@halo-rc/db'
import type { CommercialRelationship } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'Brand Universe — Halo RC',
  description: 'Curated world of flagship manufacturers, specialist engineering brands, and competition tuners.',
}

function commercialRelationshipLabel(rel: CommercialRelationship): string {
  switch (rel) {
    case 'OFFICIAL_DEALER': return 'Authorised Dealer'
    case 'DISTRIBUTOR_SOURCED': return 'Distributor Sourced'
    case 'INDEPENDENT': return 'Independent'
    case 'RESEARCHED': return 'Researched'
    default: return 'Listed'
  }
}

function commercialRelationshipColour(rel: CommercialRelationship): string {
  switch (rel) {
    case 'OFFICIAL_DEALER': return 'var(--colour-verified)'
    case 'DISTRIBUTOR_SOURCED': return 'var(--colour-halo)'
    case 'INDEPENDENT': return 'var(--colour-caution)'
    default: return 'var(--colour-smoke)'
  }
}

export default async function BrandsPage() {
  const brands = await getBrandsList()

  // Group brands by tier for visual hierarchy
  const haloBrands = brands.filter((b) => b.tier === 'PREMIUM_COMPETITION' || b.tier === 'HALO_SCALE')
  const flagshipBrands = brands.filter((b) => b.tier === 'FLAGSHIP' || b.tier === 'DRIFT')
  const specialistBrands = brands.filter(
    (b) => !['PREMIUM_COMPETITION', 'HALO_SCALE', 'FLAGSHIP', 'DRIFT'].includes(b.tier)
  )

  const groups = [
    { label: 'COMPETITION & PRECISION', brands: haloBrands },
    { label: 'FLAGSHIP & SCALE', brands: flagshipBrands },
    { label: 'SPECIALIST & ELECTRONICS', brands: specialistBrands },
  ].filter((g) => g.brands.length > 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-2)' }}>
          Brand Universe
        </p>
        <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
          The Authoritative Roster
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '54ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-10)' }}>
          We distinguish between authorised dealers, distributor-sourced brands, and researched imports.
          Supply status is stated accurately — no grey-market ambiguity.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
          {groups.map((group) => (
            <section key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                  {group.label}
                </h2>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--colour-steel)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                {group.brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    style={{
                      padding: 'var(--space-5)',
                      backgroundColor: 'var(--colour-carbon)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'var(--font-primary)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--colour-off-white)' }}>
                        {brand.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                        {brand.countryOfOrigin}
                      </span>
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: '1.5' }}>
                      {brand.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.5625rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: commercialRelationshipColour(brand.commercialRelationship),
                        }}
                      >
                        {commercialRelationshipLabel(brand.commercialRelationship)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--colour-steel)' }}>
                        {brand.machinesCount > 0 && `${brand.machinesCount} machine${brand.machinesCount > 1 ? 's' : ''}`}
                        {brand.machinesCount > 0 && brand.partsCount > 0 && ' · '}
                        {brand.partsCount > 0 && `${brand.partsCount} part${brand.partsCount > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
