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
              We build across five disciplines: bash, race, drift, crawl, and large scale —
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
              <span className={s.statNumber}>1:12</span>
              <span className={s.statLabel}>Smallest scale</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statNumber}>Kit</span>
              <span className={s.statLabel}>to RTR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Discipline Chapters ── */}
      <section className={s.disciplineChapters} id="disciplines">
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
                significant power margins define the category — from large scale down to
                1:8 bruisers built for extreme punishment.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for bash platforms.
                </p>
              </div>
              <Link href="/machines?view=catalogue&discipline=bash" className={s.chapterCta}>
                Explore All Bash Machines →
              </Link>
            </div>
          </div>

          {/* Race */}
          <div className={`${s.disciplineChapter} ${s.disciplineChapterReverse}`}>
            <div className={s.chapterLabel}>
              <p className={s.sectionEyebrow}>Competition Race</p>
              <h2 className={s.chapterHeadline}>Championship at every scale.</h2>
            </div>
            <div className={s.chapterContent}>
              <p className={s.chapterBody}>
                Competition machines demand chassis precision, electronics integrity, and
                geometry verified against championship regulations. From 1:10 touring car
                to 1:5 large-scale, race platforms are selected for documented competition
                lineage and proven results at national and international level.
              </p>
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for competition platforms.
                </p>
              </div>
              <Link href="/machines?view=catalogue&discipline=race" className={s.chapterCta}>
                Explore All Race Platforms →
              </Link>
            </div>
          </div>

          {/* Drift */}
          <div className={s.disciplineChapter}>
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
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for drift platforms.
                </p>
              </div>
              <Link href="/machines?view=catalogue&discipline=drift" className={s.chapterCta}>
                Explore All Drift Machines →
              </Link>
            </div>
          </div>

          {/* Crawl */}
          <div className={`${s.disciplineChapter} ${s.disciplineChapterReverse}`}>
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
              <div className={s.emptyGrid}>
                <p className={s.emptyGridText}>
                  Catalogue developing — we are establishing our specialist supplier network for crawl platforms.
                </p>
              </div>
              <Link href="/machines?view=catalogue&discipline=crawl" className={s.chapterCta}>
                Explore All Crawl Machines →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Dark Halo Chapter ── */}
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
          <div className={s.emptyGrid} style={{ maxWidth: '640px', margin: '0 auto' }}>
            <p className={s.emptyGridText}>
              Halo platform catalogue developing. We are currently establishing the supply relationships required to offer these platforms at the standard Avorria demands.
            </p>
            <Link href="/race" className={s.tabLink}>
              Enter Race Department →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Scale Progression Band ── */}
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

      {/* ── 6. Race Department Gateway ── */}
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
              <span className={s.raceMetaLabel}>Disciplines</span>
              <span className={s.raceMetaValue}>1:10 Touring · 1:8 Buggy · 1:5</span>
            </div>
            <div className={s.raceMeta}>
              <span className={s.raceMetaLabel}>Category</span>
              <span className={s.raceMetaValue}>Kit · Competition · Halo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Catalogue Transition ── */}
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
