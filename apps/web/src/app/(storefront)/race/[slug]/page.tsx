// apps/web/src/app/(storefront)/race/[slug]/page.tsx
// Halo Build detail page.
// Authoritative: product graph, compatibility engine, market resolver drive all data.
// AI layer is never called from this page. Commerce derives from validated build.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getHaloBuildBySlug,
  resolveCurrentBuildPricing,
} from '@halo-rc/db'
import { addHaloBuildToCartAction } from '@/actions/commerce'
import { PageHero } from '@/components/layout/PageHero'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const build = await getHaloBuildBySlug(slug)
  if (!build) {
    return { title: 'Build Not Found — Avorria RC' }
  }
  return {
    title: `${build.title} — Avorria RC Race Department`,
    description: build.engineeringSummary ?? `Engineered competition configuration: ${build.title}`,
    alternates: {
      canonical: `https://avorria.com/race/${build.slug}`,
      languages: {
        'en-GB': `https://avorria.com/race/${build.slug}`,
        'en-US': `https://avorria.com/race/${build.slug}`,
        'x-default': `https://avorria.com/race/${build.slug}`,
      },
    },
    openGraph: {
      title: `${build.title} — Avorria RC Race Department`,
      description: build.engineeringSummary ?? undefined,
    },
  }
}

// Subsystem display order
const SUBSYSTEM_ORDER = [
  'CHASSIS',
  'POWERTRAIN',
  'STEERING',
  'SUSPENSION',
  'RUNNING_GEAR',
  'BODYWORK',
  'ELECTRONICS',
  'SUPPORT',
]

const SUBSYSTEM_LABELS: Record<string, string> = {
  CHASSIS: 'Chassis & Platform',
  POWERTRAIN: 'Powertrain',
  STEERING: 'Steering',
  SUSPENSION: 'Suspension',
  RUNNING_GEAR: 'Running Gear',
  BODYWORK: 'Bodywork',
  ELECTRONICS: 'Electronics',
  SUPPORT: 'Support Items',
}

const DISCIPLINE_LABELS: Record<string, string> = {
  TOURING: 'Touring Car',
  BUGGY: 'Buggy',
  GT: 'GT',
  LARGE_SCALE: 'Large Scale',
  RALLY: 'Rally',
  CRAWLER: 'Crawler',
  TRUGGY: 'Truggy',
  SCT: 'Short Course Truck',
}

const REQUIREMENT_LABELS: Record<string, string> = {
  REQUIRED: 'Required',
  RECOMMENDED: 'Recommended',
  OPTIONAL: 'Optional',
  ALTERNATIVE: 'Alternative',
}

