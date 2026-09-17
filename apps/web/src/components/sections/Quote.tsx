import s from './Quote.module.css'
import { ScrollReveal } from '@/components/motion/ScrollReveal'

export interface QuoteProps {
  eyebrow?: string
  statement: string
  attribution?: string
  align?: 'left' | 'center'
  surface?: 'light' | 'dark'
}

export function Quote({
  eyebrow,
  statement,
  attribution,
  align = 'left',
  surface = 'dark',
}: QuoteProps) {
  return (
    <section className={s.section} data-align={align} data-surface={surface}>
      <div className={s.inner}>
        <ScrollReveal variant="fade">
          {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
          <blockquote className={s.statement}>
            "{statement}"
          </blockquote>
          {attribution && (
            <cite className={s.attribution}>{attribution}</cite>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
