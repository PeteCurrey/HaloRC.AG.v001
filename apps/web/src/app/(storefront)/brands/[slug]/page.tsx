import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMarketPreference } from '@/actions/market'
import { getBrandDetail } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency, CommercialRelationship } from '@halo-rc/types'

interface BrandPageProps {
  params: Promise<{ slug: string }>
}

function commercialRelationshipCopy(rel: CommercialRelationship, brandName: string): { badge: string; description: string; color: string } {
  switch (rel) {
    case 'OFFICIAL_DEALER':
      return {
        badge: 'Authorised Dealer',
        description: `Halo RC is an authorised retailer for ${brandName}. All products are sourced directly from the manufacturer with full factory warranty and setup sheet access.`,
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
        description: `Information on ${brandName} is curated for catalogue and compatibility reference. Halo RC does not claim authorised dealer status unless explicitly indicated.`,
        color: 'var(--colour-smoke)',
      }
  }
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params
  const activeMarket = await getMarketPreference()
  const data = await getBrandDetail(slug, activeMarket)
  if (!data) {
    return { title: 'Brand Not Found — Halo RC' }
  }
  return {
    title: `${data.brand.name} — Halo RC`,
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        <nav aria-label="Breadcrumbs" style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginBottom: 'var(--space-6)' }}>
          <Link href="/brands">Brands</Link>
          <span>/</span>
          <span style={{ color: 'var(--colour-off-white)' }}>{brand.name}</span>
        </nav>

        <span
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: relInfo.color,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-2)',
          }}
        >
          {relInfo.badge}
        </span>
        <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-4)' }}>
          {brand.name}
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '58ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
          {brand.description}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', maxWidth: '64ch', lineHeight: 'var(--leading-normal)', marginBottom: 'var(--space-8)' }}>
          {relInfo.description}
        </p>

        {/* Platforms */}
        {platforms.length > 0 && (
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                Platforms &amp; Chassis Architecture
              </h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--colour-steel)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
              {platforms.map((plat) => (
                <div
                  key={plat.id}
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ display: 'block', fontFamily: 'var(--font-primary)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--colour-off-white)', marginBottom: 'var(--space-1)' }}>
                    {plat.name}
                  </span>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-2)' }}>
                    {plat.description}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                    {plat.driveConfig && <span>{plat.driveConfig}</span>}
                    {plat.driveConfig && plat.chassisMaterial && <span>·</span>}
                    {plat.chassisMaterial && <span>{plat.chassisMaterial}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Machines */}
        {machines.length > 0 && (
          <section style={{ marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                Vehicles &amp; Kits
              </h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--colour-steel)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {machines.map((m) => (
                <Link
                  key={m.id}
                  href={`/machines/${m.slug}`}
                  style={{
                    padding: 'var(--space-5)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', marginBottom: 'var(--space-1)' }}>
                      {m.name}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', marginBottom: 'var(--space-3)' }}>
                      {m.scale && <span>{m.scale}</span>}
                      {m.scale && m.powerType && <span>·</span>}
                      {m.powerType && <span>{m.powerType}</span>}
                    </div>
                  </div>
                  <div>
                    {m.offer ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <MarketAwarePrice
                          amountMinorUnits={m.offer.retailPriceMinorUnits}
                          currency={m.offer.currency as Currency}
                          taxMode={m.offer.taxMode}
                          size="base"
                        />
                        <StockStatus status={m.offer.availability} />
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                        Not Available in {activeMarket}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Parts */}
        {parts.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                Parts, Upgrades &amp; Electronics
              </h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--colour-steel)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
              {parts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--colour-off-white)', marginBottom: 'var(--space-1)' }}>
                      {p.name}
                    </span>
                    {p.sku && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', display: 'block', marginBottom: 'var(--space-2)' }}>
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
  )
}

