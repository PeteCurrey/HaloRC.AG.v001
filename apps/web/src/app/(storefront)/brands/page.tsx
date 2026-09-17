import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import s from './brands.module.css'
import { getBrandsList } from '@halo-rc/db'
import type { CommercialRelationship } from '@halo-rc/types'
import {
  HeroImage,
  ChapterIntro,
  BrandFeature,
  Quote,
} from '@/components/sections'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export const metadata: Metadata = {
  title: 'Brand Universe — Avorria RC',
  description:
    'Curated world of flagship manufacturers, specialist engineering brands, and competition tuners.',
}

const BRAND_HERO_IMAGES: Record<string, string> = {
  xray: '/images/brands/xray.jpg',
  awesomatix: '/images/brands/awesomatix.jpg',
  schumacher: '/images/brands/schumacher.jpg',
  traxxas: '/images/brands/traxxas.jpg',
  hobbywing: '/images/brands/hobbywing.jpg',
  sanwa: '/images/brands/sanwa.jpg',
}

function commercialRelationshipLabel(rel: CommercialRelationship): string {
  switch (rel) {
    case 'OFFICIAL_DEALER':
      return 'Authorised Dealer'
    case 'DISTRIBUTOR_SOURCED':
      return 'Distributor Sourced'
    case 'INDEPENDENT':
      return 'Independent'
    case 'RESEARCHED':
      return 'Researched'
    default:
      return 'Listed'
  }
}

function commercialRelationshipColour(rel: CommercialRelationship): string {
  switch (rel) {
    case 'OFFICIAL_DEALER':
      return 'var(--colour-verified)'
    case 'DISTRIBUTOR_SOURCED':
      return 'var(--colour-halo)'
    case 'INDEPENDENT':
      return 'var(--colour-caution)'
    default:
      return 'var(--colour-smoke)'
  }
}

export default async function BrandsPage() {
  const brands = await getBrandsList()

  // Featured top engineering marques for editorial hero features
  const featuredMarques = brands.filter((b) =>
    ['xray', 'awesomatix', 'schumacher'].includes(b.slug)
  )

  // Group brands by tier for visual hierarchy
  const haloBrands = brands.filter(
    (b) => b.tier === 'PREMIUM_COMPETITION' || b.tier === 'HALO_SCALE'
  )
  const flagshipBrands = brands.filter(
    (b) => b.tier === 'FLAGSHIP' || b.tier === 'DRIFT'
  )
  const specialistBrands = brands.filter(
    (b) => !['PREMIUM_COMPETITION', 'HALO_SCALE', 'FLAGSHIP', 'DRIFT'].includes(b.tier)
  )

  const groups = [
    { label: 'COMPETITION & PRECISION ENGINEERING', brands: haloBrands },
    { label: 'FLAGSHIP & SCALE CHASSIS', brands: flagshipBrands },
    { label: 'SPECIALIST ELECTRONICS & POWER SYSTEMS', brands: specialistBrands },
  ].filter((g) => g.brands.length > 0)

  return (
    <div className={s.pageWrapper}>
      {/* 1. Cinematic Hero */}
      <HeroImage
        eyebrow="The Authoritative Roster"
        heading={"Specialist Engineering\nMarques"}
        subline="We distinguish between authorised factory dealers, territorial distributor networks, and verified independent sourcing. Commercial relationships stated accurately — zero grey-market ambiguity."
        imageSrc="/images/disciplines/scale.jpg"
        imagePosition="center 40%"
        primaryCtaText="Explore Roster"
        primaryCtaHref="#roster"
        secondaryCtaText="Race Department"
        secondaryCtaHref="/race"
      />

      {/* 2. Chapter 01: Featured Marques */}
      <ChapterIntro
        number="01"
        title="FLAGSHIP PARTNERSHIPS"
        intro="The cornerstone manufacturers anchoring the Avorria engineering supply network."
        surface="dark"
      />

      {/* Feature top marque editorially */}
      {(() => {
        const topMarque = featuredMarques[0]
        if (!topMarque) return null
        return (
          <BrandFeature
            name={topMarque.name}
            country={topMarque.countryOfOrigin || 'Europe'}
            specialism={
              topMarque.slug === 'xray'
                ? 'World Championship Touring & Buggy Architecture'
                : 'Precision Engineering'
            }
            status={commercialRelationshipLabel(
              topMarque.commercialRelationship
            )}
            description={
              topMarque.description ||
              'Pioneering competition engineering with precision tolerances, premium metallurgy, and an international championship winning track record.'
            }
            imageSrc={BRAND_HERO_IMAGES[topMarque.slug] || '/images/brands/xray.jpg'}
            href={`/brands/${topMarque.slug}`}
          />
        )
      })()}

      {/* 3. Statement on Sourcing Transparency */}
      <Quote
        statement="Authenticity is not a marketing angle. We verify parts lineages, factory warranties, and manufacturer setups at the source before listing."
        attribution="Avorria Standards of Supply"
        align="center"
        surface="light"
      />

      {/* 4. Complete Brand Index with Visual Hierarchy */}
      <div id="roster" className={s.page}>
        <div className={s.container}>
          <div className={s.groupsStack}>
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <ScrollReveal variant="slide">
                  <div className={s.sectionHeader}>
                    <h2 className={s.sectionTitle}>{group.label}</h2>
                    <div className={s.sectionRule} />
                  </div>
                </ScrollReveal>

                <div className={s.brandsGrid}>
                  {group.brands.map((brand) => {
                    const brandImg = BRAND_HERO_IMAGES[brand.slug]
                    return (
                      <Link
                        key={brand.id}
                        href={`/brands/${brand.slug}`}
                        className={s.brandCard}
                      >
                        {brandImg && (
                          <div className={s.brandCardMedia}>
                            <Image
                              src={brandImg}
                              alt={brand.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              style={{ objectFit: 'cover' }}
                            />
                            <div className={s.brandCardMediaScrim} />
                          </div>
                        )}

                        <div className={s.brandCardBody}>
                          <div className={s.cardHeader}>
                            <span className={s.brandName}>{brand.name}</span>
                            <span className={s.countryTag}>
                              {brand.countryOfOrigin}
                            </span>
                          </div>

                          <p className={s.brandDescription}>
                            {brand.description}
                          </p>

                          <div className={s.cardFooter}>
                            <span
                              className={s.relationshipLabel}
                              style={{
                                color: commercialRelationshipColour(
                                  brand.commercialRelationship
                                ),
                              }}
                            >
                              {commercialRelationshipLabel(
                                brand.commercialRelationship
                              )}
                            </span>
                            <span className={s.countsLabel}>
                              {brand.machinesCount > 0 &&
                                `${brand.machinesCount} platform${
                                  brand.machinesCount > 1 ? 's' : ''
                                }`}
                              {brand.machinesCount > 0 &&
                                brand.partsCount > 0 &&
                                ' · '}
                              {brand.partsCount > 0 &&
                                `${brand.partsCount} part${
                                  brand.partsCount > 1 ? 's' : ''
                                }`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
