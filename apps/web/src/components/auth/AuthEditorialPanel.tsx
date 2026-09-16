import React from 'react'
import Image from 'next/image'
import s from './AuthEditorialPanel.module.css'

export interface AuthEditorialPanelProps {
  imageSrc?: string
  imageAlt?: string
  caption?: string
  headline?: string
  subtext?: string
}

export function AuthEditorialPanel({
  imageSrc = '/images/hero/hero-1-5-scale-rc.jpg',
  imageAlt = 'Avorria RC precision chassis engineering and competition assembly',
  caption = 'AVORRIA SPEC // WORKSHOP & RACE ENGINEERING',
  headline = 'Precision Engineering. Without Compromise.',
  subtext = 'Authoritative technical specifications, verified telemetry, and dedicated vehicle intelligence.',
}: AuthEditorialPanelProps) {
  return (
    <div className={s.panel}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        className={s.image}
        sizes="(max-width: 1023px) 100vw, 50vw"
      />
      <div className={s.vignette} />
      <div className={s.content}>
        <div className={s.badge}>
          <span className={s.badgeDot} />
          <span className={s.badgeText}>{caption}</span>
        </div>
        <div className={s.editorialText}>
          <h2 className={s.headline}>{headline}</h2>
          <p className={s.subtext}>{subtext}</p>
        </div>
      </div>
    </div>
  )
}
