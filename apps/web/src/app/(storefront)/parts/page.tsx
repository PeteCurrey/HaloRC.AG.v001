import type { Metadata } from 'next'
import Image from 'next/image'
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
  { label: 'Chassis', slug: 'CHASSIS' },
  { label: 'Engine & Fuel', slug: 'ENGINE' },
  { label: 'Hardware', slug: 'HARDWARE' },
  { label: 'Tools', slug: 'TOOLS' },
  { label: 'Option & Upgrade', slug: 'OPTION_PART' },
  { label: 'Replacement', slug: 'REPLACEMENT_PART' },
  { label: 'Body & Aero', slug: 'BODY' },
  { label: 'Electronics', slug: 'ESC' },
]

const BRANDS_FILTER = [
  { label: 'All Marques', slug: 'all' },
  { label: 'Mugen Seiki', slug: 'mugen-seiki' },
  { label: 'XRAY', slug: 'xray' },
  { label: 'Yokomo', slug: 'yokomo' },
  { label: 'Traxxas', slug: 'traxxas' },
  { label: 'Hobbywing', slug: 'hobbywing' },
]

const PLATFORM_FILTERS = [
  { label: 'All Platforms', value: 'all' },
  { label: 'Mugen MBX8R', value: 'plat-mugen-mbx8r' },
  { label: 'Mugen MTC2R', value: 'plat-mugen-mtc2r' },
  { label: 'XRAY X4', value: 'plat-xray-x4' },
  { label: 'Traxxas X-Maxx', value: 'plat-xmaxx' },
  { label: 'Yokomo MD 2.0', value: 'plat-yokomo-md2' },
]

interface PartsPageProps {
  searchParams: Promise<{
    type?: string
    platform?: string
    brand?: string
    sort?: string
    view?: string
  }>
}

