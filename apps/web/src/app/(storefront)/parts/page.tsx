import type { Metadata } from 'next'
import Link from 'next/link'
import s from './parts.module.css'
import { getMarketPreference } from '@/actions/market'
import { getPartsList } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'Parts & Upgrades — Avorria RC Showroom',
  description:
    'Precision hardware, factory replacements, and competition electronics for verified RC platforms. Sourced directly from authorized engineering marques.',
  alternates: {
    canonical: 'https://avorria.com/parts',
  },
}

const PART_SYSTEMS = [
  { label: 'All Parts', slug: 'all' },
  { label: 'Suspension', slug: 'SUSPENSION' },
  { label: 'Drivetrain', slug: 'DRIVETRAIN' },
  { label: 'Option & Upgrade', slug: 'OPTION_PART' },
  { label: 'Replacement', slug: 'REPLACEMENT_PART' },
  { label: 'Body & Aero', slug: 'BODY' },
  { label: 'ESC', slug: 'ESC' },
  { label: 'Motors', slug: 'MOTOR' },
  { label: 'Servos', slug: 'SERVO' },
  { label: 'Radio Systems', slug: 'RADIO_SYSTEM' },
  { label: 'Batteries & Power', slug: 'BATTERY' },
]

const PLATFORM_FILTERS = [
  { label: 'All Platforms', value: 'all' },
  { label: 'XRAY X4', value: 'plat-xray-x4' },
  { label: 'Traxxas X-Maxx', value: 'plat-xmaxx' },
  { label: 'Yokomo MD 2.0', value: 'plat-yokomo-md2' },
]

interface PartsPageProps {
  searchParams: Promise<{
    type?: string
    platform?: string
    sort?: string
    view?: string
  }>
}

