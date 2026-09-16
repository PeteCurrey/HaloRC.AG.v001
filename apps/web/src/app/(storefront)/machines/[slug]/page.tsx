import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import s from './page.module.css'
import { DataConfidenceBadge, MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import { getMarketPreference } from '@/actions/market'
import { getMachineDetail, getProductSeo } from '@halo-rc/db'
import type { Currency } from '@halo-rc/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const detail = await getMachineDetail(slug, activeMarket)

  if (!detail) {
    return {
      title: 'Product Not Found — Halo RC',
      robots: { index: false, follow: false },
    }
  }

  // Authoritative SEO metadata from product_seo table
  let seoRecord = null
  try {
    seoRecord = await getProductSeo(detail.id)
  } catch {
    // Non-blocking fallback if database is offline
  }

  const title = seoRecord?.seoTitle || `${detail.name} | ${detail.brand.name} — Halo RC`
  const description = seoRecord?.metaDescription || detail.editorialSummary || undefined
  const canonical = seoRecord?.canonicalUrl || `https://halo-rc.com/machines/${detail.slug}`
  const shouldIndex = seoRecord?.indexPage ?? true

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'en-GB': canonical,
        'en-US': canonical,
        'x-default': canonical,
      },
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    openGraph: {
      title,
      description: description ?? '',
      url: canonical,
      siteName: 'Halo RC',
      type: 'website',
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const detail = await getMachineDetail(slug, activeMarket)

  if (!detail) {
    notFound()
  }

  const isHalo = detail.tier === 'HALO'
  const offer = detail.offer

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: detail.name,
    sku: detail.sku ?? undefined,
    brand: {
      '@type': 'Brand',
      name: detail.brand.name,
    },
    description: detail.editorialSummary,
    offers: offer
      ? {
          '@type': 'Offer',
          price: (offer.retailPriceMinorUnits / 100).toFixed(2),
          priceCurrency: offer.currency,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: (offer.retailPriceMinorUnits / 100).toFixed(2),
            priceCurrency: offer.currency,
            valueAddedTaxIncluded: offer.taxMode === 'INCLUSIVE',
          },
          availability:
            offer.availability === 'IN_STOCK'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        }
      : undefined,
  }

  return (
    <article className={s.page}>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Replacement Lifecycle Banner ── */}
      {detail.lifecycle === 'REPLACED' && detail.replacementLineage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--colour-graphite)',
            borderLeft: '3px solid var(--colour-caution)',
            padding: 'var(--space-4) var(--gutter-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--colour-caution)',
            letterSpacing: '0.06em',
          }}
        >
          <strong>SUPERSEDED — </strong>This product has been replaced by{' '}
          <Link
            href={`/machines/${detail.replacementLineage.replacementSlug}`}
            style={{ color: 'var(--colour-halo)', textDecoration: 'underline' }}
          >
            {detail.replacementLineage.replacementName}
          </Link>
          {detail.replacementLineage.replacementSku && (
            <span style={{ color: 'var(--colour-smoke)' }}>
              {' '}({detail.replacementLineage.replacementSku})
            </span>
          )}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumbs" className={s.breadcrumb}>
        <Link href="/">Home</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <Link href="/machines">The Machines</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <Link href={`/brands/${detail.brand.slug}`}>{detail.brand.name}</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <span aria-current="page" style={{ color: 'var(--colour-off-white)' }}>
          {detail.shortName}
        </span>
      </nav>

      {/* ── Main Hero Section ── */}
      <section className={s.hero}>
        {/* Left: Imagery */}
        <div className={s.imagePanel}>
          <div
            className={s.heroImage}
            style={isHalo ? { border: '1px solid var(--colour-halo)', boxShadow: 'var(--shadow-halo)' } : undefined}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--colour-graphite)',
                padding: 'var(--space-6)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isHalo ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {isHalo ? 'HALO COMPETITION SPECIFICATION' : 'VERIFIED FACTORY MACHINE'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--colour-off-white)',
                }}
              >
                {detail.name}
              </span>
              {detail.sku && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.625rem',
                    color: 'var(--colour-smoke)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  SKU: {detail.sku}
                </span>
              )}
            </div>
          </div>

          <div className={s.imageThumbs} aria-label="Component gallery">
            <div className={s.imageThumb} aria-selected="true" />
            <div className={s.imageThumb} />
            <div className={s.imageThumb} />
          </div>
        </div>

        {/* Right: Commercial Information */}
        <div className={s.info}>
          <div>
            <span className={s.infoBrand}>{detail.brand.name}</span>
            <h1 className={s.infoName}>{detail.name}</h1>
          </div>

          <div className={s.infoMeta}>
            {isHalo && (
              <span className={`${s.chip} ${s.chipHalo}`}>
                ★ Halo{detail.haloClassification && ` / ${detail.haloClassification}`}
              </span>
            )}
            {detail.scale && <span className={s.chip}>{detail.scale}</span>}
            {detail.powerType && <span className={s.chip}>{detail.powerType}</span>}
            {detail.platform && <span className={s.chip}>Platform: {detail.platform.name}</span>}
            <span className={s.chip}>{detail.discipline}</span>
          </div>

          {/* Pricing & Stock (Market-Specific) */}
          <div className={s.priceBlock}>
            {offer ? (
              <>
                <MarketAwarePrice
                  amountMinorUnits={offer.retailPriceMinorUnits}
                  currency={offer.currency as Currency}
                  taxMode={offer.taxMode}
                  size="xl"
                />
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <StockStatus status={offer.availability} leadTimeDays={offer.leadTimeDays} />
                </div>
              </>
            ) : (
              <div>
                <p
                  style={{
                    color: 'var(--colour-smoke)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Not Available in {activeMarket} Market
                </p>
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <StockStatus status="NOT_AVAILABLE" />
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className={s.ctaRow}>
            {offer && offer.availability !== 'NOT_AVAILABLE' ? (
              isHalo ? (
                <>
                  <Link
                    href="/build"
                    className={s.btnAdd}
                    style={{
                      backgroundColor: 'var(--colour-halo)',
                      color: 'var(--colour-void)',
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    Configure Complete Race Build
                  </Link>
                  <Link
                    href={`/contact?productInterestId=${detail.id}&productName=${encodeURIComponent(detail.name)}`}
                    className={s.btnEnquire}
                    style={{ textAlign: 'center', textDecoration: 'none' }}
                  >
                    Request Specialist Race Department Consultation
                  </Link>
                </>
              ) : (
                <>
                  <button type="button" className={s.btnAdd}>
                    Add to Cart
                  </button>
                  <Link
                    href="/build"
                    className={s.btnEnquire}
                    style={{ textAlign: 'center', textDecoration: 'none' }}
                  >
                    Build Rig Configuration
                  </Link>
                </>
              )
            ) : (
              <button type="button" className={s.btnEnquire} disabled style={{ opacity: 0.6 }}>
                Unavailable for Order in {activeMarket}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Machine DNA (Verified Specs — UNKNOWN strictly excluded by getMachineDetail) ── */}
      {detail.dna.length > 0 && (
        <section className={s.section} aria-labelledby="dna-heading">
          <h2 id="dna-heading" className={s.sectionTitle}>
            Machine DNA — Verified Engineering Specs
          </h2>
          <div className={s.dnaGrid}>
            {detail.dna.map((spec) => (
              <div key={spec.key} className={s.dnaCell}>
                <span className={s.dnaKey}>{spec.key}</span>
                <span className={s.dnaValue}>{spec.value}</span>
                <div className={s.dnaConfidence}>
                  <DataConfidenceBadge confidence={spec.confidence} sourceType={spec.sourceType} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Halo-Specific Architecture Section ── */}
      {isHalo && detail.haloSpecs && detail.haloSpecs.length > 0 && (
        <section className={s.engineeringSpec} aria-labelledby="halo-specs-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--colour-halo)',
              }}
              aria-hidden="true"
            />
            <h2
              id="halo-specs-heading"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--colour-white)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Chassis Architecture &amp; Precision Engineering
            </h2>
          </div>
          <table className={s.specTable}>
            <tbody>
              {detail.haloSpecs.map((spec) => (
                <tr key={spec.category}>
                  <td>{spec.category}</td>
                  <td>{spec.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Editorial: Why We Chose It ── */}
      <section className={s.editorial} aria-labelledby="editorial-heading">
        <div>
          <h2 id="editorial-heading" className={s.sectionTitle}>
            Why We Chose It
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--colour-smoke)',
              letterSpacing: '0.04em',
            }}
          >
            Editorial assessment by Halo RC engineering team.
          </p>
        </div>
        <p className={s.editorialBody}>{detail.editorialSummary}</p>
      </section>

      {/* ── Compatible Parts & Components ── */}
      {detail.compatibleParts.length > 0 && (
        <section className={s.section} aria-labelledby="compat-heading">
          <h2 id="compat-heading" className={s.sectionTitle}>
            Compatible Parts &amp; Components
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {detail.compatibleParts.map((part) => (
              <Link
                key={part.partId}
                href={`/machines/${part.slug}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--colour-carbon)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--colour-off-white)',
                    }}
                  >
                    {part.name}
                  </span>
                  {part.sku && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        color: 'var(--colour-smoke)',
                      }}
                    >
                      {part.sku}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--colour-smoke)',
                    }}
                  >
                    {part.ruleType}
                  </span>
                  {part.price && (
                    <MarketAwarePrice
                      amountMinorUnits={part.price.retailPriceMinorUnits}
                      currency={part.price.currency as Currency}
                      taxMode={part.price.taxMode}
                      size="sm"
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Technical Documents ── */}
      {detail.documents.length > 0 && (
        <section className={s.section} aria-labelledby="docs-heading">
          <h2 id="docs-heading" className={s.sectionTitle}>
            Technical Documents
          </h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none' }}>
            {detail.documents.map((doc) => (
              <li key={doc.id}>
                {doc.sourceUrl ? (
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--colour-carbon)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: 'var(--colour-off-white)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <span>{doc.title}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        color: 'var(--colour-smoke)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {doc.documentType}{doc.version && ` · ${doc.version}`}
                    </span>
                  </a>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--colour-carbon)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--colour-ash)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    <span>{doc.title}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        color: 'var(--colour-smoke)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {doc.documentType}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Related Products ── */}
      {detail.relatedProducts.length > 0 && (
        <section className={s.section} aria-labelledby="related-heading">
          <h2 id="related-heading" className={s.sectionTitle}>
            Related Products
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {detail.relatedProducts.map(({ relationType, product: rel }) => (
              <Link
                key={rel.id}
                href={`/machines/${rel.slug}`}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--colour-carbon)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.5625rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--colour-smoke)',
                  }}
                >
                  {relationType}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--colour-off-white)',
                  }}
                >
                  {rel.name}
                </span>
                {rel.offer && (
                  <MarketAwarePrice
                    amountMinorUnits={rel.offer.retailPriceMinorUnits}
                    currency={rel.offer.currency as Currency}
                    taxMode={rel.offer.taxMode}
                    size="sm"
                  />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Competition Pedigree (Halo Only) ── */}
      {isHalo && detail.pedigree && detail.pedigree.length > 0 && (
        <section className={s.pedigree} aria-labelledby="pedigree-heading">
          <h2 id="pedigree-heading" className={s.sectionTitle} style={{ color: 'var(--colour-halo)' }}>
            Competition Pedigree &amp; Track Record
          </h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', listStyle: 'none' }}>
            {detail.pedigree.map((item) => (
              <li
                key={item.event}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--colour-steel)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ color: 'var(--colour-off-white)' }}>
                  {item.event} ({item.year})
                </span>
                <span style={{ color: 'var(--colour-halo)', fontWeight: 600 }}>{item.result}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
