import Link from 'next/link'
import Image from 'next/image'
import s from './page.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import {
  HeroImage,
  EditorialSplit,
  FullBleedImage,
  ChapterIntro,
  ProductFeature,
  BrandFeature,
  Quote,
  ImageStrip,
} from '@/components/sections'
import { getMachinesList } from '@halo-rc/db'
import { getMarketPreference } from '@/actions/market'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'
import {
  BRANDS_MARQUEE,
  SHOP_DISCIPLINES,
  FEATURED_ENGINEERING_BRANDS,
} from '@/lib/navigation-data'

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

function resolveMachineImage(slug: string, brandSlug: string, discipline: string): string {
  return (
    MACHINE_IMAGES[slug] ||
    `/images/brands/${brandSlug}.jpg` ||
    `/images/disciplines/${discipline.toLowerCase()}.jpg` ||
    '/images/hero/hero-1-5-scale-rc.jpg'
  )
}

export default async function HomePage() {
  const activeMarket = await getMarketPreference()

  // Fetch real authoritative machines from DB
  let featuredMachines: any[] = []
  try {
    featuredMachines = await getMachinesList({
      marketCode: activeMarket,
      limit: 6,
    })
  } catch (err) {
    console.error('Failed to load featured machines for homepage:', err)
  }

  // Prioritise a Halo or Race tier machine as hero product feature
  const topHeroProduct =
    featuredMachines.find((m) => m.tier === 'HALO') ||
    featuredMachines.find((m) => m.discipline === 'RACE') ||
    featuredMachines[0]

  const galleryItems = [
    {
      id: 'race-pit',
      imageSrc: '/images/disciplines/race.jpg',
      caption: 'International Competition / Touring Chassis',
      href: '/race',
    },
    {
      id: 'large-scale',
      imageSrc: '/images/disciplines/large-scale.jpg',
      caption: '1:5 Scale Petrol Supercar / Hydraulic Disc Brakes',
      href: '/machines?discipline=large_scale',
    },
    {
      id: 'precision-drift',
      imageSrc: '/images/disciplines/drift.jpg',
      caption: 'RWD Countersteer Dynamics / Carbon Graphite',
      href: '/machines?discipline=drift',
    },
    {
      id: 'trail-crawl',
      imageSrc: '/images/disciplines/crawl.jpg',
      caption: 'Terrain Engineering / Portal Axles',
      href: '/machines?discipline=crawl',
    },
    {
      id: 'heavyweight-bash',
      imageSrc: '/images/disciplines/bash.jpg',
      caption: '8S Brushless Heavyweight Durability',
      href: '/machines?discipline=bash',
    },
  ]

  return (
    <div className={s.pageWrapper}>
      {/* 1. Cinematic Hero */}
      <HeroImage
        eyebrow="Remote Control. Without Compromise."
        heading="The Premium RC Destination"
        subline="Competition hardware. Specialist manufacturers. The knowledge to match."
        imageSrc="/images/hero/hero-1-5-chassis-cnc.jpg"
        imageAlt="Close-up of 1/5 scale competition CNC billet aluminium chassis, suspension geometry, and disc brakes"
        primaryCtaText="Explore The Machines"
        primaryCtaHref="/machines"
        secondaryCtaText="Race Department"
        secondaryCtaHref="/race"
      />

      {/* 2. Chapter 01: Machines Editorial Split */}
      <ChapterIntro
        number="01"
        title="THE MACHINES"
        intro="Five disciplines. Every scale. Curation driven purely by documented engineering merit."
        surface="light"
      />

      <EditorialSplit
        eyebrow="Precision Chassis Architecture"
        heading={"Competition lineage.\nZero compromise."}
        body="From 1:10 world championship electric touring cars to 1:5 scale petrol monsters featuring multi-piston hydraulic disc brakes and CNC billet bulkheads, Avorria filters out the disposable toys. We supply verified platforms engineered for genuine lap times and enduring mechanical resilience."
        imageSrc="/images/disciplines/large-scale.jpg"
        imageAlt="Large scale motorsport engineering chassis"
        imagePosition="left"
        ratio="50-50"
        surface="light"
        primaryCtaText="Explore Machine Showroom"
        primaryCtaHref="/machines"
        secondaryCtaText="Technical Catalogue"
        secondaryCtaHref="/machines?view=catalogue"
      />

      {/* 3. Product Feature (Real authoritative DB product) */}
      {topHeroProduct && (
        <ProductFeature
          isHalo={topHeroProduct.tier === 'HALO'}
          haloClassification={topHeroProduct.haloClassification || 'World Championship Lineage'}
          manufacturer={topHeroProduct.brand.name}
          name={topHeroProduct.name}
          editorial={
            topHeroProduct.editorialSummary ||
            'Engineered without cost-cutting constraints to satisfy the unrelenting requirements of high-level national and international competition.'
          }
          imageSrc={resolveMachineImage(
            topHeroProduct.slug,
            topHeroProduct.brand.slug,
            topHeroProduct.discipline
          )}
          imageAlt={topHeroProduct.name}
          specs={[
            { label: 'Scale', value: topHeroProduct.scale || '1:10' },
            { label: 'Discipline', value: topHeroProduct.discipline || 'RACE' },
            { label: 'Power Type', value: topHeroProduct.powerType || 'Electric' },
            { label: 'Tier', value: topHeroProduct.tier || 'COMPETITION' },
          ]}
          priceSlot={
            topHeroProduct.offer ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <MarketAwarePrice
                  amountMinorUnits={topHeroProduct.offer.retailPriceMinorUnits}
                  currency={topHeroProduct.offer.currency as Currency}
                  taxMode={topHeroProduct.offer.taxMode}
                  size="lg"
                />
                <StockStatus
                  status={topHeroProduct.offer.availability}
                  leadTimeDays={topHeroProduct.offer.leadTimeDays}
                />
              </div>
            ) : null
          }
          primaryCtaText="View Machine Specification"
          primaryCtaHref={`/machines/${topHeroProduct.slug}`}
          secondaryCtaText="Configure In Builder"
          secondaryCtaHref="/build"
          surface="dark"
        />
      )}

      {/* 4. Full Bleed Cinematic Transition */}
      <FullBleedImage
        imageSrc="/images/disciplines/race.jpg"
        imageAlt="Race Department high-speed circuit testing"
        height="large"
        eyebrow="Race Department"
        heading={"Championships are won in the pits.\nBuilt to the limit."}
        body="Verified setups, BRCA/IFMAR legal specifications, and direct factory backing. Discover race-proven platforms designed to perform on the edge."
        ctaText="Enter Race Department"
        ctaHref="/race"
        overlayPosition="bottom-left"
      />

      {/* 5. Chapter 02: Brands */}
      <ChapterIntro
        number="02"
        title="SPECIALIST MARQUES"
        intro="We cultivate direct relationships with authentic engineering houses — from European competition champions to Japanese drift masters."
        surface="dark"
      />

      <BrandFeature
        name="XRAY"
        country="Slovakia"
        specialism="World Championship Touring & Buggy"
        status="Authorised Dealer"
        description="Every component designed, machined, and assembled in-house at the high-tech XRAY facility in Trenčín, Slovakia. Unmatched European metallurgy, zero-slop tolerances, and world-record trophy credentials."
        imageSrc="/images/brands/xray.jpg"
        imageAlt="XRAY high-precision factory competition machine"
        href="/brands/xray"
      />

      {/* 6. Quote / Restrained Statement */}
      <Quote
        statement="Avorria RC exists for those who demand precision over mass production. The difference between a toy and a racing machine is measurable in hundredths of a second."
        attribution="Avorria Race Department Philosophy"
        align="center"
        surface="dark"
      />

      {/* 7. Image Strip: Visual rhythm showcase */}
      <ImageStrip
        heading="TRACKSIDE & WORKBENCH"
        subtext="The Avorria Field & Engineering Gallery"
        items={galleryItems}
        aspect="landscape"
        surface="dark"
      />

      {/* 8. Build / Configurator Editorial Split */}
      <EditorialSplit
        eyebrow="Deterministic Compatibility Engine"
        heading={"Build My Rig.\nNo guesswork, pure physics."}
        body="Avoid mismatched pinion pitches, undersized ESC thermal throttling, or battery bay dimension errors. The Avorria configurator checks mechanical clearances, KV ratings, and electrical loads in real-time."
        imageSrc="/images/build/pit-bench-workbench.jpg"
        imageAlt="Competition RC pit bench with tuning gauges and components"
        imagePosition="right"
        ratio="60-40"
        surface="light"
        primaryCtaText="Launch Configurator"
        primaryCtaHref="/build"
        secondaryCtaText="Compare Blueprints"
        secondaryCtaHref="/race/compare"
      />

      {/* 9. Discipline Grid: Clean Architectural Presentation */}
      <section className={s.sectionDisciplines} aria-labelledby="disciplines-heading">
        <div className={s.sectionInner}>
          <ScrollReveal variant="slide">
            <div className={s.disciplinesHeader}>
              <div>
                <span className={s.disciplinesTag}>Discipline Spectrum</span>
                <h2 id="disciplines-heading" className={s.disciplinesHeading}>
                  Explore by discipline.
                </h2>
                <p className={s.disciplinesSubtext}>
                  Every class has its engineering benchmark. Select your focus area.
                </p>
              </div>
              <Link href="/machines?view=catalogue" className={s.sectionHeaderLink}>
                All Platforms →
              </Link>
            </div>
          </ScrollReveal>

          <div className={s.disciplineGrid}>
            {SHOP_DISCIPLINES.map((item) => (
              <Link key={item.id} href={item.href} className={s.disciplineCard}>
                {item.image && (
                  <div
                    className={s.disciplineCardBg}
                    style={{ backgroundImage: `url(${item.image})` }}
                    aria-hidden="true"
                  />
                )}
                <div className={s.disciplineCardScrim} aria-hidden="true" />
                <div className={s.disciplineCardContent}>
                  {item.badge && (
                    <span className={s.disciplineCardBadge}>{item.badge}</span>
                  )}
                  <h3 className={s.disciplineCardTitle}>{item.label}</h3>
                  <p className={s.disciplineCardSub}>{item.sub}</p>
                  <span className={s.disciplineCardCta}>Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Brand Marquee */}
      <section className={s.sectionBrands} aria-label="Engineering marques">
        <div className={s.brandMarquee} aria-hidden="true">
          {BRANDS_MARQUEE.map((brand, i) => (
            <span key={`${brand}-${i}`} className={s.brandMarqueeItem}>
              {brand}
            </span>
          ))}
        </div>
        <p className="sr-only">
          Engineering marques in the Avorria catalogue include {BRANDS_MARQUEE.slice(0, 10).join(', ')}.{' '}
          <Link href="/brands">View brand universe</Link>.
        </p>
      </section>

      {/* 11. Final Consultation / Technical Advisor */}
      <section className={s.sectionFind} aria-labelledby="find-heading">
        <div className={s.sectionInner}>
          <ScrollReveal variant="slide">
            <div className={s.findGrid}>
              <div>
                <span className={s.findTag}>Consultation Engine</span>
                <h2 id="find-heading" className={s.findHeading}>
                  Not sure where to begin?
                </h2>
                <p className={s.findSubtext}>
                  Tell us your intended terrain, experience tier, and mechanical goals.
                  We calculate optimal chassis geometry and powertrain recommendations.
                  Engineering consultation, not a generic chatbot.
                </p>
              </div>

              <div className={s.findActions}>
                <Link href="/find" className={s.btnPrimary}>
                  Start Technical Consultation →
                </Link>
                <Link href="/machines?view=catalogue" className={s.btnGhost}>
                  Browse Complete Index
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
