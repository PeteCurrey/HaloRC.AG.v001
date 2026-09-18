import Image from 'next/image'
import Link from 'next/link'
import s from './HeroImage.module.css'

export interface HeroImageProps {
  eyebrow?: string
  heading: string
  subline?: string
  imageSrc: string
  imageAlt?: string
  imagePosition?: string
  size?: 'full' | 'large' | 'medium'
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  children?: React.ReactNode
  showScrollIndicator?: boolean
}

export function HeroImage({
  eyebrow,
  heading,
  subline,
  imageSrc,
  imageAlt = 'Avorria RC engineering hardware presentation',
  imagePosition = 'center',
  size = 'full',
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  children,
  showScrollIndicator = true,
}: HeroImageProps) {
  return (
    <section className={s.hero} data-size={size} aria-label={eyebrow || heading}>
      <div className={s.bg} aria-hidden="true">
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

      <div className={s.scrim} aria-hidden="true" />
      <div className={s.scrimTop} aria-hidden="true" />

      {/* Faint watermark of Avorria emblem without lettering */}
      <div className={s.watermark} aria-hidden="true">
        <Image
          src="/images/logo/avorria-emblem-light.png"
          alt=""
          fill
          priority={false}
          sizes="(max-width: 768px) 70vw, 42vw"
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div className={s.content}>
        {eyebrow && (
          <div className={s.eyebrow}>
            <span className={s.eyebrowLine} aria-hidden="true" />
            <span className={s.eyebrowText}>{eyebrow}</span>
          </div>
        )}

        <h1 className={s.heading}>
          {heading.split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </h1>

        {subline && <p className={s.subline}>{subline}</p>}

        {(primaryCtaText || secondaryCtaText || children) && (
          <div className={s.actions}>
            {primaryCtaText && primaryCtaHref && (
              <Link href={primaryCtaHref} className={s.btnPrimary}>
                {primaryCtaText}
              </Link>
            )}
            {secondaryCtaText && secondaryCtaHref && (
              <Link href={secondaryCtaHref} className={s.btnGhost}>
                {secondaryCtaText}
              </Link>
            )}
            {children}
          </div>
        )}
      </div>

      {showScrollIndicator && (
        <div className={s.scrollIndicator} aria-hidden="true">
          <div className={s.scrollLine} />
        </div>
      )}
    </section>
  )
}
