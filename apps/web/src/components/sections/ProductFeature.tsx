import Image from 'next/image'
import Link from 'next/link'
import s from './ProductFeature.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface ProductFeatureSpec {
  label: string
  value: string
}

export interface ProductFeatureProps {
  imageSrc: string
  imageAlt?: string
  imagePosition?: 'left' | 'right'
  isHalo?: boolean
  haloClassification?: string
  manufacturer: string
  name: string
  specs?: ProductFeatureSpec[]
  editorial: string
  priceSlot?: React.ReactNode
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  surface?: 'light' | 'dark'
}

export function ProductFeature({
  imageSrc,
  imageAlt = 'Avorria RC precision platform',
  imagePosition = 'left',
  isHalo = false,
  haloClassification = 'Competition',
  manufacturer,
  name,
  specs = [],
  editorial,
  priceSlot,
  primaryCtaText = 'View Machine',
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  surface = 'dark',
}: ProductFeatureProps) {
  return (
    <section className={s.section} data-surface={surface}>
      <div
        className={s.inner}
        data-image-position={imagePosition}
      >
        <div className={s.imagePanel} data-halo={isHalo}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div className={s.contentPanel}>
          <ScrollReveal variant="slide">
            {isHalo ? (
              <div className={s.classification}>
                <span className={s.classificationDot} aria-hidden="true" />
                <span className={s.classificationText}>
                  ★ Halo / {haloClassification}
                </span>
              </div>
            ) : (
              <p className={s.manufacturer}>{manufacturer}</p>
            )}

            <h3 className={s.name}>{name}</h3>

            {specs.length > 0 && (
              <div className={s.specsRow}>
                {specs.map((spec, i) => (
                  <div key={i} className={s.specItem}>
                    <span className={s.specKey}>{spec.label}</span>
                    <span className={s.specValue}>{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            <p className={s.editorial}>{editorial}</p>

            {priceSlot && <div className={s.priceRow}>{priceSlot}</div>}

            <div className={s.actions}>
              {primaryCtaHref && (
                <Link
                  href={primaryCtaHref}
                  className={isHalo ? s.btnHalo : s.btnPrimary}
                >
                  {primaryCtaText} →
                </Link>
              )}
              {secondaryCtaHref && secondaryCtaText && (
                <Link href={secondaryCtaHref} className={s.btnGhost}>
                  {secondaryCtaText}
                </Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