function formatPrice(minorUnits: number, currency: string): string {
  return (minorUnits / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

const PROVENANCE_LABELS: Record<string, string> = {
  HALO_ENGINEERED: 'Halo Engineered',
  FACTORY: 'Factory Configuration',
  CHAMPION: 'Champion Spec',
  CUSTOMER: 'Customer Configuration',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  SETUP_SHEET: 'Setup Sheet',
  EXPLODED_DIAGRAM: 'Exploded Diagram',
  SPEC_SHEET: 'Spec Sheet',
  TUNING_GUIDE: 'Tuning Guide',
}

export default async function HaloBuildDetailPage({ params }: PageProps) {
  const { slug } = await params
  const build = await getHaloBuildBySlug(slug)

  if (!build || !build.published) {
    notFound()
  }

  // Resolve the current published version
  const currentVersion = build.versions.find(
    (v) => v.version === build.currentVersion && v.status === 'PUBLISHED'
  )

  if (!currentVersion) {
    notFound()
  }

  // Authoritative market pricing for both markets
  const ukPricing = resolveCurrentBuildPricing(build, 'UK')
  const usPricing = resolveCurrentBuildPricing(build, 'US')

  // Group components by subsystem in display order
  const componentsBySubsystem = new Map<string, typeof currentVersion.components>()
  for (const subsystem of SUBSYSTEM_ORDER) {
    const comps = currentVersion.components.filter((c) => c.subsystem === subsystem)
    if (comps.length > 0) {
      componentsBySubsystem.set(subsystem, comps)
    }
  }
  // Catch any subsystems not in our display order
  for (const comp of currentVersion.components) {
    if (!SUBSYSTEM_ORDER.includes(comp.subsystem)) {
      const existing = componentsBySubsystem.get(comp.subsystem) ?? []
      componentsBySubsystem.set(comp.subsystem, [...existing, comp])
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: build.title,
    description: build.engineeringSummary ?? undefined,
    brand: { '@type': 'Brand', name: 'Avorria RC Race Department' },
    sku: build.id,
    offers: ukPricing.totalMinorUnits
      ? {
          '@type': 'Offer',
          priceCurrency: 'GBP',
          price: (ukPricing.totalMinorUnits / 100).toFixed(2),
          availability: ukPricing.isPurchasable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `https://avorria.com/race/${build.slug}`,
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Race Department"
        headline={build.title}
        subline={build.engineeringSummary ?? `Engineered competition configuration by Avorria RC.`}
        imageSrc={({
          TOURING:    '/images/disciplines/race.jpg',
          BUGGY:      '/images/brands/schumacher.jpg',
          GT:         '/images/disciplines/large-scale.jpg',
          LARGE_SCALE:'/images/disciplines/large-scale.jpg',
          RALLY:      '/images/disciplines/drift.jpg',
          CRAWLER:    '/images/disciplines/crawl.jpg',
          TRUGGY:     '/images/brands/traxxas.jpg',
          SCT:        '/images/brands/traxxas.jpg',
        } as Record<string, string>)[build.discipline] ?? '/images/brands/schumacher.jpg'}
        imagePosition="center 40%"
        badge="BUILD"
      />
      <div
        style={{
          minHeight: '60vh',
          backgroundColor: 'var(--colour-void)',
          padding: 'var(--space-9) var(--gutter-md)',
        }}
      >
        <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: 'var(--space-6)' }} aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--colour-ash)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <li>
                <Link
                  href="/race"
                  style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}
                >
                  Race Department
                </Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--colour-steel)' }}>
                /
              </li>
              <li style={{ color: 'var(--colour-off-white)' }}>{build.title}</li>
            </ol>
          </nav>

          {/* Build Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 'var(--space-6)',
              alignItems: 'start',
              marginBottom: 'var(--space-8)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              {/* Provenance & discipline tags */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-3)',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    backgroundColor: 'var(--colour-race)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--colour-void)',
                    fontWeight: 700,
                  }}
                >
                  {PROVENANCE_LABELS[build.provenance] ?? build.provenance}
                </span>
                <span
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--colour-ash)',
                  }}
                >
                  {DISCIPLINE_LABELS[build.discipline] ?? build.discipline}
                </span>
                <span
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--colour-ash)',
                  }}
                >
                  {build.scale}
                </span>
                <span
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--colour-ash)',
                  }}
                >
                  v{build.currentVersion}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-tight)',
                  color: 'var(--colour-white)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {build.title}
              </h1>

              {build.subtitle && (
                <p
                  style={{
                    fontSize: 'var(--text-lg)',
                    color: 'var(--colour-ash)',
                    marginBottom: 'var(--space-3)',
                    fontStyle: 'italic',
                  }}
                >
                  {build.subtitle}
                </p>
              )}

              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--colour-off-white)',
                  lineHeight: 'var(--leading-relaxed)',
                  maxWidth: '72ch',
                }}
              >
                {build.engineeringSummary}
              </p>

              {build.trackConditions && (
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--colour-ash)',
                    }}
                  >
                    Track Conditions
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--colour-race)',
                    }}
                  >
                    {build.trackConditions}
                  </span>
                </div>
              )}
            </div>

            {/* Pricing & Purchase Panel */}
            <div
              style={{
                minWidth: 280,
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--colour-ash)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Build Price (Complete)
              </div>

              {/* UK Price */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--colour-ash)',
                    }}
                  >
                    UK (inc. VAT)
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 700,
                      color: ukPricing.isPurchasable
                        ? 'var(--colour-white)'
                        : 'var(--colour-ash)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {ukPricing.totalMinorUnits != null
                      ? formatPrice(ukPricing.totalMinorUnits, 'GBP')
                      : '—'}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color:
                      ukPricing.availabilityState === 'AVAILABLE'
                        ? 'var(--colour-race)'
                        : 'var(--colour-ash)',
                  }}
                >
                  {ukPricing.availabilityState === 'AVAILABLE' && 'All components available'}
                  {ukPricing.availabilityState === 'PARTIALLY_AVAILABLE' &&
                    `${ukPricing.unavailableCount} component(s) unavailable`}
                  {ukPricing.availabilityState === 'UNAVAILABLE' && 'Not available in UK market'}
                  {ukPricing.availabilityState === 'REVIEW_REQUIRED' && 'Review required'}
                </div>
              </div>

              {/* US Price */}
              <div
                style={{
                  borderTop: '1px solid var(--colour-steel)',
                  paddingTop: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--colour-ash)',
                    }}
                  >
                    US
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 600,
                      color: usPricing.isPurchasable
                        ? 'var(--colour-off-white)'
                        : 'var(--colour-ash)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {usPricing.totalMinorUnits != null
                      ? formatPrice(usPricing.totalMinorUnits, 'USD')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Add to cart form */}
              {ukPricing.isPurchasable ? (
                <form action={addHaloBuildToCartAction}>
                  <input type="hidden" name="buildId" value={build.id} />
                  <input type="hidden" name="version" value={build.currentVersion} />
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--colour-race)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--colour-void)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Add Complete Build to Cart
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--colour-ash)',
                    textAlign: 'center',
                    letterSpacing: '0.06em',
                  }}
                >
                  Not available for purchase in your market
                </div>
              )}

              <p
                style={{
                  marginTop: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--colour-ash)',
                  lineHeight: 1.5,
                }}
              >
                Adds all {currentVersion.components.length} verified components to your basket.
                Each item sourced and priced authoritatively from the product graph.
              </p>

              <div
                style={{
                  marginTop: 'var(--space-3)',
                  borderTop: '1px solid var(--colour-steel)',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <Link
                  href={`/race/compare?builds=${build.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--colour-ash)',
                    textDecoration: 'none',
                  }}
                >
                  Compare with another build →
                </Link>
              </div>
            </div>
          </div>

          {/* Component Breakdown */}
          <section
            aria-label="Build component breakdown"
            style={{ marginBottom: 'var(--space-10)' }}
          >
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
                color: 'var(--colour-white)',
                marginBottom: 'var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: 'var(--colour-race)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              Component Specification
            </h2>

            {Array.from(componentsBySubsystem.entries()).map(([subsystem, comps]) => (
              <div
                key={subsystem}
                style={{
                  marginBottom: 'var(--space-5)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {/* Subsystem header */}
                <div
                  style={{
                    backgroundColor: 'var(--colour-carbon)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderBottom: '1px solid var(--colour-steel)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: 'var(--colour-off-white)',
                    }}
                  >
                    {SUBSYSTEM_LABELS[subsystem] ?? subsystem}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--colour-ash)',
                    }}
                  >
                    {comps.length} item{comps.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Component rows */}
                <div style={{ backgroundColor: 'var(--colour-void)' }}>
                  {comps.map((comp, idx) => {
                    const ukLine = ukPricing.lines.find((l) => l.productId === comp.productId)
                    return (
                      <div
                        key={comp.productId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: 'var(--space-4)',
                          alignItems: 'start',
                          padding: 'var(--space-4)',
                          borderBottom:
                            idx < comps.length - 1
                              ? '1px solid var(--colour-carbon)'
                              : 'none',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              marginBottom: 'var(--space-1)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: comp.requirement === 'REQUIRED'
                                  ? 'var(--colour-race)'
                                  : 'var(--colour-ash)',
                                fontWeight: 600,
                              }}
                            >
                              {REQUIREMENT_LABELS[comp.requirement] ?? comp.requirement}
                            </span>
                            {comp.verified && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--colour-ash)',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                ✓ Verified
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 'var(--text-base)',
                              fontWeight: 600,
                              color: 'var(--colour-white)',
                              marginBottom: 'var(--space-1)',
                            }}
                          >
                            {comp.productName}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--colour-ash)',
                              }}
                            >
                              {comp.brandName}
                            </span>
                            {comp.sku && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--colour-ash)',
                                }}
                              >
                                SKU: {comp.sku}
                              </span>
                            )}
                          </div>

                          {comp.notes && (
                            <p
                              style={{
                                marginTop: 'var(--space-2)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--colour-ash)',
                                lineHeight: 'var(--leading-relaxed)',
                                maxWidth: '70ch',
                              }}
                            >
                              {comp.notes}
                            </p>
                          )}

                          {comp.compatibilityRuleDescription && (
                            <div
                              style={{
                                marginTop: 'var(--space-2)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--colour-ash)',
                                opacity: 0.7,
                                fontStyle: 'italic',
                              }}
                            >
                              ◎ {comp.compatibilityRuleDescription}
                            </div>
                          )}
                        </div>

                        {/* Price column */}
                        <div style={{ textAlign: 'right', minWidth: 90 }}>
                          {ukLine ? (
                            <>
                              <div
                                style={{
                                  fontSize: 'var(--text-base)',
                                  fontWeight: 600,
                                  color: 'var(--colour-white)',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {formatPrice(ukLine.priceMinorUnits ?? 0, 'GBP')}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 'var(--text-xs)',
                                  color:
                                    ukLine.availabilityStatus === 'IN_STOCK'
                                      ? 'var(--colour-race)'
                                      : 'var(--colour-ash)',
                                  marginTop: 'var(--space-1)',
                                }}
                              >
                                {ukLine.availabilityStatus === 'IN_STOCK' && 'In Stock'}
                                {ukLine.availabilityStatus === 'OUT_OF_STOCK' && 'Out of Stock'}
                                {ukLine.availabilityStatus === 'PRE_ORDER' && 'Pre-Order'}
                                {ukLine.availabilityStatus === 'NOT_AVAILABLE' && 'Not Available'}
                                {ukLine.availabilityStatus === 'LOW_STOCK' && 'Low Stock'}
                                {ukLine.availabilityStatus === 'SPECIAL_ORDER' && 'Special Order'}
                              </div>
                            </>
                          ) : (
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--colour-ash)',
                              }}
                            >
                              No UK offer
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* Engineering Notes */}
          {currentVersion.engineeringNotes && (
            <section
              aria-label="Engineering notes"
              style={{
                marginBottom: 'var(--space-8)',
                padding: 'var(--space-5)',
                border: '1px solid var(--colour-steel)',
                borderLeft: '3px solid var(--colour-race)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--colour-carbon)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--colour-ash)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Engineering Notes
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--colour-off-white)',
                  lineHeight: 'var(--leading-relaxed)',
                }}
              >
                {currentVersion.engineeringNotes}
              </p>
            </section>
          )}

          {/* Technical Documents */}
          {build.documents && build.documents.length > 0 && (
            <section aria-label="Technical documents" style={{ marginBottom: 'var(--space-8)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--colour-white)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Technical Documents
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {build.documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: 'var(--space-4)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--colour-carbon)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--colour-race)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--colour-off-white)',
                        marginBottom: 'var(--space-2)',
                        lineHeight: 1.4,
                      }}
                    >
                      {doc.title}
                    </div>
                    {doc.sourceUrl ? (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--colour-ash)',
                          textDecoration: 'none',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Open document →
                      </a>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--colour-ash)',
                          opacity: 0.5,
                        }}
                      >
                        Document available in-store
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Version History */}
          {build.versions.length > 1 && (
            <section aria-label="Version history" style={{ marginBottom: 'var(--space-8)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--colour-white)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Version History
              </h2>
              <div
                style={{
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {build.versions.map((ver, idx) => (
                  <div
                    key={ver.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 'var(--space-4)',
                      alignItems: 'center',
                      padding: 'var(--space-4)',
                      borderBottom:
                        idx < build.versions.length - 1
                          ? '1px solid var(--colour-steel)'
                          : 'none',
                      backgroundColor:
                        ver.version === build.currentVersion
                          ? 'var(--colour-carbon)'
                          : 'var(--colour-void)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        color:
                          ver.version === build.currentVersion
                            ? 'var(--colour-race)'
                            : 'var(--colour-ash)',
                        minWidth: 40,
                      }}
                    >
                      v{ver.version}
                    </span>
                    <div>
                      {ver.changelogNotes && (
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--colour-off-white)',
                          }}
                        >
                          {ver.changelogNotes}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--colour-ash)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {ver.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Back to Race Department */}
          <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
            <Link
              href="/race"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--colour-ash)',
                textDecoration: 'none',
              }}
            >
              ← Back to Race Department
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
