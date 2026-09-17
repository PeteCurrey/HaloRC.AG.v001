import Image from 'next/image'
import Link from 'next/link'
import s from './ImageStrip.module.css'

export interface ImageStripItem {
  id: string | number
  imageSrc: string
  alt?: string
  caption?: string
  href?: string
}

export interface ImageStripProps {
  heading?: string
  subtext?: string
  items: ImageStripItem[]
  aspect?: 'portrait' | 'landscape'
  surface?: 'light' | 'dark'
}

export function ImageStrip({
  heading,
  subtext,
  items,
  aspect = 'portrait',
  surface = 'dark',
}: ImageStripProps) {
  return (
    <section className={s.section} data-surface={surface}>
      {(heading || subtext) && (
        <div className={s.header}>
          {heading && <h3 className={s.heading}>{heading}</h3>}
          {subtext && (
            <p style={{ color: 'var(--colour-smoke)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)' }}>
              {subtext}
            </p>
          )}
        </div>
      )}

      <div className={s.strip} data-aspect={aspect}>
        {items.map((item) => (
          <div key={item.id} className={s.item}>
            <Image
              src={item.imageSrc}
              alt={item.alt || 'Avorria RC engineering moment'}
              fill
              sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 30vw"
              style={{ objectFit: 'cover' }}
            />
            {item.caption && <span className={s.itemCaption}>{item.caption}</span>}
            {item.href && (
              <Link href={item.href} className={s.itemLink} aria-label={item.caption || 'Explore item'} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
