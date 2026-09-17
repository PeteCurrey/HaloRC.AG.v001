import type { Metadata } from 'next'
import Image from 'next/image'
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

const BRAND_IMAGES: Record<string, string> = {
  awesomatix: '/images/brands/awesomatix.jpg',
  hobbywing: '/images/brands/hobbywing.jpg',
  sanwa: '/images/brands/sanwa.jpg',
  schumacher: '/images/brands/schumacher.jpg',
  traxxas: '/images/brands/traxxas.jpg',
  xray: '/images/brands/xray.jpg',
  'mugen-seiki': 'https://www.mugenshop.eu/media/image/product/10125/lg/a2006_mugen-seiki-mtc-3-touring-car-kit-alu.jpg',
}

const DISCIPLINE_IMAGES: Record<string, string> = {
  BASH: '/images/disciplines/bash.jpg',
  RACE: '/images/disciplines/race.jpg',
  DRIFT: '/images/disciplines/drift.jpg',
  CRAWL: '/images/disciplines/crawl.jpg',
  SCALE: '/images/disciplines/scale.jpg',
  LARGE_SCALE: '/images/disciplines/large-scale.jpg',
}

const MACHINE_IMAGES: Record<string, string> = {
  'xray-x4-2026-1-10-touring-car-kit': '/images/brands/xray.jpg',
  'awesomatix-a800mx-1-10-touring-car-kit': '/images/brands/awesomatix.jpg',
  'traxxas-x-maxx-8s-brushless-monster-truck': '/images/disciplines/bash.jpg',
  'arrma-kraton-6s-blx-extreme-bash-speed-monster': '/images/disciplines/bash.jpg',
  'yokomo-master-drift-md-2-0-chassis-kit': '/images/disciplines/drift.jpg',
  'reve-d-rdx-1-10-rwd-drift-chassis-kit': '/images/disciplines/drift.jpg',
  'traxxas-trx-4-1979-ford-bronco-crawler': '/images/disciplines/crawl.jpg',
  'axial-scx10-iii-jeep-jlu-wrangler-4wd-rtr': '/images/disciplines/crawl.jpg',
  'tamiya-cc-02-mercedes-benz-g-500-scale-kit': '/images/disciplines/scale.jpg',
  'fg-sportsline-4wd-porsche-911-gt3-1-5-rtr': '/images/disciplines/large-scale.jpg',
  'mecatech-fw01-1-5-competition-supercar-chassis': '/images/disciplines/large-scale.jpg',
  'team-associated-rc8b4-1-nitro-buggy-kit': '/images/disciplines/race.jpg',
  'mugen-mtc3-1-10-4wd-ep-touring-kit': 'https://www.mugenshop.eu/media/image/product/10125/lg/a2006_mugen-seiki-mtc-3-touring-car-kit-alu.jpg',
  'mugen-msb1-1-10-2wd-ep-buggy-kit': 'https://www.mugenshop.eu/media/image/product/9490/lg/b2001_mugen-seiki-msb1-1-10-2wd-elektro-buggy-bausatz.jpg',
  'mugen-mbx-8r-nitro-1-8-4wd-buggy-kit': 'https://www.mugenshop.eu/media/image/product/7732/lg/e2027_mugen-seiki-mbx-8r-1-8-nitro-buggy-kit.jpg',
  'mugen-mbx-8r-eco-1-8-4wd-buggy-kit': 'https://www.mugenshop.eu/media/image/product/7734/lg/e2028_mugen-seiki-mbx-8r-eco-1-8-electric-buggy-kit.jpg',
  'mugen-mbx-8tr-nitro-1-8-4wd-truggy-kit': 'https://www.mugenshop.eu/media/image/product/8499/lg/e2029_mugen-seiki-mbx8t-r-1-8-nitro-truggy-kit.jpg',
  'mugen-mbx-8tr-eco-1-8-4wd-truggy-kit': 'https://www.mugenshop.eu/media/image/product/8500/lg/e2030_mugen-seiki-mbx8t-r-eco-1-8-elektro-truggy-kit.jpg',
  'mugen-mrx7-1-8-touring-kit': 'https://www.mugenshop.eu/media/image/product/10126/lg/h2009_mugen-seiki-mrx7-1-8-on-road-chassis-kit.jpg',
  'mugen-mtx-7r-1-10-touring-kit': 'https://www.mugenshop.eu/media/image/product/9103/lg/t2006_mugen-seiki-mtx-7r-1-10-nitro-touring-car-kit.jpg',
}

