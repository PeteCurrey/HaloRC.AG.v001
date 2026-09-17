import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getMarketPreference } from '@/actions/market'
import { getBrandDetail } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency, CommercialRelationship } from '@halo-rc/types'
import {
  HeroImage,
  EditorialSplit,
  ChapterIntro,
  ProductFeature,
} from '@/components/sections'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

const BRAND_IMAGES: Record<string, { src: string; position?: string }> = {
  awesomatix: { src: '/images/brands/awesomatix.jpg', position: 'center 30%' },
  hobbywing: { src: '/images/brands/hobbywing.jpg', position: 'center 40%' },
  sanwa: { src: '/images/brands/sanwa.jpg', position: 'center 35%' },
  schumacher: { src: '/images/brands/schumacher.jpg', position: 'center 45%' },
  traxxas: { src: '/images/brands/traxxas.jpg', position: 'center 40%' },
  xray: { src: '/images/brands/xray.jpg', position: 'center 35%' },
}

interface BrandPageProps {
  params: Promise<{ slug: string }>
}

function commercialRelationshipCopy(
  rel: CommercialRelationship,
  brandName: string
): { badge: string; description: string; color: string } {
  switch (rel) {
    case 'OFFICIAL_DEALER':
      return {
        badge: 'Authorised Dealer',
        description: `Avorria RC is an authorised retailer for ${brandName}. All products are sourced directly from the factory with official manufacturer warranty and setup sheet access.`,
        color: 'var(--colour-verified)',
      }
    case 'DISTRIBUTOR_SOURCED':
      return {
        badge: 'Distributor Sourced',
        description: `${brandName} hardware is procured through official territorial distributor networks with verified authenticity and manufacturer parts backing.`,
        color: 'var(--colour-halo)',
      }
    case 'INDEPENDENT':
      return {
        badge: 'Independent Sourcing',
        description: `${brandName} inventory is obtained via independent verified supply routes.`,
        color: 'var(--colour-smoke)',
      }
    case 'RESEARCHED':
    default:
      return {
        badge: 'Catalogue Reference',
        description: `Information on ${brandName} is curated for catalogue and compatibility reference. Avorria RC does not claim authorised dealer status unless explicitly indicated.`,
        color: 'var(--colour-smoke)',
      }
  }
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const data = await getBrandDetail(slug, activeMarket)
  if (!data) {
    return { title: 'Brand Not Found — Avorria RC' }
  }
  return {
    title: `${data.brand.name} — Avorria RC`,
    description: data.brand.description,
  }
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const data = await getBrandDetail(slug, activeMarket)

  if (!data) {
    notFound()
  }

  const { brand, platforms, machines, parts } = data
  const relInfo = commercialRelationshipCopy(brand.commercialRelationship, brand.name)
  const heroImg =
    BRAND_IMAGES[brand.slug] ?? {
      src: '/images/brands/schumacher.jpg',
      position: 'center 45%',
    }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 1. Cinematic Brand Hero */}
      <HeroImage
        eyebrow={relInfo.badge}
        heading={brand.name}
        subline={brand.description ?? `The complete ${brand.name} range — machines, platforms, and specialist parts.`}
        imageSrc={heroImg.src}
        imagePosition={heroImg.position ?? 'center 40%'}
        primaryCtaText="Explore Vehicles"
        primaryCtaHref="#machines"
        secondaryCtaText="All Marques"
        secondaryCtaHref="/brands"
      />

      {/* 2. Editorial Split: Engineering Overview & Supply Pedigree */}
      <EditorialSplit
        eyebrow="Commercial Relationship & Supply Truth"
        heading={"Factory engineering.\nVerified pedigree."}
        body={relInfo.description}
        imageSrc={heroImg.src}
        imageAlt={`${brand.name} factory engineering`}
        imagePosition="left"
        surface="light"
      />

      {/* 3. Featured Machines Section */}
      {machines.length > 0 && (
        <div id="machines">
          <ChapterIntro
            number="01"
            title={`${brand.name.toUpperCase()} PLATFORMS`}
            intro={`Authoritative competition vehicles and chassis kits manufactured by ${brand.name}.`}
            surface="dark"
          />

          {machines.slice(0, 2).map((m, idx) => (
            <ProductFeature
              key={m.id}
              isHalo={m.tier === 'HALO'}
              manufacturer={brand.name}
              name={m.name}
              editorial={
                `${m.name} represents ${brand.name}'s dedicated engineering platform with documented competition lineage.`
              }
              imageSrc={heroImg.src}
              imageAlt={m.name}
              imagePosition={idx % 2 === 0 ? 'left' : 'right'}
              specs={[
                { label: 'Scale', value: m.scale || '1:10' },
                { label: 'Power', value: m.powerType || 'EP' },
                { label: 'Discipline', value: 'RACE' },
              ]}
              priceSlot={
                m.offer ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                    <MarketAwarePrice
                      amountMinorUnits={m.offer.retailPriceMinorUnits}
                      currency={m.offer.currency as Currency}
                      taxMode={m.offer.taxMode}
                      size="lg"
                    />
                    <StockStatus status={m.offer.availability} />
                  </div>
                ) : null
              }
              primaryCtaText="View Platform"
              primaryCtaHref={`/machines/${m.slug}`}
              surface="dark"
            />
          ))}
        </div>
      )}

      {/* 4. Complete Vehicle & Parts Catalogue */}
      <div style={{ backgroundColor: 'var(--bg-canvas)', paddingBlock: 'var(--section-space-standard)' }}>
        <div style={{ maxWidth: 'var(--container-wide)', margin: '0 auto', paddingInline: 'var(--gutter-lg)' }}>
          {/* Platforms */}
          {platforms.length > 0 && (
            <section style={{ marginBottom: 'var(--space-10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                  Chassis Architectures
                </h2>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {platforms.map((plat) => (
                  <div
                    key={plat.id}
                    style={{
                      padding: 'var(--space-5)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-subtle)',
                    }}
                  >
                    <span style={{ display: 'block', fontFamily: 'var(--font-primary)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                      {plat.name}
                    </span>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
                      {plat.description}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                      {plat.driveConfig && <span>{plat.driveConfig}</span>}
                      {plat.driveConfig && plat.chassisMaterial && <span>·</span>}
                      {plat.chassisMaterial && <span>{plat.chassisMaterial}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Parts */}
          {parts.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                  Specialist Parts &amp; Factory Upgrades
                </h2>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                {parts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '110px',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                        {p.name}
                      </span>
                      {p.sku && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: 'var(--space-2)' }}>
                          SKU: {p.sku}
                        </span>
                      )}
                    </div>
                    <div>
                      {p.offer ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <MarketAwarePrice
                            amountMinorUnits={p.offer.retailPriceMinorUnits}
                            currency={p.offer.currency as Currency}
                            taxMode={p.offer.taxMode}
                            size="sm"
                          />
                          <StockStatus status={p.offer.availability} />
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                          Not Available in {activeMarket}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
