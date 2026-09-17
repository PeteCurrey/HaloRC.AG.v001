import s from './ChapterIntro.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface ChapterIntroProps {
  number: string
  title: string
  intro?: string
  surface?: 'light' | 'dark'
}

export function ChapterIntro({
  number,
  title,
  intro,
  surface = 'light',
}: ChapterIntroProps) {
  return (
    <section className={s.section} data-surface={surface}>
      <div className={s.bgNumber} aria-hidden="true">
        {number}
      </div>

      <div className={s.inner}>
        <ScrollReveal variant="slide">
          <div className={s.meta}>
            <span className={s.metaNumber}>{number}</span>
            <span className={s.metaDivider}>/</span>
            <span className={s.metaLabel}>{title}</span>
          </div>

          <h2 className={s.heading}>{title}</h2>

          {intro && <p className={s.body}>{intro}</p>}
        </ScrollReveal>
      </div>
    </section>
  )
}
