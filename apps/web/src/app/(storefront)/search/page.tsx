import type { Metadata } from 'next'
import Link from 'next/link'
import s from './search.module.css'
import { getMarketPreference } from '@/actions/market'
import { searchCatalogue, getBrandsList } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'Search & Compatibility — Halo RC',
  description: 'Search products, platforms, compatible parts, and verified specifications across the Halo RC catalogue.',
  robots: {
    index: false,
    follow: false,
  },
}

const PRESET_SEARCHES = [
  'XRAY',
  'X-Maxx',
  'Touring',
  'Brushless',
  '1:10',
  '1:5',
  'Awesomatix',
  'Traxxas',
]

const QUICK_DISCIPLINES = [
  { label: 'Bash & Stunt', href: '/machines?discipline=bash' },
  { label: 'Competition Race', href: '/machines?discipline=race' },
  { label: 'Precision Drift', href: '/machines?discipline=drift' },
  { label: 'Trail & Crawl', href: '/machines?discipline=crawl' },
  { label: 'Scale Realism', href: '/machines?discipline=scale' },
  { label: 'Large Scale 1:5', href: '/machines?discipline=large_scale' },
]

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const activeMarket = await getMarketPreference()

  const productResults = query ? await searchCatalogue({ query, marketCode: activeMarket }) : []
  const allBrands = query ? await getBrandsList() : []
  const brandResults = query
    ? allBrands.filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.description?.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const totalResultsCount = productResults.length + brandResults.length

  // Categorise products
  const machineResults = productResults.filter((p) =>
    ['KIT', 'RTR', 'ROLLER'].includes(p.productType)
  )
  const componentResults = productResults.filter((p) =>
    !['KIT', 'RTR', 'ROLLER'].includes(p.productType)
  )

  return (
    <div className={s.page}>
      <div className={s.container}>
        <p className={s.eyebrow}>Authoritative Catalogue Search</p>
        <h1 className={s.headline}>Hardware & Compatibility</h1>
        <p className={s.subline}>
          Search across brand, vehicle platform, chassis material, exact manufacturer SKU, scale, or discipline.
        </p>

        {/* Search Input Bar (standard accessible GET form updating ?q=) */}
        <form action="/search" method="GET" className={s.searchForm}>
          <div className={s.searchBar}>
            <span className={s.searchIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by SKU, platform (e.g. X4, X-Maxx), brand, or discipline..."
              className={s.searchInput}
              autoFocus={!query}
              aria-label="Search query"
            />
            <button type="submit" className={s.searchButton}>
              Search
            </button>
          </div>
        </form>

        {/* Preset quick links */}
        <div className={s.presetsRow}>
          <span className={s.presetsLabel}>Suggested Searches:</span>
          {PRESET_SEARCHES.map((preset) => (
            <Link
              key={preset}
              href={`/search?q=${encodeURIComponent(preset)}`}
              className={s.presetChip}
            >
              {preset}
            </Link>
          ))}
        </div>

        {/* Results presentation */}
        {query ? (
          <div>
            <div className={s.resultsSummary}>
              <p className={s.queryEcho}>
                Results for <span className={s.queryTerm}>&ldquo;{query}&rdquo;</span>
              </p>
              <span className={s.resultsCount}>
                {totalResultsCount} {totalResultsCount === 1 ? 'match' : 'matches'} found
              </span>
            </div>

            {totalResultsCount === 0 ? (
              <div className={s.emptyState}>
                <h2 className={s.emptyTitle}>No exact catalogue matches found</h2>
                <p className={s.emptyText}>
                  We could not find hardware matching &ldquo;{query}&rdquo;. Check the SKU or manufacturer spelling, or explore by discipline below.
                </p>
                <p className={s.emptySuggestionsTitle}>Browse By Discipline</p>
                <div className={s.emptyDisciplineGrid}>
                  {QUICK_DISCIPLINES.map((d) => (
                    <Link key={d.label} href={d.href} className={s.emptyDisciplineBtn}>
                      {d.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* 1. Machines & Kits */}
                {machineResults.length > 0 && (
                  <section className={s.resultSection} aria-labelledby="heading-machines">
                    <div className={s.sectionHeader}>
                      <h2 id="heading-machines" className={s.sectionTitle}>
                        Machines &amp; Chassis ({machineResults.length})
                      </h2>
                      <div className={s.sectionLine} />
                    </div>

                    <div className={s.resultsGrid}>
                      {machineResults.map((item) => {
                        const isHalo = item.tier === 'HALO'
                        return (
                          <article key={item.id} className={s.resultCard}>
                            <div>
                              <div className={s.cardTop}>
                                <span className={s.brandLabel}>{item.brandName}</span>
                                <span className={s.skuChip}>{item.sku}</span>
                              </div>

                              <h3 className={s.productName}>
                                <Link href={`/machines/${item.slug}`} style={{ color: 'inherit' }}>
                                  {item.name}
                                </Link>
                              </h3>

                              <div className={s.metaRow}>
                                <span className={`${s.metaChip} ${isHalo ? s.metaChipHalo : ''}`}>
                                  {isHalo ? '★ HALO TIER' : item.productType}
                                </span>
                                <span className={s.metaChip}>{item.lifecycle}</span>
                              </div>

                              {item.isReplaced && item.replacement && (
                                <div className={s.replacedNotice}>
                                  Superseded by {item.replacement.name} ({item.replacement.sku})
                                </div>
                              )}
                            </div>

                            <div className={s.cardFooter}>
                              {item.offer ? (
                                <div>
                                  <MarketAwarePrice
                                    amountMinorUnits={item.offer.retailPriceMinorUnits}
                                    currency={item.offer.currency as Currency}
                                    taxMode={item.offer.taxMode}
                                    size="sm"
                                  />
                                  <div style={{ marginTop: '2px' }}>
                                    <StockStatus status={item.offer.availability} leadTimeDays={item.offer.leadTimeDays} />
                                  </div>
                                </div>
                              ) : (
                                <StockStatus status="NOT_AVAILABLE" />
                              )}

                              <Link
                                href={`/machines/${item.slug}`}
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 600,
                                  color: isHalo ? 'var(--colour-halo)' : 'var(--colour-off-white)',
                                  textDecoration: 'none',
                                }}
                              >
                                View Specs →
                              </Link>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* 2. Components & Electronics */}
                {componentResults.length > 0 && (
                  <section className={s.resultSection} aria-labelledby="heading-components">
                    <div className={s.sectionHeader}>
                      <h2 id="heading-components" className={s.sectionTitle}>
                        Components &amp; Electronics ({componentResults.length})
                      </h2>
                      <div className={s.sectionLine} />
                    </div>

                    <div className={s.resultsGrid}>
                      {componentResults.map((item) => (
                        <article key={item.id} className={s.resultCard}>
                          <div>
                            <div className={s.cardTop}>
                              <span className={s.brandLabel}>{item.brandName}</span>
                              <span className={s.skuChip}>{item.sku}</span>
                            </div>

                            <h3 className={s.productName}>{item.name}</h3>

                            <div className={s.metaRow}>
                              <span className={s.metaChip}>{item.productType}</span>
                              <span className={s.metaChip}>{item.lifecycle}</span>
                            </div>
                          </div>

                          <div className={s.cardFooter}>
                            {item.offer ? (
                              <div>
                                <MarketAwarePrice
                                  amountMinorUnits={item.offer.retailPriceMinorUnits}
                                  currency={item.offer.currency as Currency}
                                  taxMode={item.offer.taxMode}
                                  size="sm"
                                />
                                <div style={{ marginTop: '2px' }}>
                                  <StockStatus status={item.offer.availability} leadTimeDays={item.offer.leadTimeDays} />
                                </div>
                              </div>
                            ) : (
                              <StockStatus status="NOT_AVAILABLE" />
                            )}

                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--colour-smoke)',
                              }}
                            >
                              Verified Part
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. Brands */}
                {brandResults.length > 0 && (
                  <section className={s.resultSection} aria-labelledby="heading-brands">
                    <div className={s.sectionHeader}>
                      <h2 id="heading-brands" className={s.sectionTitle}>
                        Marques &amp; Manufacturers ({brandResults.length})
                      </h2>
                      <div className={s.sectionLine} />
                    </div>

                    <div className={s.resultsGrid}>
                      {brandResults.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/brands/${brand.slug}`}
                          className={s.resultCard}
                        >
                          <div>
                            <div className={s.cardTop}>
                              <span className={s.brandLabel}>{brand.countryOfOrigin}</span>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.625rem',
                                  color: 'var(--colour-verified)',
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {brand.commercialRelationship}
                              </span>
                            </div>

                            <h3 className={s.productName}>{brand.name}</h3>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: '1.5' }}>
                              {brand.description}
                            </p>
                          </div>

                          <div className={s.cardFooter}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-steel)' }}>
                              {brand.machinesCount} machines · {brand.partsCount} parts
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)' }}>
                              Brand Profile →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Default exploration state */
          <div className={s.emptyState}>
            <h2 className={s.emptyTitle}>Explore the Product Graph</h2>
            <p className={s.emptyText}>
              Enter a manufacturer SKU, platform model, or brand above, or jump straight into a discipline:
            </p>
            <div className={s.emptyDisciplineGrid}>
              {QUICK_DISCIPLINES.map((d) => (
                <Link key={d.label} href={d.href} className={s.emptyDisciplineBtn}>
                  {d.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
