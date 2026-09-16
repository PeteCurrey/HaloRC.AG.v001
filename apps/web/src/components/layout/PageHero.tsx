// apps/web/src/components/layout/PageHero.tsx
// Reusable full-screen page hero with parallax background image.
// Used across /machines, /parts, /race, /brands, /find, /build, /garage, /search, /contact.

import Image from 'next/image'
import s from './PageHero.module.css'

export interface PageHeroProps {
  /** IFMAR-style eyebrow label, e.g. "The Machines" */
  eyebrow: string
  /** Main H1 headline — supports \n for line breaks */
  headline: string
  /** Optional supporting subline */
  subline?: string
  /** Absolute path to the background image (served from /public) */
  imageSrc: string
  /** Alt text for the background image (kept empty for decorative images) */
  imageAlt?: string
  /** CSS object-position, default "center" */
  imagePosition?: string
  /** Optional badge text rendered next to the eyebrow */
  badge?: string
  /** Optional CTA actions or children rendered in hero */
  children?: React.ReactNode
}

export function PageHero({
  eyebrow,
  headline,
  subline,
  imageSrc,
  imageAlt = '',
  imagePosition = 'center',
  badge,
  children,
}: PageHeroProps) {
  return (
    <section className={s.hero} aria-label={`${eyebrow} — Hero`}>
      {/* Background image */}
      <div className={s.heroBg} aria-hidden="true">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          quality={90}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: imagePosition }}
        />
      </div>

      {/* Scrims */}
      <div className={s.heroScrim} aria-hidden="true" />
      <div className={s.heroScrimTop} aria-hidden="true" />

      {/* Content */}
      <div className={s.heroContent}>
        <div className={s.heroEyebrow}>
          <span className={s.heroEyebrowLine} aria-hidden="true" />
          <span>{eyebrow}</span>
          {badge && <span className={s.heroBadge}>{badge}</span>}
        </div>

        <h1 className={s.heroHeadline}>
          {headline.split('\n').map((line, i, arr) => (
            i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>
          ))}
        </h1>

        {subline && (
          <p className={s.heroSubline}>{subline}</p>
        )}

        {children && (
          <div className={s.heroActions}>
            {children}
          </div>
        )}
      </div>

      {/* Subtle Scroll Indicator */}
      <div className={s.scrollIndicator} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  )
}
