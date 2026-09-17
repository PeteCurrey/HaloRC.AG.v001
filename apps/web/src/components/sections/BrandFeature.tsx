import Image from 'next/image'
import Link from 'next/link'
import s from './BrandFeature.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface BrandFeatureProps {
  imageSrc: string
  imageAlt?: string
  name: string
  country?: string
  specialism?: string
  status?: string
  description: string
  href: string
}

export function BrandFeature({
  imageSrc,
  imageAlt = 'Avorria RC engineering marque',
  name,
  country,
  specialism,
  status,
  description,
  href,
}: BrandFeatureProps) {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={s.imagePanel}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
          <div className={s.imageOverlay} />
        </div>

        <div className={s.contentPanel}>
          <ScrollReveal variant="slide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {status && (
                <div className={s.status}>
                  <span className={s.statusDot} />
                  <span>{status}</span>
                </div>
              )}
              {country && <span className={s.country}>{country}</span>}
            </div>

            <h2 className={s.name}>{name}</h2>

            {specialism && <p className={s.specialism}>{specialism}</p>}

            <div className={s.rule} />

            <p className={s.description}>{description}</p>

            <Link href={href} className={s.cta}>
              Explore {name} Universe →
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