export default async function PartsPage({ searchParams }: PartsPageProps) {
  const { type, platform, sort, view } = await searchParams
  const activeType = type ?? 'all'
  const activePlatform = platform ?? 'all'
  const activeSort = sort ?? 'featured'
  const activeMarket = await getMarketPreference()

  const hasActiveFilters =
    (type && type !== 'all') ||
    (platform && platform !== 'all') ||
    (sort && sort !== 'featured')
  const isCatalogueMode = view === 'catalogue' || hasActiveFilters

  const parts = isCatalogueMode
    ? await getPartsList({
        type: activeType,
        ...(activePlatform !== 'all' ? { platformId: activePlatform } : {}),
        sort: activeSort,
        marketCode: activeMarket,
      })
    : []

  function buildFilterHref(newParams: { type?: string; platform?: string; sort?: string }) {
    const t = newParams.type !== undefined ? newParams.type : activeType
    const p = newParams.platform !== undefined ? newParams.platform : activePlatform
    const so = newParams.sort !== undefined ? newParams.sort : activeSort

    const queryParts: string[] = ['view=catalogue']
    if (t && t !== 'all') queryParts.push(`type=${encodeURIComponent(t)}`)
    if (p && p !== 'all') queryParts.push(`platform=${encodeURIComponent(p)}`)
    if (so && so !== 'featured') queryParts.push(`sort=${encodeURIComponent(so)}`)

    return `/parts?${queryParts.join('&')}`
  }

  // ── CATALOGUE MODE ─────────────────────────────────────────────────────────
  if (isCatalogueMode) {
    return (
      <div className={s.cataloguePage}>
        <div className={s.catalogueHeader}>
          <div className={s.catalogueHeaderInner}>
            <Link href="/parts" className={s.backToShowroom}>
              ← Showroom
            </Link>
            <div>
              <p className={s.catalogueEyebrow}>Technical Catalogue</p>
              <h1 className={s.catalogueHeadline}>All Parts &amp; Components</h1>
            </div>
          </div>
        </div>

        <div className={s.catalogueBody}>
          <div className={s.container}>
            {/* ── Controls Bar ── */}
            <div className={s.controlsBar}>
              <nav aria-label="Filter by component system">
                <ul className={s.systemTabs}>
                  {PART_SYSTEMS.map((sys) => {
                    const isSelected = activeType.toUpperCase() === sys.slug.toUpperCase()
                    return (
                      <li key={sys.slug}>
                        <Link
                          href={buildFilterHref({ type: sys.slug })}
                          className={`${s.tabLink} ${isSelected ? s.tabLinkActive : ''}`}
                          aria-current={isSelected ? 'page' : undefined}
                        >
                          {sys.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className={s.secondaryFilters}>
                <div className={s.filterGroup}>
                  <span className={s.filterLabel}>Platform:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PLATFORM_FILTERS.map((plat) => {
                      const isSelected = activePlatform === plat.value
                      return (
                        <Link
                          key={plat.value}
                          href={buildFilterHref({ platform: plat.value })}
                          className={`${s.tabLink} ${isSelected ? s.tabLinkActive : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          {plat.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>

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
            <section aria-label="Parts list">
              {parts.length === 0 ? (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    No components match the active system and platform criteria.
                  </p>
                  <Link href="/parts?view=catalogue" className={s.tabLink}>
                    Reset all filters
                  </Link>
                </div>
              ) : (
                <div className={s.productGrid}>
                  {parts.map((p) => {
                    const isHalo = p.tier === 'HALO'
                    return (
                      <article
                        key={p.id}
                        className={`${s.card} ${isHalo ? s.cardHalo : ''}`}
                      >
                        <div>
                          <div className={s.cardImageSlot}>
                            <div className={s.imagePlaceholder}>
                              {p.brand.name} · {p.shortName ?? p.name}
                            </div>
                          </div>

                          <div className={s.cardHeader}>
                            <span className={s.brandName}>{p.brand.name}</span>
                            {isHalo ? (
                              <span className={`${s.tierBadge} ${s.tierBadgeHalo}`}>
                                ★ Halo / {p.haloClassification ?? 'Option'}
                              </span>
                            ) : (
                              <span className={s.tierBadge}>
                                {p.productType.replace('_', ' ')}
                              </span>
                            )}
                          </div>

                          <h2 className={s.partName}>
                            <Link href={`/parts/${p.slug}`} style={{ color: 'inherit' }}>
                              {p.name}
                            </Link>
                          </h2>

                          <p className={s.editorial}>{p.editorialSummary}</p>

                          <div className={s.specsRow}>
                            <span className={s.specChip}>Type: {p.productType.replace('_', ' ')}</span>
                            {p.sku && <span className={s.specChip}>SKU: {p.sku}</span>}
                            {p.scale && <span className={s.specChip}>Scale: {p.scale}</span>}
                          </div>
                        </div>

                        <div className={s.cardFooter}>
                          <div>
                            {p.offer ? (
                              <>
                                <MarketAwarePrice
                                  amountMinorUnits={p.offer.retailPriceMinorUnits}
                                  currency={p.offer.currency as Currency}
                                  taxMode={p.offer.taxMode}
                                  size="base"
                                />
                                <div style={{ marginTop: 'var(--space-1)' }}>
                                  <StockStatus
                                    status={p.offer.availability}
                                    leadTimeDays={p.offer.leadTimeDays}
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

                          <Link
                            href={`/parts/${p.slug}`}
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
      </div>
    )
  }

  // ── SHOWROOM MODE ──────────────────────────────────────────────────────────
  return (
    <div className={s.showroom}>

      {/* ── 1. Cinematic Hero ── */}
      <section className={s.showroomHero}>
        <div
          className={s.showroomHeroBg}
          style={{ backgroundImage: 'url(/images/hero/hero-1-5-scale-rc.jpg)' }}
          aria-hidden="true"
        />
        <div className={s.showroomHeroContent}>
          <p className={s.showroomHeroEyebrow}>Parts &amp; Upgrades</p>
          <h1 className={s.showroomHeroHeadline}>
            Precision hardware,<br />specified correctly.
          </h1>
          <p className={s.showroomHeroSubline}>
            Every component in the Avorria inventory is cross-referenced against verified
            platform geometry and competition specifications. Zero unverified fitment claims.
          </p>
          <div className={s.showroomHeroActions}>
            <Link href="/parts?view=catalogue" className={s.heroPrimary}>
              Browse All Parts
            </Link>
            <a href="#systems" className={s.heroSecondary}>
              Explore by System ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Editorial Standards ── */}
      <section className={s.editorialSpread}>
        <div className={s.editorialSpreadInner}>
          <div className={s.editorialText}>
            <p className={s.sectionEyebrow}>Sourcing Philosophy</p>
            <h2 className={s.sectionHeadline}>Component discipline,<br />not catalogue filler.</h2>
            <p className={s.sectionBody}>
              Generic RC retailers catalogue thousands of unverified SKUs with generic fitment tags.
              Avorria operates differently: every part, option, and electronic unit is bound to
              deterministic compatibility rules verified against manufacturer documentation.
            </p>
            <p className={s.sectionBody}>
              Whether maintaining a factory platform, upgrading to titanium hardware, or tuning
              competition throttle curves, every component is sourced through authorized distribution
              with transparent supply lineage.
            </p>
          </div>
          <div className={s.editorialStats}>
            <div className={s.statItem}>
              <span className={s.statNumber}>10+</span>
              <span className={s.statLabel}>Component Systems</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>OEM</span>
              <span className={s.statLabel}>&amp; Option Parts</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>Race</span>
              <span className={s.statLabel}>Electronics</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>100%</span>
              <span className={s.statLabel}>Verified Fitment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Component Systems Chapters ── */}
      <section className={s.systemChapters} id="systems">
        <div className={s.systemChaptersInner}>

          {/* Suspension & Steering */}
          <div className={s.systemChapter}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>System 01</p>
              <h2 className={s.chapterHeadline}>Suspension &amp; Steering</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Suspension geometry dictates mechanical grip, roll center stability, and damper response.
                Our suspension catalogue covers genuine replacement arms, precision titanium pivot balls,
                and zero-slop CNC aluminium bellcrank assemblies.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for suspension and steering hardware.
                </p>
              </div>
              <Link href="/parts?view=catalogue&type=SUSPENSION" className={s.chapterCta}>
                Explore All Suspension &amp; Steering →
              </Link>
            </div>
          </div>

          {/* Drivetrain & Driveline */}
          <div className={`${s.systemChapter} ${s.systemChapterReverse}`}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>System 02</p>
              <h2 className={s.chapterHeadline}>Drivetrain &amp; Driveline</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Power delivery demands components capable of managing violent torque spikes.
                Heavy-duty steel CV driveshafts and reinforced bellcranks engineered for 8S
                brushless output without mechanical failure.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for drivetrain and driveline components.
                </p>
              </div>
              <Link href="/parts?view=catalogue&type=DRIVETRAIN" className={s.chapterCta}>
                Explore All Drivetrain Parts →
              </Link>
            </div>
          </div>

          {/* Aerodynamics & Body */}
          <div className={s.systemChapter}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>System 03</p>
              <h2 className={s.chapterHeadline}>Body Shells &amp; Aero</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                High-speed touring car dynamics require homologated aerodynamic profiles.
                Lightweight polycarbonate shells shaped in Italian wind tunnels for optimal
                front splitter bite and high-speed rear wing stability.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for body shells and aero.
                </p>
              </div>
              <Link href="/parts?view=catalogue&type=BODY" className={s.chapterCta}>
                Explore All Body Shells →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Race Electronics Chapter (Dark) ── */}
      <section className={s.darkElectronicsChapter}>
        <div className={s.darkElectronicsInner}>
          <div className={s.darkElectronicsHeader}>
            <p className={s.darkElectronicsEyebrow}>Race Electronics &amp; Power</p>
            <h2 className={s.darkElectronicsHeadline}>Drive system components,<br />competition-specified.</h2>
            <p className={s.darkElectronicsSubline}>
              Championship speed controllers, low-latency telemetry transmitters, sensored brushless motors,
              and titanium-geared servos configured for uncompromising competition.
            </p>
          </div>
          <div className={s.emptyGrid} style={{ maxWidth: '640px', margin: '0 auto' }}>
            <p className={s.emptyGridText} style={{ color: 'rgba(255,255,255,0.7)' }}>
              Competition electronics catalogue developing. We are actively establishing authorised dealer and distribution relationships with specialist electronics marques.
            </p>
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
              <Link href="/parts?view=catalogue&type=ESC" className={s.heroSecondary} style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
                Explore All Electronics in Catalogue →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Parts for Verified Platforms ── */}
      <section className={s.platformsSection}>
        <div className={s.platformsInner}>
          <p className={s.sectionEyebrow}>Platform Architecture</p>
          <h2 className={s.platformsHeadline}>Parts for verified platforms.</h2>
          <p className={s.platformsSubline}>
            Avorria only lists compatibility where it has been verified against confirmed platform geometry and manufacturer documentation. Zero unverified fitment claims.
          </p>
          <div className={s.emptyGrid} style={{ maxWidth: '640px', margin: '0 auto' }}>
            <p className={s.emptyGridText}>
              Platform-specific compatibility matrix developing. Component listings are released as supplier relationships and verified CAD/manual specifications are confirmed.
            </p>
            <Link href="/parts?view=catalogue" className={s.tabLink}>
              Browse Technical Catalogue →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Catalogue Transition ── */}
      <section className={s.catalogueGateway}>
        <div className={s.catalogueGatewayInner}>
          <p className={s.sectionEyebrow}>Complete Inventory</p>
          <h2 className={s.catalogueGatewayHeadline}>Looking for a specific component?</h2>
          <p className={s.catalogueGatewayBody}>
            Search the complete Avorria parts inventory with system filters, live market availability,
            and verified platform fitment.
          </p>
          <div className={s.catalogueGatewayActions}>
            <Link href="/parts?view=catalogue" className={s.heroPrimary}>
              Browse All Parts →
            </Link>
            <Link href="/parts?view=catalogue&type=SUSPENSION" className={s.heroSecondary}>
              Suspension
            </Link>
            <Link href="/parts?view=catalogue&type=DRIVETRAIN" className={s.heroSecondary}>
              Drivetrain
            </Link>
            <Link href="/parts?view=catalogue&type=ESC" className={s.heroSecondary}>
              Electronics
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
