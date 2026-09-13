import React from 'react'

interface HaloLogoProps {
  className?: string | undefined
  style?: React.CSSProperties | undefined
}

/**
 * Halo RC logomark — minimal geometric form.
 * Not a cartoon. Not a gimmick. A mark.
 */
export function HaloLogo({ className, style }: HaloLogoProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="14"
        cy="14"
        r="12.5"
        stroke="#E8E8E8"
        strokeWidth="1"
      />
      {/* Inner ring — slightly smaller, offset gives depth */}
      <circle
        cx="14"
        cy="14"
        r="8"
        stroke="#B8935A"
        strokeWidth="0.75"
        opacity="0.8"
      />
      {/* Crosshair — horizontal */}
      <line
        x1="4"
        y1="14"
        x2="10.5"
        y2="14"
        stroke="#E8E8E8"
        strokeWidth="0.75"
      />
      <line
        x1="17.5"
        y1="14"
        x2="24"
        y2="14"
        stroke="#E8E8E8"
        strokeWidth="0.75"
      />
      {/* Crosshair — vertical */}
      <line
        x1="14"
        y1="4"
        x2="14"
        y2="10.5"
        stroke="#E8E8E8"
        strokeWidth="0.75"
      />
      <line
        x1="14"
        y1="17.5"
        x2="14"
        y2="24"
        stroke="#E8E8E8"
        strokeWidth="0.75"
      />
      {/* Centre point */}
      <circle cx="14" cy="14" r="1.5" fill="#B8935A" />
    </svg>
  )
}
