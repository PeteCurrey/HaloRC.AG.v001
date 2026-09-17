import Image from 'next/image'
import Link from 'next/link'
import s from './EditorialSplit.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface EditorialSplitProps {
  imageSrc: string
  imageAlt?: string
  imagePosition?: 'left' | 'right'
  imageHref?: string
  imagePriority?: boolean
  ratio?: '50-50' | '60-40' | '40-60'
  surface?: 'light' | 'dark'
  eyebrow?: string
  heading: string
  body: string
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  children?: React.ReactNode
}

export function EditorialSplit({
  imageSrc,
  imageAlt = 'Avorria RC editorial imagery',
  imagePosition = 'left',
  imageHref,
  imagePriority = false,
  ratio = '50-50',
  surface = 'light',
  eyebrow,
  heading,
  body,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  children,
}: EditorialSplitProps) {
  return (
    <section
      className={s.section}
      data-image-position={imagePosition}
      data-ratio={ratio}
      data-surface={surface}
    >
      <div className={s.imagePanel}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority={imagePriority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          style={{ objectFit: 'cover' }}
        />
        {imageHref && (
          <Link href={imageHref} className={s.imageLink} aria-label={heading} />
        )}
      </div>

      <div className={s.contentPanel}>
        <ScrollReveal variant="slide">
          {eyebrow && (
            <div className={s.eyebrow}>
              <span className={s.eyebrowLine} aria-hidden="true" />
              <span className={s.eyebrowText}>{eyebrow}</span>
            </div>
          )}

          <h2 className={s.heading}>
            {heading.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h2>

          <p className={s.body}>{body}</p>

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
        </ScrollReveal>
      </div>
    </section>
  )
}
