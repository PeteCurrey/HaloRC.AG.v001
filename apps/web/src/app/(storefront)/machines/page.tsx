import type { Metadata } from 'next'
import Link from 'next/link'
import s from './machines.module.css'
import { getMarketPreference } from '@/actions/market'
import { getMachinesList } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'The Machines — Curated RC Catalogue',
  description: 'Browse our curated selection of verified competition and flagship RC machines across bash, race, drift, crawl, and large scale.',
  alternates: {
    canonical: 'https://halo-rc.com/machines',
  },
}

const DISCIPLINES = [
  { label: 'All Disciplines', slug: 'all' },
  { label: 'Bash', slug: 'bash' },
  { label: 'Race', slug: 'race' },
  { label: 'Drift', slug: 'drift' },
  { label: 'Crawl', slug: 'crawl' },
  { label: 'Scale', slug: 'scale' },
  { label: 'Large Scale', slug: 'large_scale' },
]

const SCALES = [
  { label: 'All Scales', value: 'all' },
  { label: '1:5 Scale', value: '1:5' },
  { label: '1:8 Scale', value: '1:8' },
  { label: '1:10 Scale', value: '1:10' },
]

interface MachinesPageProps {
  searchParams: Promise<{
    discipline?: string
    scale?: string
    sort?: string
  }>
}

