import React from 'react'

type AvorriaMark_Variant = 'light' | 'dark' | 'neutral'
type AvorriaMark_Type = 'wordmark' | 'monogram'

interface AvorriaMarkProps {
  className?: string | undefined
  style?: React.CSSProperties | undefined
  /**
   * Colour variant:
   * - 'light'   → metallic silver/white logo for dark surfaces (nav before scroll, footer)
   * - 'dark'    → dark charcoal logo for light surfaces (nav after scroll, auth)
   * - 'neutral' → fallback to light
   */
  variant?: AvorriaMark_Variant
  /**
   * Mark type:
   * - 'wordmark'  → full logo with AVORRIA lettering (header, footer, auth)
   * - 'monogram'  → emblem without lettering (compact icons, watermark)
   */
  type?: AvorriaMark_Type
}

/**
 * AvorriaMark — Official Avorria brand emblem & logo.
 * Renders the high-precision geometric wolf logo from the project Logo assets.
 */
export function AvorriaMark({
  className,
  style,
  variant = 'light',
  type = 'wordmark',
}: AvorriaMarkProps) {
  const isDark = variant === 'dark'

  if (type === 'monogram') {
    const src = isDark
      ? '/images/logo/avorria-emblem-dark.png'
      : '/images/logo/avorria-emblem-light.png'

    return (
      <img
        src={src}
        alt="Avorria"
        className={className}
        style={{
          maxHeight: '100%',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    )
  }

  const src = isDark
    ? '/images/logo/avorria-logo-dark.png'
    : '/images/logo/avorria-logo-light.png'

  return (
    <img
      src={src}
      alt="Avorria RC"
      className={className}
      style={{
        maxHeight: '100%',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  )
}

