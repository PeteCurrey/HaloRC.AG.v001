import Image from 'next/image'
import Link from 'next/link'
import s from './FullBleedImage.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface FullBleedImageProps {
  imageSrc: string
  imageAlt?: string
  imagePosition?: string
  height?: 'viewport' | 'large' | 'medium'
  overlayPosition?: 'bottom-left' | 'center' | 'bottom-center'
  eyebrow?: string
  heading: string
  body?: string
  ctaText?: string
  ctaHref?: string
}

export function FullBleedImage({
  imageSrc,
  imageAlt = 'Avorria RC cinematic motorsport imagery',
  imagePosition = 'center',
  height = 'large',
  overlayPosition = 'bottom-left',
  eyebrow,
  heading,
  body,
  ctaText,
  ctaHref,
}: FullBleedImageProps) {
  return (
    <section
      className={s.section}
      data-height={height}
      data-overlay={overlayPosition}
    >
      <div className={s.bg} aria-hidden="true">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: imagePosition }}
        />
      </div>

      <div className={s.scrim} aria-hidden="true" />

      <div className={s.content}>
        <ScrollReveal variant="slide">
          {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
          <h2 className={s.heading}>
            {heading.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h2>
          {body && <p className={s.body}>{body}</p>}
          {ctaText && ctaHref && (
            <div>
              <Link href={ctaHref} className={s.cta}>
                {ctaText}
              </Link>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