function getMachineImage(slug: string, brandSlug: string, discipline: string): string {
  return (
    MACHINE_IMAGES[slug] ||
    BRAND_IMAGES[brandSlug] ||
    DISCIPLINE_IMAGES[discipline.toUpperCase()] ||
    '/images/hero/hero-1-5-scale-rc.jpg'
  )
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

  // Showroom mode: fetch machines across disciplines
  const allShowroomMachines = !isCatalogueMode
    ? await getMachinesList({ marketCode: activeMarket })
    : []

  const bashMachines = allShowroomMachines.filter((m) => m.discipline === 'BASH').slice(0, 2)
  const raceMachines = allShowroomMachines.filter((m) => m.discipline === 'RACE').slice(0, 2)
  const driftMachines = allShowroomMachines.filter((m) => m.discipline === 'DRIFT').slice(0, 2)
  const crawlMachines = allShowroomMachines.filter((m) => m.discipline === 'CRAWL').slice(0, 2)
  const haloMachines = allShowroomMachines.filter((m) => m.tier === 'HALO').slice(0, 3)

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
                    const imageSrc = getMachineImage(m.slug, m.brand.slug, m.discipline)
                    return (
                      <article
                        key={m.id}
                        className={`${s.card} ${isHalo ? s.cardHalo : ''}`}
                      >
                        <div>
                          <div className={s.cardImageSlot}>
                            <Image
                              src={imageSrc}
                              alt={`${m.brand.name} ${m.name}`}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              style={{ objectFit: 'cover' }}
                            />
                            <div className={s.cardImageOverlay} />
                            {isHalo && (
                              <span className={s.haloTag}>
                                ★ Halo / {m.haloClassification ?? 'Competition'}
                              </span>
                            )}
                          </div>

                          <div className={s.cardHeader}>
                            <span className={s.brandName}>{m.brand.name}</span>
                            <span className={s.tierBadge}>
                              {[m.scale, m.powerType].filter(Boolean).join(' · ') || m.discipline}
                            </span>
                          </div>

                          <h2 className={s.machineName}>
                            <Link href={`/machines/${m.slug}`} style={{ color: 'inherit' }}>
                              {m.shortName ?? m.name}
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
                            VIEW MACHINE →
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
        <div className={s.showroomHeroBg} aria-hidden="true">
          <Image
            src="/images/disciplines/large-scale.jpg"
            alt="Large Scale Precision RC Competition Machine"
            fill
            priority
            quality={90}
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
          />
        </div>
        <div className={s.showroomHeroScrim} aria-hidden="true" />
        <div className={s.showroomHeroScrimTop} aria-hidden="true" />
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
              {bashMachines.length > 0 ? (
                <div className={s.chapterCards}>
                  {bashMachines.map((m) => (
                    <Link key={m.id} href={`/machines/${m.slug}`} className={s.chapterCard}>
                      <div className={s.chapterCardImage} style={{ position: 'relative', overflow: 'hidden' }}>
                        <Image
                          src={getMachineImage(m.slug, m.brand.slug, m.discipline)}
                          alt={m.name}
                          fill
                          sizes="120px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.chapterCardBrand}>{m.brand.name}</span>
                        <span className={s.chapterCardName}>{m.shortName ?? m.name}</span>
                        <span className={s.chapterCardSpec}>
                          {[m.scale, m.powerType].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for bash platforms.
                  </p>
                </div>
              )}
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
              {raceMachines.length > 0 ? (
                <div className={s.chapterCards}>
                  {raceMachines.map((m) => (
                    <Link key={m.id} href={`/machines/${m.slug}`} className={s.chapterCard}>
                      <div className={s.chapterCardImage} style={{ position: 'relative', overflow: 'hidden' }}>
                        <Image
                          src={getMachineImage(m.slug, m.brand.slug, m.discipline)}
                          alt={m.name}
                          fill
                          sizes="120px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.chapterCardBrand}>{m.brand.name}</span>
                        <span className={s.chapterCardName}>{m.shortName ?? m.name}</span>
                        <span className={s.chapterCardSpec}>
                          {[m.scale, m.powerType].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for competition platforms.
                  </p>
                </div>
              )}
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
              {driftMachines.length > 0 ? (
                <div className={s.chapterCards}>
                  {driftMachines.map((m) => (
                    <Link key={m.id} href={`/machines/${m.slug}`} className={s.chapterCard}>
                      <div className={s.chapterCardImage} style={{ position: 'relative', overflow: 'hidden' }}>
                        <Image
                          src={getMachineImage(m.slug, m.brand.slug, m.discipline)}
                          alt={m.name}
                          fill
                          sizes="120px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.chapterCardBrand}>{m.brand.name}</span>
                        <span className={s.chapterCardName}>{m.shortName ?? m.name}</span>
                        <span className={s.chapterCardSpec}>
                          {[m.scale, m.powerType].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for drift platforms.
                  </p>
                </div>
              )}
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
              {crawlMachines.length > 0 ? (
                <div className={s.chapterCards}>
                  {crawlMachines.map((m) => (
                    <Link key={m.id} href={`/machines/${m.slug}`} className={s.chapterCard}>
                      <div className={s.chapterCardImage} style={{ position: 'relative', overflow: 'hidden' }}>
                        <Image
                          src={getMachineImage(m.slug, m.brand.slug, m.discipline)}
                          alt={m.name}
                          fill
                          sizes="120px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={s.chapterCardBody}>
                        <span className={s.chapterCardBrand}>{m.brand.name}</span>
                        <span className={s.chapterCardName}>{m.shortName ?? m.name}</span>
                        <span className={s.chapterCardSpec}>
                          {[m.scale, m.powerType].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={s.emptyGrid}>
                  <p className={s.emptyGridText}>
                    Catalogue developing — we are establishing our specialist supplier network for crawl platforms.
                  </p>
                </div>
              )}
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
          {haloMachines.length > 0 ? (
            <div className={s.haloCardsGrid}>
              {haloMachines.map((m) => (
                <Link key={m.id} href={`/machines/${m.slug}`} className={s.haloCard}>
                  <div className={s.haloCardImage} style={{ position: 'relative', overflow: 'hidden' }}>
                    <Image
                      src={getMachineImage(m.slug, m.brand.slug, m.discipline)}
                      alt={m.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className={s.haloCardContent}>
                    <span className={s.haloCardEyebrow}>
                      ★ Halo / {m.haloClassification ?? 'Competition'}
                    </span>
                    <h3 className={s.haloCardName}>{m.shortName ?? m.name}</h3>
                    <p className={s.haloCardDetail}>{m.editorialSummary}</p>
                    <div className={s.haloSpecRow}>
                      {m.scale && <span className={s.haloSpecPill}>{m.scale}</span>}
                      {m.powerType && <span className={s.haloSpecPill}>{m.powerType}</span>}
                      <span className={s.haloSpecPill} style={{ color: 'var(--colour-halo)', borderColor: 'rgba(184, 147, 90, 0.4)' }}>
                        VIEW MACHINE →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.emptyGrid} style={{ maxWidth: '640px', margin: '0 auto' }}>
              <p className={s.emptyGridText}>
                Halo platform catalogue developing. We are currently establishing the supply relationships required to offer these platforms at the standard Avorria demands.
              </p>
              <Link href="/race" className={s.tabLink}>
                Enter Race Department →
              </Link>
            </div>
          )}
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
