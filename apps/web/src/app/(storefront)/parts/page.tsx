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
              <span className={s.statNumber}>15</span>
              <span className={s.statLabel}>Verified Components</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>3</span>
              <span className={s.statLabel}>Chassis Platforms</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>6</span>
              <span className={s.statLabel}>Electronics Brands</span>
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
              <div className={s.chapterCards}>
                <Link href="/parts/xray-302040-titanium-pivot-ball-set-x4" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>XRAY · Pivot Balls</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={`${s.cardBadgeSmall} ${s.cardBadgeHalo}`}>★ Halo Option</span>
                    <span className={s.chapterCardBrand}>XRAY</span>
                    <h3 className={s.chapterCardName}>X4 Titanium Pivot Ball Set</h3>
                    <span className={s.chapterCardSpec}>X4 Platform · Unsprung mass reduction</span>
                  </div>
                </Link>
                <Link href="/parts/xray-302000-front-lower-suspension-arm-graphite" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>XRAY · Lower Arm</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.cardBadgeSmall}>Factory Spec</span>
                    <span className={s.chapterCardBrand}>XRAY</span>
                    <h3 className={s.chapterCardName}>Front Lower Arm — Graphite</h3>
                    <span className={s.chapterCardSpec}>X4 Platform · Tuned flex graphite</span>
                  </div>
                </Link>
                <Link href="/parts/yokomo-md008-aluminum-steering-bellcrank-set" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Yokomo · Bellcrank</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.cardBadgeSmall}>Option Part</span>
                    <span className={s.chapterCardBrand}>Yokomo</span>
                    <h3 className={s.chapterCardName}>Alu Steering Bellcrank Set</h3>
                    <span className={s.chapterCardSpec}>MD 2.0 Drift · Zero-deflection steering</span>
                  </div>
                </Link>
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
              <div className={s.chapterCards}>
                <Link href="/parts/traxxas-7750x-steel-cv-driveshafts-x-maxx" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Traxxas · Driveshafts</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.cardBadgeSmall}>Heavy-Duty Upgrade</span>
                    <span className={s.chapterCardBrand}>Traxxas</span>
                    <h3 className={s.chapterCardName}>Steel Constant-Velocity Driveshafts</h3>
                    <span className={s.chapterCardSpec}>X-Maxx 8S · Hardened steel spline</span>
                  </div>
                </Link>
                <Link href="/parts/traxxas-7746-heavy-duty-steering-bellcranks" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Traxxas · Bellcranks</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.cardBadgeSmall}>Factory Spec</span>
                    <span className={s.chapterCardBrand}>Traxxas</span>
                    <h3 className={s.chapterCardName}>HD Steering Bellcranks</h3>
                    <span className={s.chapterCardSpec}>X-Maxx 8S · Integrated servo saver</span>
                  </div>
                </Link>
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
              <div className={s.chapterCards}>
                <Link href="/parts/mon-tech-hyper-190mm-touring-car-clear-body" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Mon-Tech · Hyper</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.cardBadgeSmall}>EFRA / BRCA Homologated</span>
                    <span className={s.chapterCardBrand}>Mon-Tech</span>
                    <h3 className={s.chapterCardName}>Hyper 190mm Clear Body Shell</h3>
                    <span className={s.chapterCardSpec}>1:10 Touring · High-downforce profile</span>
                  </div>
                </Link>
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
          <div className={s.electronicsGrid}>

            <Link href="/parts/sanwa-m17-fh5-4-channel-radio-system" className={`${s.electronicsCard} ${s.electronicsCardHalo}`}>
              <div className={s.electronicsCardImage}>
                <div className={s.electronicsPlaceholder}>Sanwa · M17 FH5</div>
              </div>
              <div className={s.electronicsCardContent}>
                <p className={s.electronicsCardTag}>★ Halo / Competition Telemetry</p>
                <h3 className={s.electronicsCardName}>Sanwa M17 FH5 Radio</h3>
                <p className={s.electronicsCardDetail}>
                  Ultra-Response Mode (SUR/SXR) delivers sub-millisecond transmission latency with color telemetry display.
                </p>
                <div className={s.electronicsSpecRow}>
                  <span className={s.electronicsSpecPill}>FH5 Protocol</span>
                  <span className={s.electronicsSpecPill}>RX-493i Included</span>
                </div>
              </div>
            </Link>

            <Link href="/parts/hobbywing-xerun-xr10-pro-g3-competition-esc" className={s.electronicsCard}>
              <div className={s.electronicsCardImage}>
                <div className={s.electronicsPlaceholder}>Hobbywing · XR10 Pro</div>
              </div>
              <div className={s.electronicsCardContent}>
                <p className={s.electronicsCardTag}>Competition ESC</p>
                <h3 className={s.electronicsCardName}>XeRun XR10 Pro G3 ESC</h3>
                <p className={s.electronicsCardDetail}>
                  160A continuous output with real-time Bluetooth telemetry logging and frameless cooling fan.
                </p>
                <div className={s.electronicsSpecRow}>
                  <span className={s.electronicsSpecPill}>160A Continuous</span>
                  <span className={s.electronicsSpecPill}>2S LiPo</span>
                </div>
              </div>
            </Link>

            <Link href="/parts/hobbywing-xerun-v10-g4-13-5t-brushless-motor" className={s.electronicsCard}>
              <div className={s.electronicsCardImage}>
                <div className={s.electronicsPlaceholder}>Hobbywing · V10 G4</div>
              </div>
              <div className={s.electronicsCardContent}>
                <p className={s.electronicsCardTag}>Competition Motor</p>
                <h3 className={s.electronicsCardName}>XeRun V10 G4 13.5T Motor</h3>
                <p className={s.electronicsCardDetail}>
                  Race-tuned 13.5T sensored brushless motor with dual sensor ports and dynamic mechanical timing.
                </p>
                <div className={s.electronicsSpecRow}>
                  <span className={s.electronicsSpecPill}>13.5T Spec</span>
                  <span className={s.electronicsSpecPill}>Sensored</span>
                </div>
              </div>
            </Link>

            <Link href="/parts/savox-sb-2292sg-high-voltage-monster-torque-servo" className={s.electronicsCard}>
              <div className={s.electronicsCardImage}>
                <div className={s.electronicsPlaceholder}>Savox · SB-2292SG</div>
              </div>
              <div className={s.electronicsCardContent}>
                <p className={s.electronicsCardTag}>High-Voltage Servo</p>
                <h3 className={s.electronicsCardName}>Savox SB-2292SG Servo</h3>
                <p className={s.electronicsCardDetail}>
                  Patented brushless motor delivering 31.0 kg-cm of holding torque at 0.07 sec speed with hardened steel gears.
                </p>
                <div className={s.electronicsSpecRow}>
                  <span className={s.electronicsSpecPill}>31.0 kg-cm</span>
                  <span className={s.electronicsSpecPill}>0.07s Speed</span>
                </div>
              </div>
            </Link>

          </div>
          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
            <Link href="/parts?view=catalogue&type=ESC" className={s.heroSecondary} style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
              Explore All Electronics in Catalogue →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Parts for Verified Platforms ── */}
      <section className={s.platformsSection}>
        <div className={s.platformsInner}>
          <p className={s.sectionEyebrow}>Platform Architecture</p>
          <h2 className={s.platformsHeadline}>Parts for verified platforms.</h2>
          <p className={s.platformsSubline}>
            Avorria only lists compatibility where it has been verified against confirmed platform geometry.
            Select a verified platform to view compatible components:
          </p>
          <div className={s.platformCards}>

            <Link href="/parts?view=catalogue&platform=plat-xray-x4" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>XRAY</span>
                <span className={s.platformScale}>1:10 Touring</span>
              </div>
              <h3 className={s.platformName}>X4 Touring Platform</h3>
              <p className={s.platformDesc}>
                Graphite suspension arms, titanium pivot balls, and competition spec electronics.
              </p>
              <span className={s.platformCta}>Browse X4 Parts →</span>
            </Link>

            <Link href="/parts?view=catalogue&platform=plat-xmaxx" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>Traxxas</span>
                <span className={s.platformScale}>1:6 Large Scale</span>
              </div>
              <h3 className={s.platformName}>X-Maxx 8S Platform</h3>
              <p className={s.platformDesc}>
                Heavy-duty steel CV driveshafts, reinforced steering bellcranks, and driveline upgrades.
              </p>
              <span className={s.platformCta}>Browse X-Maxx Parts →</span>
            </Link>

            <Link href="/parts?view=catalogue&platform=plat-yokomo-md2" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>Yokomo</span>
                <span className={s.platformScale}>1:10 RWD Drift</span>
              </div>
              <h3 className={s.platformName}>Master Drift MD 2.0</h3>
              <p className={s.platformDesc}>
                CNC aluminium steering bellcrank assemblies and drift competition electronics.
              </p>
              <span className={s.platformCta}>Browse MD 2.0 Parts →</span>
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
