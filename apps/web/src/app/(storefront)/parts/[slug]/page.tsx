import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import s from './part.module.css'
import { DataConfidenceBadge, MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import { getMarketPreference } from '@/actions/market'
import { getPartDetail, getProductSeo } from '@halo-rc/db'
import type { Currency } from '@halo-rc/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const detail = await getPartDetail(slug, activeMarket)

  if (!detail) {
    return {
      title: 'Component Not Found — Avorria RC',
      robots: { index: false, follow: false },
    }
  }

  let seoRecord = null
  try {
    seoRecord = await getProductSeo(detail.id)
  } catch {
    // Non-blocking fallback
  }

  const title = seoRecord?.seoTitle || `${detail.name} | ${detail.brand.name} — Avorria RC`
  const description = seoRecord?.metaDescription || detail.editorialSummary || undefined
  const canonical = seoRecord?.canonicalUrl || `https://avorria.com/parts/${detail.slug}`
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
      siteName: 'Avorria RC',
      type: 'website',
    },
  }
}

export default async function PartDetailPage({ params }: PageProps) {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const detail = await getPartDetail(slug, activeMarket)

  if (!detail) {
    notFound()
  }

  const isHalo = detail.tier === 'HALO'
  const offer = detail.offer

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
              : 'https://schema.org/PreOrder',
          itemCondition: 'https://schema.org/NewCondition',
        }
      : undefined,
  }

  return (
    <div className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Superseded Banner ── */}
      {detail.replacementLineage && (
        <div className={s.supersededBanner}>
          <strong>SUPERSEDED — </strong>This part has been superseded by{' '}
          <Link
            href={`/parts/${detail.replacementLineage.replacementSlug}`}
            style={{ color: 'var(--colour-ignition)', textDecoration: 'underline' }}
          >
            {detail.replacementLineage.replacementName}
          </Link>
          {detail.replacementLineage.replacementSku && (
            <span> ({detail.replacementLineage.replacementSku})</span>
          )}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumbs" className={s.breadcrumb}>
        <Link href="/">Home</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <Link href="/parts">Parts &amp; Upgrades</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <Link href={`/brands/${detail.brand.slug}`}>{detail.brand.name}</Link>
        <span className={s.breadcrumbSep} aria-hidden="true">/</span>
        <span aria-current="page" style={{ color: 'var(--text-primary)' }}>
          {detail.shortName}
        </span>
      </nav>

      {/* ── Hero Section ── */}
      <section className={s.hero}>
        <div className={s.imagePanel}>
          <div className={`${s.heroImage} ${isHalo ? s.heroImageHalo : ''}`}>
            <div className={s.imagePlaceholder}>
              <span className={s.imagePlaceholderEyebrow}>
                {isHalo
                  ? 'HALO COMPETITION COMPONENT'
                  : `VERIFIED ${detail.productType.replace('_', ' ')}`}
              </span>
              <span className={s.imagePlaceholderName}>{detail.name}</span>
              {detail.sku && (
                <span className={s.imagePlaceholderSku}>SKU: {detail.sku}</span>
              )}
            </div>
          </div>

          <div className={s.imageThumbs} aria-label="Component gallery">
            <div className={s.imageThumb} aria-selected="true" />
            <div className={s.imageThumb} />
          </div>
        </div>

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
            <span className={s.chip}>{detail.productType.replace('_', ' ')}</span>
            {detail.platform && (
              <span className={s.chip}>Platform: {detail.platform.name}</span>
            )}
            {detail.scale && <span className={s.chip}>Scale: {detail.scale}</span>}
          </div>

          {/* Pricing & Stock */}
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
                  <StockStatus
                    status={offer.availability}
                    leadTimeDays={offer.leadTimeDays}
                  />
                </div>
              </>
            ) : (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--colour-smoke)',
                    textTransform: 'uppercase',
                  }}
                >
                  Not Available in {activeMarket}
                </p>
                <StockStatus status="NOT_AVAILABLE" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={s.actions}>
            {offer && offer.availability !== 'NOT_AVAILABLE' ? (
              <button type="button" className={s.btnAdd}>
                Add to Cart
              </button>
            ) : (
              <button type="button" className={s.btnSecondary} disabled style={{ opacity: 0.6 }}>
                Unavailable for Order in {activeMarket}
              </button>
            )}
            <Link href="/parts?view=catalogue" className={s.btnSecondary}>
              Browse All Parts &amp; Upgrades
            </Link>
          </div>
        </div>
      </section>

      {/* ── Verified Platform Fitment ── */}
      <section className={s.section} aria-labelledby="fitment-heading">
        <h2 id="fitment-heading" className={s.sectionTitle}>
          Verified Platform Compatibility
        </h2>
        {detail.fitsPlatforms.length > 0 ? (
          <div className={s.fitList}>
            {detail.fitsPlatforms.map((fit) => {
              const badgeClass =
                fit.ruleType === 'UPGRADE'
                  ? s.fitBadgeUpgrade
                  : fit.ruleType === 'OPTION'
                    ? s.fitBadgeOption
                    : s.fitBadgeFits

              return (
                <div key={fit.platformId} className={s.fitItem}>
                  <div className={s.fitItemLeft}>
                    <span className={s.fitName}>{fit.platformName}</span>
                    <span className={s.fitBrand}>{fit.brandName}</span>
                  </div>
                  <span className={`${s.fitBadge} ${badgeClass}`}>
                    {fit.ruleType}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={s.emptyFit}>
            <p>
              <strong>Universal Fitment / Platform Independent</strong> — This component is engineered
              to standard competition specifications without proprietary chassis mounting constraints.
              Verify voltage, mounting dimensions, and gear pitch against your platform documentation.
            </p>
          </div>
        )}
      </section>

      {/* ── Component DNA (Verified Specs) ── */}
      {detail.dna.length > 0 && (
        <section className={s.section} aria-labelledby="dna-heading">
          <h2 id="dna-heading" className={s.sectionTitle}>
            Component DNA — Verified Engineering Specs
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

      {/* ── Editorial ── */}
      <section className={s.editorial} aria-labelledby="editorial-heading">
        <div>
          <h2 id="editorial-heading" className={s.sectionTitle}>
            Why We Specified It
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.04em',
            }}
          >
            Editorial assessment by Avorria RC engineering team.
          </p>
        </div>
        <p className={s.editorialBody}>{detail.editorialSummary}</p>
      </section>

      {/* ── Related / Option Components ── */}
      {detail.relatedProducts.length > 0 && (
        <section className={s.section} aria-labelledby="related-heading">
          <h2 id="related-heading" className={s.sectionTitle}>
            Related Platform Components
          </h2>
          <div className={s.relatedGrid}>
            {detail.relatedProducts.map((rel) => (
              <Link
                key={rel.product.id}
                href={`/parts/${rel.product.slug}`}
                className={s.relatedCard}
              >
                <span className={s.relatedCardBadge}>{rel.relationType}</span>
                <h3 className={s.relatedCardName}>{rel.product.name}</h3>
                {rel.product.sku && (
                  <span className={s.relatedCardSku}>SKU: {rel.product.sku}</span>
                )}
                {rel.product.offer && (
                  <div className={s.relatedCardPrice}>
                    <MarketAwarePrice
                      amountMinorUnits={rel.product.offer.retailPriceMinorUnits}
                      currency={rel.product.offer.currency as Currency}
                      taxMode={rel.product.offer.taxMode}
                      size="sm"
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
