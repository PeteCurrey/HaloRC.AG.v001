import React from 'react'

type AvorriaMark_Variant = 'light' | 'dark' | 'neutral'
type AvorriaMark_Type = 'wordmark' | 'monogram'

interface AvorriaMarkProps {
  className?: string | undefined
  style?: React.CSSProperties | undefined
  /**
   * Colour variant:
   * - 'light'   → crisp white fill (#F8F9FA) with Cayote-inspired teal/cyan accent
   * - 'dark'    → graphite fill (#111215) with precision accent
   * - 'neutral' → currentColor — inherits from parent
   */
  variant?: AvorriaMark_Variant
  /**
   * Mark type:
   * - 'wordmark'  → full AVORRIA wordmark (primary identity)
   * - 'monogram'  → single bold A / monogram icon
   */
  type?: AvorriaMark_Type
}

const COLOUR: Record<AvorriaMark_Variant, { text: string; accent: string }> = {
  light: {
    text: '#F8F9FA',
    accent: '#0CE5BB', // Cayote signature precision kinetic teal accent
  },
  dark: {
    text: '#111215',
    accent: '#00BA96',
  },
  neutral: {
    text: 'currentColor',
    accent: 'currentColor',
  },
}

/**
 * AvorriaMark — The AVORRIA typographic wordmark.
 *
 * Typography & Construction:
 * - Uses DM Sans (Bold 700 / 800) matching Cayote's exact typeface family.
 * - Tight tracking (-0.03em to -0.01em) identical to Cayote's high-speed geometric proportion.
 * - Subtle automotive engineering detail: The chevron/apex angle accent dot or slash inspired
 *   by Cayote's technical motorsport livery, giving Avorria a confident, recognizable mark.
 */
export function AvorriaMark({
  className,
  style,
  variant = 'light',
  type = 'wordmark',
}: AvorriaMarkProps) {
  const c = COLOUR[variant]

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
        <rect width="40" height="40" rx="8" fill={variant === 'light' ? '#111317' : '#E8E8EC'} />
        <text
          x="18"
          y="28"
          textAnchor="middle"
          fill={c.text}
          fontFamily="var(--font-wordmark)"
          fontWeight="800"
          fontSize="26"
          letterSpacing="-0.03em"
        >
          A
        </text>
        {/* Subtle Cayote-inspired aerodynamic kinetic accent dot */}
        <circle cx="31" cy="14" r="3.2" fill={c.accent} />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 250 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/*
        Wordmark: AVORRIA
        Typeface: DM Sans (Cayote's exact font)
        Weight: 700 (Bold) / 800 with tight aerodynamic tracking
      */}
      <text
        x="0"
        y="30"
        fill={c.text}
        fontFamily="var(--font-wordmark)"
        fontWeight="800"
        fontSize="34"
        letterSpacing="-0.025em"
        textAnchor="start"
      >
        AVORRIA
      </text>

      {/*
        Subtle Cayote-style visual signature:
        Aerodynamic angled speed notch / kinetic accent badge next to the wordmark
      */}
      <polygon
        points="224,12 233,12 227,28 218,28"
        fill={c.accent}
      />
    </svg>
  )
}