export default async function PartsPage({ searchParams }: PartsPageProps) {
  const { type, platform, brand, sort, view } = await searchParams
  const activeType = type ?? 'all'
  const activePlatform = platform ?? 'all'
  const activeBrand = brand ?? 'all'
  const activeSort = sort ?? 'featured'
  const activeMarket = await getMarketPreference()

  const hasActiveFilters =
    (type && type !== 'all') ||
    (platform && platform !== 'all') ||
    (brand && brand !== 'all') ||
    (sort && sort !== 'featured')
  const isCatalogueMode = view === 'catalogue' || hasActiveFilters

  const parts = isCatalogueMode
    ? await getPartsList({
        type: activeType,
        ...(activePlatform !== 'all' ? { platformId: activePlatform } : {}),
        ...(activeBrand !== 'all' ? { brand: activeBrand } : {}),
        sort: activeSort,
        marketCode: activeMarket,
      })
    : []

  // Pre-load real component items for showroom chapters
  const [suspensionParts, drivetrainParts, engineParts] = !isCatalogueMode
    ? await Promise.all([
        getPartsList({ type: 'SUSPENSION', marketCode: activeMarket, limit: 3 }),
        getPartsList({ type: 'DRIVETRAIN', marketCode: activeMarket, limit: 3 }),
        getPartsList({ type: 'ENGINE', marketCode: activeMarket, limit: 4 }),
      ])
    : [[], [], []]

  function buildFilterHref(newParams: { type?: string; platform?: string; brand?: string; sort?: string }) {
    const t = newParams.type !== undefined ? newParams.type : activeType
    const p = newParams.platform !== undefined ? newParams.platform : activePlatform
    const b = newParams.brand !== undefined ? newParams.brand : activeBrand
    const so = newParams.sort !== undefined ? newParams.sort : activeSort

    const queryParts: string[] = ['view=catalogue']
    if (t && t !== 'all') queryParts.push(`type=${encodeURIComponent(t)}`)
    if (p && p !== 'all') queryParts.push(`platform=${encodeURIComponent(p)}`)
    if (b && b !== 'all') queryParts.push(`brand=${encodeURIComponent(b)}`)
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
                  <span className={s.filterLabel}>Marque:</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {BRANDS_FILTER.map((br) => {
                      const isSelected = activeBrand.toLowerCase() === br.slug.toLowerCase()
                      return (
                        <Link
                          key={br.slug}
                          href={buildFilterHref({ brand: br.slug })}
                          className={`${s.tabLink} ${isSelected ? s.tabLinkActive : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          {br.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className={s.filterGroup}>
                  <span className={s.filterLabel}>Platform:</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
                    No components match the active system, marque, and platform criteria.
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
                          {/* State B: Strict Editorial Typographic Card */}
                          <div className={s.editorialCardSlot}>
                            <div className={s.editorialCardMarque}>
                              <span className={s.editorialCardBrand}>{p.brand.name}</span>
                              <span className={s.editorialCardBadge}>
                                {p.sku || p.productType.replace('_', ' ')}
                              </span>
                            </div>
                            <div className={s.editorialCardCenter}>
                              <div className={s.editorialCardTitle}>
                                {p.shortName ?? p.name}
                              </div>
                            </div>
                            <div className={s.editorialCardFooter}>
                              <span>{p.sku ? `PART // ${p.sku}` : 'PRECISION COMPONENT'}</span>
                              <span>{p.productType.replace('_', ' ')}</span>
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
        <div className={s.showroomHeroBg} aria-hidden="true">
          <Image
            src="/images/brands/hobbywing.jpg"
            alt="Precision RC parts and electronics"
            fill
            priority
            quality={90}
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          />
        </div>
        <div className={s.showroomHeroScrim} aria-hidden="true" />
        <div className={s.showroomHeroScrimTop} aria-hidden="true" />
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
              {suspensionParts.length > 0 ? (
                <div className={s.chapterCards}>
                  {suspensionParts.map((sp) => (
                    <Link key={sp.id} href={`/parts/${sp.slug}`} className={s.chapterCard}>
                      <div className={s.editorialCardSlot} style={{ marginBottom: 0, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                        <div className={s.editorialCardMarque}>
                          <span className={s.editorialCardBrand}>{sp.brand.name}</span>
                          <span className={s.editorialCardBadge}>{sp.sku || sp.productType}</span>
                        </div>
                        <div className={s.editorialCardCenter}>
                          <div className={s.editorialCardTitle}>{sp.shortName ?? sp.name}</div>
                        </div>
                        <div className={s.editorialCardFooter}>
                          <span>{sp.sku ? `PART // ${sp.sku}` : 'PRECISION COMPONENT'}</span>
                          <span>{sp.productType.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.cardBadgeSmall}>{sp.productType.replace('_', ' ')}</span>
                        <span className={s.chapterCardBrand}>{sp.brand.name}</span>
                        <h3 className={s.chapterCardName}>{sp.name}</h3>
                        {sp.offer && (
                          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                            <MarketAwarePrice
                              amountMinorUnits={sp.offer.retailPriceMinorUnits}
                              currency={sp.offer.currency as Currency}
                              taxMode={sp.offer.taxMode}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for suspension and steering hardware.
                  </p>
                </div>
              )}
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
                Heavy-duty steel CV driveshafts and reinforced bellcranks engineered for competition
                output without mechanical failure.
              </p>
              {drivetrainParts.length > 0 ? (
                <div className={s.chapterCards}>
                  {drivetrainParts.map((dp) => (
                    <Link key={dp.id} href={`/parts/${dp.slug}`} className={s.chapterCard}>
                      <div className={s.editorialCardSlot} style={{ marginBottom: 0, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                        <div className={s.editorialCardMarque}>
                          <span className={s.editorialCardBrand}>{dp.brand.name}</span>
                          <span className={s.editorialCardBadge}>{dp.sku || dp.productType}</span>
                        </div>
                        <div className={s.editorialCardCenter}>
                          <div className={s.editorialCardTitle}>{dp.shortName ?? dp.name}</div>
                        </div>
                        <div className={s.editorialCardFooter}>
                          <span>{dp.sku ? `PART // ${dp.sku}` : 'PRECISION COMPONENT'}</span>
                          <span>{dp.productType.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.cardBadgeSmall}>{dp.productType.replace('_', ' ')}</span>
                        <span className={s.chapterCardBrand}>{dp.brand.name}</span>
                        <h3 className={s.chapterCardName}>{dp.name}</h3>
                        {dp.offer && (
                          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                            <MarketAwarePrice
                              amountMinorUnits={dp.offer.retailPriceMinorUnits}
                              currency={dp.offer.currency as Currency}
                              taxMode={dp.offer.taxMode}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for drivetrain and driveline components.
                  </p>
                </div>
              )}
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
                Lightweight polycarbonate shells shaped for optimal front splitter bite
                and high-speed rear wing downforce stability.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Specialist aero catalogue developing — we are establishing our manufacturer network for competition shells and wings.
                </p>
              </div>
              <Link href="/parts?view=catalogue&type=BODY" className={s.chapterCta}>
                Explore All Body Shells →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Race Electronics & Power Chapter (Dark) ── */}
      <section className={s.darkElectronicsChapter}>
        <div className={s.darkElectronicsInner}>
          <div className={s.darkElectronicsHeader}>
            <p className={s.darkElectronicsEyebrow}>Engine, Fuel &amp; Electronics</p>
            <h2 className={s.darkElectronicsHeadline}>Drive system components,<br />competition-specified.</h2>
            <p className={s.darkElectronicsSubline}>
              Championship nitro powerplants, tuned exhaust pipes, centrifugal clutches, and high-performance
              hardware configured for uncompromising national and world championship campaigns.
            </p>
          </div>
          {engineParts.length > 0 ? (
            <div className={s.electronicsGrid}>
              {engineParts.map((ep) => (
                <Link key={ep.id} href={`/parts/${ep.slug}`} className={s.electronicsCard}>
                  <div className={s.editorialCardSlot} style={{ marginBottom: 0, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }}>
                    <div className={s.editorialCardMarque}>
                      <span className={s.editorialCardBrand}>{ep.brand.name}</span>
                      <span className={s.editorialCardBadge}>{ep.sku || ep.productType}</span>
                    </div>
                    <div className={s.editorialCardCenter}>
                      <div className={s.editorialCardTitle}>{ep.shortName ?? ep.name}</div>
                    </div>
                    <div className={s.editorialCardFooter}>
                      <span>{ep.sku ? `PART // ${ep.sku}` : 'PRECISION COMPONENT'}</span>
                      <span>{ep.productType.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className={s.electronicsCardContent}>
                    <span className={s.electronicsCardTag}>{ep.brand.name}</span>
                    <h3 className={s.electronicsCardName}>{ep.shortName ?? ep.name}</h3>
                    <p className={s.electronicsCardDetail}>{ep.editorialSummary}</p>
                    {ep.offer && (
                      <div className={s.electronicsSpecRow}>
                        <MarketAwarePrice
                          amountMinorUnits={ep.offer.retailPriceMinorUnits}
                          currency={ep.offer.currency as Currency}
                          taxMode={ep.offer.taxMode}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.emptyGrid} style={{ maxWidth: '640px', margin: '0 auto' }}>
              <p className={s.emptyGridText} style={{ color: 'rgba(255,255,255,0.7)' }}>
                Competition electronics &amp; engine catalogue developing.
              </p>
            </div>
          )}
          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
            <Link href="/parts?view=catalogue&type=ENGINE" className={s.heroSecondary} style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>
              Explore All Competition Power &amp; Engines →
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
            Avorria only lists compatibility where it has been verified against confirmed platform geometry and manufacturer documentation. Zero unverified fitment claims.
          </p>
          <div className={s.platformCards}>
            <Link href="/parts?view=catalogue&brand=mugen-seiki" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>Mugen Seiki</span>
                <span className={s.platformScale}>1:8 &amp; 1:10</span>
              </div>
              <h3 className={s.platformName}>MBX8R &amp; MTC2R</h3>
              <p className={s.platformDesc}>
                Complete factory spares, carbon option parts, and precision suspension components for Mugen Seiki nitro &amp; electric chassis.
              </p>
              <span className={s.platformCta}>Browse 2,600+ Parts &rarr;</span>
            </Link>

            <Link href="/parts?view=catalogue&platform=plat-xray-x4" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>XRAY</span>
                <span className={s.platformScale}>1:10 On-Road</span>
              </div>
              <h3 className={s.platformName}>XRAY X4 Touring</h3>
              <p className={s.platformDesc}>
                Precision European touring car architecture. Sourced through authorized distributor lineage.
              </p>
              <span className={s.platformCta}>View Compatible Hardware &rarr;</span>
            </Link>

            <Link href="/parts?view=catalogue&platform=plat-xmaxx" className={s.platformCard}>
              <div className={s.platformCardHeader}>
                <span className={s.platformBrand}>Traxxas</span>
                <span className={s.platformScale}>1:5 Monster</span>
              </div>
              <h3 className={s.platformName}>X-Maxx 8S</h3>
              <p className={s.platformDesc}>
                Extreme-duty driveline, brushless power upgrades, and hardened differentials for 8S bashing.
              </p>
              <span className={s.platformCta}>View Compatible Hardware &rarr;</span>
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
            <Link href="/parts?view=catalogue&type=ENGINE" className={s.heroSecondary}>
              Engines
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
