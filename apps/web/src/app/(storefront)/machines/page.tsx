import type { Metadata } from 'next'
import Link from 'next/link'
import s from './machines.module.css'
import { getMarketPreference } from '@/actions/market'
import { getMachinesList } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'The Machines — Avorria RC Showroom',
  description:
    "Explore Avorria RC's curated machine showroom. Engineered platforms across bash, race, drift, crawl, and large scale — from competition touring kits to 1:5 petrol GT3s.",
  alternates: {
    canonical: 'https://avorria.com/machines',
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
    view?: string
  }>
}

export default async function MachinesPage({ searchParams }: MachinesPageProps) {
  const { discipline, scale, sort, view } = await searchParams
  const activeDiscipline = discipline ?? 'all'
  const activeScale = scale ?? 'all'
  const activeSort = sort ?? 'featured'
  const activeMarket = await getMarketPreference()

  // Show catalogue mode if explicitly requested or if any filter/sort is active
  const hasActiveFilters =
    (discipline && discipline !== 'all') ||
    (scale && scale !== 'all') ||
    (sort && sort !== 'featured')
  const isCatalogueMode = view === 'catalogue' || hasActiveFilters

  // Catalogue mode: fetch full machine list
  const machines = isCatalogueMode
    ? await getMachinesList({
        discipline: activeDiscipline,
        ...(activeScale !== 'all' ? { scale: activeScale } : {}),
        sort: activeSort,
        marketCode: activeMarket,
      })
    : []

  // Helper to build filter query string (catalogue mode)
  function buildFilterHref(newParams: { discipline?: string; scale?: string; sort?: string }) {
    const d = newParams.discipline !== undefined ? newParams.discipline : activeDiscipline
    const sc = newParams.scale !== undefined ? newParams.scale : activeScale
    const so = newParams.sort !== undefined ? newParams.sort : activeSort

    const queryParts: string[] = ['view=catalogue']
    if (d && d !== 'all') queryParts.push(`discipline=${encodeURIComponent(d)}`)
    if (sc && sc !== 'all') queryParts.push(`scale=${encodeURIComponent(sc)}`)
    if (so && so !== 'featured') queryParts.push(`sort=${encodeURIComponent(so)}`)

    return `/machines?${queryParts.join('&')}`
  }

  // ── CATALOGUE MODE ───────────────────────────────────────────────────────
  if (isCatalogueMode) {
    return (
      <div className={s.cataloguePage}>
        <div className={s.catalogueHeader}>
          <div className={s.catalogueHeaderInner}>
            <Link href="/machines" className={s.backToShowroom}>
              ← Showroom
            </Link>
            <div>
              <p className={s.catalogueEyebrow}>Technical Catalogue</p>
              <h1 className={s.catalogueHeadline}>All Machines</h1>
            </div>
          </div>
        </div>

        <div className={s.catalogueBody}>
          <div className={s.container}>
            {/* ── Controls Bar ── */}
            <div className={s.controlsBar}>
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

              <div className={s.secondaryFilters}>
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
                  <Link href="/machines?view=catalogue" className={s.tabLink}>
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
                          <div className={s.cardImageSlot}>
                            <div className={s.imagePlaceholder}>
                              {m.brand.name} · {m.shortName ?? m.name}
                            </div>
                          </div>

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

                          <h2 className={s.machineName}>
                            <Link href={`/machines/${m.slug}`} style={{ color: 'inherit' }}>
                              {m.name}
                            </Link>
                          </h2>

                          <p className={s.editorial}>{m.editorialSummary}</p>

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
                                  <StockStatus
                                    status={m.offer.availability}
                                    leadTimeDays={m.offer.leadTimeDays}
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
      </div>
    )
  }

  // ── SHOWROOM MODE ────────────────────────────────────────────────────────
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
          <p className={s.showroomHeroEyebrow}>The Machines</p>
          <h1 className={s.showroomHeroHeadline}>
            Precision engineering,<br />at every scale.
          </h1>
          <p className={s.showroomHeroSubline}>
            Every machine in the Avorria catalogue is selected for documented engineering
            merit — verified platforms, structured compatibility, and market-aware delivery.
          </p>
          <div className={s.showroomHeroActions}>
            <Link href="/machines?view=catalogue" className={s.heroPrimary}>
              Browse All Machines
            </Link>
            <a href="#disciplines" className={s.heroSecondary}>
              Explore Showroom ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Editorial Philosophy ── */}
      <section className={s.editorialSpread}>
        <div className={s.editorialSpreadInner}>
          <div className={s.editorialText}>
            <p className={s.sectionEyebrow}>Our Approach</p>
            <h2 className={s.sectionHeadline}>Engineered machines,<br />not catalogue filler.</h2>
            <p className={s.sectionBody}>
              The Avorria machine list is curated, not aggregated. Every platform earns its
              place through verified engineering credentials — documented construction
              specifications, confirmed competition lineage, or a demonstrated record of
              real-world performance.
            </p>
            <p className={s.sectionBody}>
              We stock across five disciplines: bash, race, drift, crawl, and large scale —
              from entry-level RTR machines to hand-built bespoke competition chassis.
            </p>
          </div>
          <div className={s.editorialStats}>
            <div className={s.statItem}>
              <span className={s.statNumber}>5</span>
              <span className={s.statLabel}>Disciplines</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>1:5</span>
              <span className={s.statLabel}>Largest scale</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>3</span>
              <span className={s.statLabel}>Halo platforms</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>14+</span>
              <span className={s.statLabel}>Specialist brands</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Featured Spotlight ── */}
      <section className={s.featuredSection} id="disciplines">
        <div className={s.featuredInner}>
          <p className={s.sectionEyebrow}>Featured Platform</p>
          <div className={s.spotlightComposition}>
            {/* Large spotlight card */}
            <Link href="/machines/xray-x4-2026-1-10-touring-car-kit" className={s.spotlightLarge}>
              <div className={s.spotlightLargeImageSlot}>
                <div className={s.spotlightImagePlaceholder}>XRAY · X4 ʼ26</div>
              </div>
              <div className={s.spotlightLargeContent}>
                <div className={s.spotlightMeta}>
                  <span className={s.spotlightBrand}>XRAY</span>
                  <span className={s.spotlightHaloBadge}>★ Halo / 1:10 Competition</span>
                </div>
                <h3 className={s.spotlightName}>XRAY X4 ʼ26</h3>
                <p className={s.spotlightEditorial}>
                  XRAY's premier touring platform — decades of world championship development
                  distilled into precision CNC-machined 7075-T6 Swiss aluminium, ultra-low CG
                  bulkhead design, and redesigned active suspension geometry.
                </p>
                <div className={s.spotlightSpecs}>
                  <span className={s.specChip}>1:10 Scale</span>
                  <span className={s.specChip}>Electric</span>
                  <span className={s.specChip}>Race</span>
                  <span className={s.specChip}>Kit</span>
                </div>
                <span className={s.spotlightCta}>View Specs →</span>
              </div>
            </Link>

            {/* Supporting pair */}
            <div className={s.spotlightStack}>
              <Link href="/machines/traxxas-x-maxx-8s-brushless-monster-truck" className={s.spotlightSmall}>
                <div className={s.spotlightSmallImageSlot}>
                  <div className={s.spotlightSmallPlaceholder}>Traxxas · X-Maxx 8S</div>
                </div>
                <div className={s.spotlightSmallContent}>
                  <div className={s.spotlightMeta}>
                    <span className={s.spotlightBrand}>Traxxas</span>
                    <span className={s.spotlightScale}>1:6 Large Scale</span>
                  </div>
                  <h3 className={s.spotlightSmallName}>X-Maxx 8S</h3>
                  <p className={s.spotlightSmallEditorial}>
                    Definitive large-scale basher. Velineon 1200XL motor, steel drivetrain, self-righting.
                  </p>
                </div>
              </Link>
              <Link href="/machines/yokomo-master-drift-md-2-0-competition-kit" className={s.spotlightSmall}>
                <div className={s.spotlightSmallImageSlot}>
                  <div className={s.spotlightSmallPlaceholder}>Yokomo · MD 2.0</div>
                </div>
                <div className={s.spotlightSmallContent}>
                  <div className={s.spotlightMeta}>
                    <span className={s.spotlightBrand}>Yokomo</span>
                    <span className={`${s.spotlightScale} ${s.spotlightScaleHalo}`}>★ Halo</span>
                  </div>
                  <h3 className={s.spotlightSmallName}>Master Drift MD 2.0</h3>
                  <p className={s.spotlightSmallEditorial}>
                    Flagship RWD drift kit. 4-gear rear transmission, double-deck graphite chassis.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Discipline Chapters ── */}
      <section className={s.disciplineChapters}>
        <div className={s.disciplineChaptersInner}>

          {/* Bash */}
          <div className={s.disciplineChapter}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>Bash</p>
              <h2 className={s.chapterHeadline}>Built to absorb everything.</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Bash machines operate at the intersection of engineering resilience and raw
                performance. Heavy-duty steel drivetrain components, reinforced chassis, and
                significant power margins define the category — from the Traxxas X-Maxx at
                large scale down to 1:8 bruisers built for extreme punishment.
              </p>
              <div className={s.chapterCards}>
                <Link href="/machines/traxxas-x-maxx-8s-brushless-monster-truck" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Traxxas · X-Maxx 8S</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.chapterCardBrand}>Traxxas</span>
                    <h3 className={s.chapterCardName}>X-Maxx 8S</h3>
                    <span className={s.chapterCardSpec}>1:6 · Electric · RTR</span>
                  </div>
                </Link>
                <Link href="/machines/arrma-kraton-6s-blx-extreme-bash-speed-monster" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>ARRMA · Kraton 6S</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.chapterCardBrand}>ARRMA</span>
                    <h3 className={s.chapterCardName}>Kraton 6S EXB</h3>
                    <span className={s.chapterCardSpec}>1:8 · Electric · EXB</span>
                  </div>
                </Link>
              </div>
              <Link href="/machines?view=catalogue&discipline=bash" className={s.chapterCta}>
                Explore All Bash Machines →
              </Link>
            </div>
          </div>

          {/* Drift */}
          <div className={`${s.disciplineChapter} ${s.disciplineChapterReverse}`}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>Precision Drift</p>
              <h2 className={s.chapterHeadline}>Control at the limit.</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Competition drift chassis are engineered around countersteer dynamics and
                predictable angle control. Rear-wheel-drive configurations, variable motor
                positioning, and graphite construction deliver the precision required for
                consistent high-angle technique — from club-level to international competition.
              </p>
              <div className={s.chapterSplitGrid}>
                <Link href="/machines/yokomo-master-drift-md-2-0-competition-kit" className={s.splitCard}>
                  <div className={s.splitCardImage}>
                    <div className={s.splitCardPlaceholder}>Yokomo · MD 2.0</div>
                  </div>
                  <div className={s.splitCardBody}>
                    <span className={`${s.splitCardTier} ${s.splitCardTierHalo}`}>★ Halo</span>
                    <h3 className={s.splitCardName}>Yokomo MD 2.0</h3>
                    <p className={s.splitCardDetail}>4-gear rear transmission · double-deck graphite · variable motor position</p>
                  </div>
                </Link>
                <Link href="/machines/reve-d-rdx-1-10-rwd-drift-chassis-kit" className={s.splitCard}>
                  <div className={s.splitCardImage}>
                    <div className={s.splitCardPlaceholder}>Rêve D · RDX</div>
                  </div>
                  <div className={s.splitCardBody}>
                    <span className={s.splitCardTier}>Premium</span>
                    <h3 className={s.splitCardName}>Rêve D RDX</h3>
                    <p className={s.splitCardDetail}>Factory champion design · instant high-angle stability · zero setup compromise</p>
                  </div>
                </Link>
              </div>
              <Link href="/machines?view=catalogue&discipline=drift" className={s.chapterCta}>
                Explore All Drift Machines →
              </Link>
            </div>
          </div>

          {/* Crawl */}
          <div className={s.disciplineChapter}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>Scale Trail & Crawl</p>
              <h2 className={s.chapterHeadline}>Engineering for terrain.</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Trail and crawl machines demand engineering that works against gravity.
                Portal axles for maximum ground clearance, remote-locking differentials
                for severe off-camber recovery, and low-speed torque management define
                what separates a genuine trail rig from a scaled-down drive.
              </p>
              <div className={s.chapterCards}>
                <Link href="/machines/traxxas-trx-4-1979-ford-bronco-crawler" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Traxxas · TRX-4</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.chapterCardBrand}>Traxxas</span>
                    <h3 className={s.chapterCardName}>TRX-4 Bronco</h3>
                    <span className={s.chapterCardSpec}>1:10 · Portal axles · T-Lock diffs</span>
                  </div>
                </Link>
                <Link href="/machines/axial-scx10-iii-jeep-jlu-wrangler-4wd-rtr" className={s.chapterCard}>
                  <div className={s.chapterCardImage}>
                    <div className={s.chapterCardPlaceholder}>Axial · SCX10 III</div>
                  </div>
                  <div className={s.chapterCardBody}>
                    <span className={s.chapterCardBrand}>Axial</span>
                    <h3 className={s.chapterCardName}>SCX10 III Jeep</h3>
                    <span className={s.chapterCardSpec}>1:10 · Portal axles · DIG transmission</span>
                  </div>
                </Link>
              </div>
              <Link href="/machines?view=catalogue&discipline=crawl" className={s.chapterCta}>
                Explore All Crawl Machines →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. Dark Halo Chapter ── */}
      <section className={s.darkHaloChapter}>
        <div className={s.darkHaloInner}>
          <div className={s.darkHaloHeader}>
            <p className={s.darkHaloEyebrow}>Halo / Engineering</p>
            <h2 className={s.darkHaloHeadline}>Machines built without compromise.</h2>
            <p className={s.darkHaloSubline}>
              The Halo tier represents the ceiling of what the format allows — platforms
              where the specification exists not to satisfy a price point but to meet the
              demands of international competition or the standards of a discerning private owner.
            </p>
          </div>
          <div className={s.haloCardsGrid}>

            <Link href="/machines/fg-sportsline-4wd-porsche-911-gt3-1-5-rtr" className={s.haloCard}>
              <div className={s.haloCardImage}>
                <div className={s.haloCardPlaceholder}>FG · Porsche 911 GT3</div>
              </div>
              <div className={s.haloCardContent}>
                <p className={s.haloCardEyebrow}>1:5 Motorsport · Petrol</p>
                <h3 className={s.haloCardName}>FG Sportsline<br />Porsche 911 GT3</h3>
                <p className={s.haloCardDetail}>
                  26cc 2-stroke petrol, dual disc brakes, tuned exhaust, licensed Porsche aerobody.
                </p>
                <div className={s.haloSpecRow}>
                  <span className={s.haloSpecPill}>1:5 Scale</span>
                  <span className={s.haloSpecPill}>Petrol</span>
                  <span className={s.haloSpecPill}>RTR</span>
                </div>
              </div>
            </Link>

            <Link href="/machines/mecatech-fw01-1-5-competition-supercar-chassis" className={`${s.haloCard} ${s.haloCardSpecial}`}>
              <div className={s.haloCardImage}>
                <div className={s.haloCardPlaceholder}>Mecatech · FW01</div>
              </div>
              <div className={s.haloCardContent}>
                <p className={s.haloCardEyebrow}>1:5 Bespoke Motorsport · Special Order</p>
                <h3 className={s.haloCardName}>Mecatech FW01<br />Rolling Chassis</h3>
                <p className={s.haloCardDetail}>
                  Aero-grade billet aluminium, quad hydraulic disc brakes with braided aircraft hoses.
                  Hand-built in France to customer specification.
                </p>
                <div className={s.haloSpecRow}>
                  <span className={s.haloSpecPill}>1:5 Scale</span>
                  <span className={s.haloSpecPill}>Chassis</span>
                  <span className={s.haloSpecPill}>Special Order</span>
                </div>
              </div>
            </Link>

            <Link href="/machines/xray-x4-2026-1-10-touring-car-kit" className={s.haloCard}>
              <div className={s.haloCardImage}>
                <div className={s.haloCardPlaceholder}>XRAY · X4 ʼ26</div>
              </div>
              <div className={s.haloCardContent}>
                <p className={s.haloCardEyebrow}>1:10 Competition · Electric</p>
                <h3 className={s.haloCardName}>XRAY X4 ʼ26<br />Touring Car Kit</h3>
                <p className={s.haloCardDetail}>
                  CNC 7075-T6 Swiss aluminium, ultra-low CG bulkhead, redesigned active geometry.
                  World championship development lineage.
                </p>
                <div className={s.haloSpecRow}>
                  <span className={s.haloSpecPill}>1:10 Scale</span>
                  <span className={s.haloSpecPill}>Electric</span>
                  <span className={s.haloSpecPill}>Kit</span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── 6. Scale Progression Band ── */}
      <section className={s.scaleBand}>
        <div className={s.scaleBandInner}>
          <p className={s.sectionEyebrow}>The Avorria Scale Range</p>
          <h2 className={s.scaleBandHeadline}>From 1:12 to 1:5.</h2>
          <p className={s.scaleBandSubline}>
            Each scale band represents a distinct engineering and performance discipline.
          </p>
          <div className={s.scaleItems}>
            <Link href="/machines?view=catalogue&scale=1:10" className={s.scaleItem}>
              <span className={s.scaleRatio}>1:10</span>
              <span className={s.scaleTitle}>Competition Standard</span>
              <span className={s.scaleDesc}>The global racing benchmark. Touring, drift, and pan car platforms at peak development maturity.</span>
              <span className={s.scaleCta}>Browse 1:10 →</span>
            </Link>
            <Link href="/machines?view=catalogue&scale=1:8" className={s.scaleItem}>
              <span className={s.scaleRatio}>1:8</span>
              <span className={s.scaleTitle}>High Power Off-Road</span>
              <span className={s.scaleDesc}>Nitro and electric platforms engineered for sustained high-speed performance across demanding terrain.</span>
              <span className={s.scaleCta}>Browse 1:8 →</span>
            </Link>
            <Link href="/machines?view=catalogue&scale=1:5" className={s.scaleItem}>
              <span className={s.scaleRatio}>1:5</span>
              <span className={s.scaleTitle}>Full-Scale Engineering</span>
              <span className={s.scaleDesc}>Petrol-powered platforms where the engineering complexity approaches real motorsport. Disc brakes, tuned exhausts, proper gearboxes.</span>
              <span className={s.scaleCta}>Browse 1:5 →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Race Department Gateway ── */}
      <section className={s.raceGateway}>
        <div className={s.raceGatewayInner}>
          <div className={s.raceGatewayContent}>
            <p className={s.sectionEyebrow}>Race Department</p>
            <h2 className={s.raceGatewayHeadline}>Competition machines<br />are built, not bought.</h2>
            <p className={s.raceGatewayBody}>
              The Avorria Race Department exists for those who compete. Kit chassis paired with
              verified electronics, precision parts, and platform-specific build guidance.
              If you race, this is where your build starts.
            </p>
            <Link href="/race" className={s.raceGatewayCta}>
              Enter Race Department →
            </Link>
          </div>
          <div className={s.raceGatewayMeta}>
            <div className={s.raceMeta}>
              <span className={s.raceMetaLabel}>Current Platform</span>
              <span className={s.raceMetaValue}>XRAY X4 ʼ26</span>
            </div>
            <div className={s.raceMeta}>
              <span className={s.raceMetaLabel}>Electronics</span>
              <span className={s.raceMetaValue}>Hobbywing · Sanwa · Savox</span>
            </div>
            <div className={s.raceMeta}>
              <span className={s.raceMetaLabel}>Category</span>
              <span className={s.raceMetaValue}>1:10 Touring / 13.5T Spec</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Catalogue Transition ── */}
      <section className={s.catalogueGateway}>
        <div className={s.catalogueGatewayInner}>
          <p className={s.sectionEyebrow}>Complete Catalogue</p>
          <h2 className={s.catalogueGatewayHeadline}>Looking for something specific?</h2>
          <p className={s.catalogueGatewayBody}>
            Browse the complete Avorria machine inventory with discipline and scale filters,
            live market availability, and deterministic platform compatibility.
          </p>
          <div className={s.catalogueGatewayActions}>
            <Link href="/machines?view=catalogue" className={s.heroPrimary}>
              Browse All Machines →
            </Link>
            <Link href="/machines?view=catalogue&discipline=race" className={s.heroSecondary}>
              Race Platforms
            </Link>
            <Link href="/machines?view=catalogue&discipline=bash" className={s.heroSecondary}>
              Bash Platforms
            </Link>
            <Link href="/machines?view=catalogue&discipline=drift" className={s.heroSecondary}>
              Drift Platforms
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