export default async function MachinesPage({ searchParams }: MachinesPageProps) {
  const { discipline, scale, sort } = await searchParams
  const activeDiscipline = discipline ?? 'all'
  const activeScale = scale ?? 'all'
  const activeSort = sort ?? 'featured'
  const activeMarket = await getMarketPreference()

  const machines = await getMachinesList({
    discipline: activeDiscipline,
    ...(activeScale !== 'all' ? { scale: activeScale } : {}),
    sort: activeSort,
    marketCode: activeMarket,
  })

  // Helper to build filter query string
  function buildFilterHref(newParams: { discipline?: string; scale?: string; sort?: string }) {
    const d = newParams.discipline !== undefined ? newParams.discipline : activeDiscipline
    const sc = newParams.scale !== undefined ? newParams.scale : activeScale
    const so = newParams.sort !== undefined ? newParams.sort : activeSort

    const queryParts: string[] = []
    if (d && d !== 'all') queryParts.push(`discipline=${encodeURIComponent(d)}`)
    if (sc && sc !== 'all') queryParts.push(`scale=${encodeURIComponent(sc)}`)
    if (so && so !== 'featured') queryParts.push(`sort=${encodeURIComponent(so)}`)

    return queryParts.length > 0 ? `/machines?${queryParts.join('&')}` : '/machines'
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        {/* ── Header ── */}
        <p className={s.eyebrow}>The Machines</p>

        <h1 className={s.headline}>
          Precision engineering,<br />at every scale.
        </h1>

        <p className={s.subline}>
          Every machine in the Halo RC catalogue is chosen for documented engineering excellence.
          Verified platforms, structured compatibility, and market-aware delivery.
        </p>

        {/* ── Controls Bar: Filters & Sort ── */}
        <div className={s.controlsBar}>
          {/* Discipline tabs */}
          <nav aria-label="Filter by discipline">
            <ul className={s.disciplineTabs}>
              {DISCIPLINES.map((d) => {
                const isSelected = activeDiscipline.toLowerCase() === d.slug.toLowerCase()
                return (
                  <li key={d.slug}>
                    <Link
                      href={buildFilterHref({ discipline: d.slug })}
                      className={`${s.tabLink} ${isSelected ? s.tabLinkActive : ''}`}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      {d.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Scale & Sort controls */}
          <div className={s.secondaryFilters}>
            {/* Scale filter pills */}
            <div className={s.filterGroup}>
              <span className={s.filterLabel}>Scale:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {SCALES.map((sc) => {
                  const isSelected = activeScale === sc.value
                  return (
                    <Link
                      key={sc.value}
                      href={buildFilterHref({ scale: sc.value })}
                      className={`${s.tabLink} ${isSelected ? s.tabLinkActive : ''}`}
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      {sc.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Sort links */}
            <div className={s.filterGroup}>
              <span className={s.filterLabel}>Sort:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Link
                  href={buildFilterHref({ sort: 'featured' })}
                  className={`${s.tabLink} ${activeSort === 'featured' ? s.tabLinkActive : ''}`}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Featured
                </Link>
                <Link
                  href={buildFilterHref({ sort: 'price_asc' })}
                  className={`${s.tabLink} ${activeSort === 'price_asc' ? s.tabLinkActive : ''}`}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Price ↑
                </Link>
                <Link
                  href={buildFilterHref({ sort: 'price_desc' })}
                  className={`${s.tabLink} ${activeSort === 'price_desc' ? s.tabLinkActive : ''}`}
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Price ↓
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Grid ── */}
        <section aria-label="Machines list">
          {machines.length === 0 ? (
            <div className={s.emptyGrid}>
              <p className={s.emptyGridText}>
                No platforms match the active discipline and scale criteria.
              </p>
              <Link href="/machines" className={s.tabLink}>
                Reset all filters
              </Link>
            </div>
          ) : (
            <div className={s.productGrid}>
              {machines.map((m) => {
                const isHalo = m.tier === 'HALO'
                return (
                  <article
                    key={m.id}
                    className={`${s.card} ${isHalo ? s.cardHalo : ''}`}
                  >
                    <div>
                      {/* Image Slot */}
                      <div className={s.cardImageSlot}>
                        <div className={s.imagePlaceholder}>
                          {m.brand.name} · {m.shortName ?? m.name}
                        </div>
                      </div>

                      {/* Brand & Tier Flag */}
                      <div className={s.cardHeader}>
                        <span className={s.brandName}>{m.brand.name}</span>
                        {isHalo ? (
                          <span className={`${s.tierBadge} ${s.tierBadgeHalo}`}>
                            ★ Halo / {m.haloClassification ?? 'Competition'}
                          </span>
                        ) : (
                          <span className={s.tierBadge}>
                            {m.scale ?? 'Standard'}
                          </span>
                        )}
                      </div>

                      {/* Machine Title */}
                      <h2 className={s.machineName}>
                        <Link href={`/machines/${m.slug}`} style={{ color: 'inherit' }}>
                          {m.name}
                        </Link>
                      </h2>

                      {/* Editorial Summary */}
                      <p className={s.editorial}>
                        {m.editorialSummary}
                      </p>

                      {/* Tech specs chip row */}
                      <div className={s.specsRow}>
                        {m.scale && (
                          <span className={s.specChip}>Scale: {m.scale}</span>
                        )}
                        {m.powerType && (
                          <span className={s.specChip}>Power: {m.powerType}</span>
                        )}
                        <span className={s.specChip}>Discipline: {m.discipline}</span>
                      </div>
                    </div>

                    {/* Commercial footer */}
                    <div className={s.cardFooter}>
                      <div>
                        {m.offer ? (
                          <>
                            <MarketAwarePrice
                              amountMinorUnits={m.offer.retailPriceMinorUnits}
                              currency={m.offer.currency as Currency}
                              taxMode={m.offer.taxMode}
                              size="base"
                            />
                            <div style={{ marginTop: 'var(--space-1)' }}>
                              <StockStatus status={m.offer.availability} leadTimeDays={m.offer.leadTimeDays} />
                            </div>
                          </>
                        ) : (
                          <div>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                              Not Available in {activeMarket}
                            </p>
                            <StockStatus status="NOT_AVAILABLE" />
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/machines/${m.slug}`}
                        className={`${s.viewCta} ${isHalo ? s.viewCtaHalo : ''}`}
                      >
                        View Specs →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
