'use client'

import React from 'react'
import s from './HeroHaloMotif.module.css'

interface HeroHaloMotifProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * HeroHaloMotif — Ambient breathing brand visual for the homepage hero.
 *
 * Built directly from the geometric language of HaloLogo (rings + crosshair + centre point),
 * enlarged and animated via CSS only. Pulses softly with an ignition glow to keep the site
 * feeling alive without requiring third-party stock photography.
 */
export function HeroHaloMotif({ className, style }: HeroHaloMotifProps) {
  return (
    <div
      className={`${s.container} ${className || ''}`}
      style={style}
      aria-hidden="true"
    >
      <svg
        className={s.svg}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id="heroMotifGlow"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#F2540B" stopOpacity="0.28" />
            <stop offset="35%" stopColor="#F2540B" stopOpacity="0.14" />
            <stop offset="65%" stopColor="#B8935A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#F2540B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pulsing ambient ignition/halo glow */}
        <circle
          cx="250"
          cy="250"
          r="235"
          fill="url(#heroMotifGlow)"
          className={s.ambientGlow}
        />

        {/* Outer ring assembly — pulses in sync with the glow */}
        <g className={s.outerRingGroup}>
          {/* Subtle tactical outer guide track */}
          <circle
            cx="250"
            cy="250"
            r="230"
            stroke="#B8935A"
            strokeWidth="0.75"
            opacity="0.25"
            strokeDasharray="4 8"
            className={s.mobileHide}
          />

          {/* Primary outer ring — matches HaloLogo outer circle */}
          <circle
            cx="250"
            cy="250"
            r="215"
            stroke="#E8E8E8"
            strokeWidth="1.75"
            opacity="0.45"
          />

          {/* Precision quadrant ticks on outer ring */}
          <g className={s.mobileHide} opacity="0.35">
            <line x1="250" y1="15" x2="250" y2="25" stroke="#E8E8E8" strokeWidth="1" />
            <line x1="250" y1="475" x2="250" y2="485" stroke="#E8E8E8" strokeWidth="1" />
            <line x1="15" y1="250" x2="25" y2="250" stroke="#E8E8E8" strokeWidth="1" />
            <line x1="475" y1="250" x2="485" y2="250" stroke="#E8E8E8" strokeWidth="1" />
          </g>
        </g>

        {/* Inner ring assembly — slower counter-rotating loop */}
        <g className={s.innerRingGroup}>
          <circle
            cx="250"
            cy="250"
            r="140"
            stroke="#B8935A"
            strokeWidth="1.5"
            opacity="0.7"
            strokeDasharray="28 12"
          />
          {/* Secondary micro-ring indicator */}
          <circle
            cx="250"
            cy="250"
            r="125"
            stroke="#F2540B"
            strokeWidth="0.75"
            opacity="0.35"
            strokeDasharray="8 16"
            className={s.mobileHide}
          />
        </g>

        {/* Crosshairs — horizontal & vertical with gap for centre point */}
        <g className={s.crosshairs}>
          {/* Horizontal crosshair */}
          <line
            x1="70"
            y1="250"
            x2="185"
            y2="250"
            stroke="#E8E8E8"
            strokeWidth="1.25"
            opacity="0.6"
          />
          <line
            x1="315"
            y1="250"
            x2="430"
            y2="250"
            stroke="#E8E8E8"
            strokeWidth="1.25"
            opacity="0.6"
          />

          {/* Vertical crosshair */}
          <line
            x1="250"
            y1="70"
            x2="250"
            y2="185"
            stroke="#E8E8E8"
            strokeWidth="1.25"
            opacity="0.6"
          />
          <line
            x1="250"
            y1="315"
            x2="250"
            y2="430"
            stroke="#E8E8E8"
            strokeWidth="1.25"
            opacity="0.6"
          />
        </g>

        {/* Centre beacon point */}
        <g className={s.centerPoint}>
          <circle cx="250" cy="250" r="14" fill="#B8935A" opacity="0.8" />
          <circle cx="250" cy="250" r="5" fill="#F2540B" />
        </g>
      </svg>
    </div>
  )
}
