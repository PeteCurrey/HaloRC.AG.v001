import React from 'react'

type AvorriaMark_Variant = 'light' | 'dark' | 'neutral'
type AvorriaMark_Type = 'wordmark' | 'monogram'

interface AvorriaMarkProps {
  className?: string | undefined
  style?: React.CSSProperties | undefined
  /**
   * Colour variant:
   * - 'light'   → white fill (#F8F9FA) — use on dark surfaces (nav over hero, footer)
   * - 'dark'    → deep graphite fill (#111215) — use on light surfaces (scrolled nav, auth)
   * - 'neutral' → currentColor — inherits from parent, use when colour is set by CSS
   */
  variant?: AvorriaMark_Variant
  /**
   * Mark type:
   * - 'wordmark'  → full AVORRIA wordmark (primary identity)
   * - 'monogram'  → single bold A (favicon, avatar, compact contexts)
   */
  type?: AvorriaMark_Type
}

const COLOUR: Record<AvorriaMark_Variant, string> = {
  light:   '#F8F9FA',
  dark:    '#111215',
  neutral: 'currentColor',
}

/**
 * AvorriaMark — The AVORRIA typographic wordmark.
 *
 * Built on Barlow Black (900 weight) — a geometric sans-serif with
 * automotive/highway signage DNA. The wordmark is the logo.
 * No symbol. No crosshair. No decorative element.
 *
 * SVG uses <text> referencing --font-wordmark (Barlow, loaded via
 * next/font as a CSS variable). For static/OG contexts, use the
 * pre-built SVG assets in /public/images/.
 */
export function AvorriaMark({
  className,
  style,
  variant = 'light',
  type = 'wordmark',
}: AvorriaMarkProps) {
  const fill = COLOUR[variant]

  if (type === 'monogram') {
    return (
      <svg
        className={className}
        style={style}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={fill}
          fontFamily="var(--font-wordmark)"
          fontWeight="900"
          fontSize="36"
          letterSpacing="-0.02em"
        >
          A
        </text>
      </svg>
    )
  }

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 268 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/*
        Wordmark: AVORRIA
        Font: Barlow Black 900
        Letter-spacing: 0.06em — controlled positive tracking.
      */}
      <text
        x="0"
        y="32"
        fill={fill}
        fontFamily="var(--font-wordmark)"
        fontWeight="900"
        fontSize="38"
        letterSpacing="0.06em"
        textAnchor="start"
      >
        AVORRIA
      </text>
    </svg>
  )
}
