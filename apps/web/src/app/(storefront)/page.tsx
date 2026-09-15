import Link from 'next/link'
import Image from 'next/image'
import s from './page.module.css'
import { HeroHaloMotif } from '@/components/brand/HeroHaloMotif'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

import {
  FEATURED_MACHINE,
  HALO_MACHINE,
  RACE_DISCIPLINES,
  BRANDS_MARQUEE,
} from '@/lib/navigation-data'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className={s.hero} aria-label="Halo RC — Hero">
        <div className={s.heroBg} aria-hidden="true">
          <Image
            src="/images/hero/hero-1-5-scale-rc.jpg"
            alt="Premium 1/5th scale competition racing RC car on circuit"
            fill
            priority
            quality={90}
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>

        <div className={s.heroScrim} aria-hidden="true" />
        <div className={s.heroScrimTop} aria-hidden="true" />

        <HeroHaloMotif />

        <div className={s.heroContent}>
          <div className={s.heroEyebrow}>
            <span className={s.heroEyebrowLine} aria-hidden="true" />
            <span>Remote Control. Without Compromise.</span>
          </div>

          <h1 className={s.heroHeadline}>
            The premium RC destination.
          </h1>

          <p className={s.heroSubline}>
            Competition hardware. Specialist manufacturers. The knowledge to match.
            From your first Traxxas to a £5,000 XRAY race build.
          </p>

          <div className={s.heroActions}>
            <Link href="/machines" className={s.btnPrimary}>
              Explore The Machines
            </Link>
            <Link href="/race" className={s.btnGhost}>
              Race Department
            </Link>
          </div>
        </div>

        <div className={s.scrollIndicator} aria-hidden="true">
          <div className={s.scrollIndicatorLine} />
        </div>
      </section>

      {/* ── The Machines — Featured product ── */}
      <section className={s.sectionMachines} aria-labelledby="machines-heading">
        <div className={s.sectionInner}>

          <div className={s.sectionLabel} aria-hidden="true">
            <span>The Machines</span>
            <div className={s.sectionLabelLine} />
          </div>

          <ScrollReveal>
            <h2 id="machines-heading" className={s.sectionHeading}>
              Precision engineering, at every scale.
            </h2>
            <p className={s.sectionSubtext}>
              From competition chassis to bash trucks. Every machine we carry
              is chosen for a reason.
            </p>
          </ScrollReveal>

          {/* Featured product — editorial, not a card */}
          <ScrollReveal staggerMs={80}>
            <article className={s.featuredProduct}>
              <div className={s.featuredImageWrap}>
                {/*
                  Phase 1: Placeholder.
                  Real image once approved_for_commercial_use is confirmed.
                */}
                <div className={s.imagePlaceholder}>
                  Traxxas X-Maxx 8S
                </div>
              </div>

              <div className={s.featuredInfo}>
                <p className={s.featuredBrand}>{FEATURED_MACHINE.brand}</p>
                <h3 className={s.featuredName}>{FEATURED_MACHINE.fullName}</h3>

                <div className={s.featuredMeta}>
                  <span className={s.chip}>{FEATURED_MACHINE.scale}</span>
                  <span className={s.chip}>{FEATURED_MACHINE.power}</span>
                </div>

                <p className={s.featuredEditorial}>{FEATURED_MACHINE.editorial}</p>

                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  <Link
                    href={`/machines/${FEATURED_MACHINE.slug}`}
                    className={s.btnPrimary}
                  >
                    View Machine
                  </Link>
                  <Link href="/machines" className={s.btnGhost}>
                    All Machines
                  </Link>
                </div>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Race Department ── */}
      <section className={s.sectionRace} aria-labelledby="race-heading">
        <div className={s.sectionInner}>

          <div className={s.sectionLabel} aria-hidden="true">
            <span>Race Department</span>
            <div className={s.sectionLabelLine} />
          </div>

          <ScrollReveal>
            <div className={s.raceGrid}>
              <div className={s.raceProposition}>
                <h2 id="race-heading" className={s.raceCta}>
                  Don't just buy<br />
                  the chassis.<br />
                  <span className={s.raceCtaAccent}>Build the race car.</span>
                </h2>
                <p className={s.sectionSubtext}>
                  Complete competition builds. Expert component selection.
                  The hardware that wins at national and international level.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <Link href="/race" className={s.btnPrimary}>
                    Enter Race Department
                  </Link>
                </div>
              </div>

              <nav aria-label="Race disciplines" className={s.raceDisciplines}>
                {RACE_DISCIPLINES.map((disc) => (
                  <Link key={disc.href} href={disc.href} className={s.raceDiscipline}>
                    <span className={s.raceDisciplineLabel}>{disc.label}</span>
                    <span className={s.raceDisciplineSubtext}>{disc.sub}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Halo Machine ── */}
      <section className={s.sectionHalo} aria-labelledby="halo-heading">
        <div className={s.sectionInner}>
          <div className={s.sectionLabel} aria-hidden="true">
            <span>Halo Machine</span>
            <div className={s.sectionLabelLine} />
          </div>
        </div>

        <ScrollReveal>
          <article className={s.haloFeature}>
            <div className={s.haloImagePanel}>
              {/*
                Phase 1: Placeholder.
                XRAY press imagery once approved_for_commercial_use confirmed.
              */}
              <div className={s.imagePlaceholder}>
                XRAY X4 '26
              </div>
            </div>

            <div className={s.haloInfoPanel}>
              <div className={s.haloClassification}>
                <div className={s.haloMark} aria-hidden="true" />
                <span className={s.haloClassificationText}>
                  Halo / {HALO_MACHINE.haloClassification}
                </span>
              </div>

              <div>
                <p style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                  {HALO_MACHINE.brand}
                </p>
                <h2 id="halo-heading" className={s.haloName}>
                  {HALO_MACHINE.fullName}
                </h2>
              </div>

              <p className={s.haloEditorial}>{HALO_MACHINE.editorial}</p>

              <div className={s.haloSpecRow}>
                {HALO_MACHINE.specs.map((spec) => (
                  <div key={spec.key} className={s.haloSpecItem}>
                    <span className={s.haloSpecKey}>{spec.key}</span>
                    <span className={s.haloSpecValue}>{spec.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link href={`/machines/${HALO_MACHINE.slug}`} className={s.btnHalo}>
                  View Full Specification
                </Link>
                <Link href="/build" className={s.btnGhost}>
                  Build My Rig
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </section>

      {/* ── Brand marquee ── */}
      <section
        className={s.sectionBrands}
        aria-label="Brands we carry"
      >
        <div
          className={s.brandMarquee}
          aria-hidden="true" /* Decorative — brands linked in /brands */
        >
          {BRANDS_MARQUEE.map((brand, i) => (
            <span key={`${brand}-${i}`} className={s.brandMarqueeItem}>
              {brand}
            </span>
          ))}
        </div>
        <p className="sr-only">
          We carry brands including {BRANDS_MARQUEE.slice(0, BRANDS_MARQUEE.length / 2).join(', ')}.{' '}
          <Link href="/brands">View all brands</Link>.
        </p>
      </section>

      {/* ── Find My Machine ── */}
      <section className={s.sectionFind} aria-labelledby="find-heading">
        <div className={s.sectionInner}>

          <div className={s.sectionLabel} aria-hidden="true">
            <span>Find Your Machine</span>
            <div className={s.sectionLabelLine} />
          </div>

          <ScrollReveal>
            <div className={s.findGrid}>
              <div>
                <h2 id="find-heading" className={s.findHeading}>
                  Not sure where to start?
                </h2>
                <p className={s.findSubtext}>
                  Tell us your experience level, terrain, budget, and goals.
                  We'll recommend the right machine — with a genuine explanation.
                  Not a chatbot. A consultation.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Link href="/find" className={s.btnPrimary} style={{ alignSelf: 'flex-start' }}>
                  Start the consultation
                </Link>
                <Link href="/guides" className={s.btnGhost} style={{ alignSelf: 'flex-start' }}>
                  Browse buying guides
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
