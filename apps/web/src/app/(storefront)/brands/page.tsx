import type { Metadata } from 'next'
import Link from 'next/link'
import s from './brands.module.css'
import { PageHero } from '@/components/layout/PageHero'
import { getBrandsList } from '@halo-rc/db'
import type { CommercialRelationship } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'Brand Universe — Avorria RC',
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
    <>
      <PageHero
        eyebrow="Brand Universe"
        headline={"The Authoritative\nRoster"}
        subline="We distinguish between authorised dealers, distributor-sourced brands, and researched imports. Supply status is stated accurately — no grey-market ambiguity."
        imageSrc="/images/disciplines/scale.jpg"
        imagePosition="center 45%"
      />
      <div className={s.page}>
        <div className={s.container}>

        <div className={s.groupsStack}>
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionTitle}>
                  {group.label}
                </h2>
                <div className={s.sectionRule} />
              </div>

              <div className={s.brandsGrid}>
                {group.brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    className={s.brandCard}
                  >
                    <div>
                      <div className={s.cardHeader}>
                        <span className={s.brandName}>
                          {brand.name}
                        </span>
                        <span className={s.countryTag}>
                          {brand.countryOfOrigin}
                        </span>
                      </div>

                      <p className={s.brandDescription}>
                        {brand.description}
                      </p>
                    </div>

                    <div className={s.cardFooter}>
                      <span
                        className={s.relationshipLabel}
                        style={{ color: commercialRelationshipColour(brand.commercialRelationship) }}
                      >
                        {commercialRelationshipLabel(brand.commercialRelationship)}
                      </span>
                      <span className={s.countsLabel}>
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
    </>
  )
}
