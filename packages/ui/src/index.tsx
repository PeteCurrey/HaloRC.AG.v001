import React from 'react'
import type { DataConfidence, AvailabilityStatus, Currency, TaxMode } from '@halo-rc/types'

// ─── DataConfidenceBadge ──────────────────────────────────────────────────────
// UNKNOWN confidence is never rendered (returns null)
export interface DataConfidenceBadgeProps {
  confidence: DataConfidence
  sourceType?: string | null
  className?: string
}

export const DataConfidenceBadge: React.FC<DataConfidenceBadgeProps> = ({
  confidence,
  sourceType,
  className = '',
}) => {
  if (confidence === 'UNKNOWN') return null

  const colorMap: Record<Exclude<DataConfidence, 'UNKNOWN'>, string> = {
    VERIFIED: 'var(--colour-verified, #1A6E34)',
    KNOWN: 'var(--text-tertiary, #767A85)',
    INFERRED: 'var(--colour-caution, #B86818)',
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.625rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono, monospace)',
        color: 'var(--text-tertiary, #767A85)',
        fontWeight: 500,
      }}
      title={sourceType ? `Source: ${sourceType}` : undefined}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: colorMap[confidence],
          display: 'inline-block',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>{confidence}</span>
    </span>
  )
}

// ─── MarketAwarePrice ─────────────────────────────────────────────────────────
export interface MarketAwarePriceProps {
  amountMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  size?: 'sm' | 'base' | 'lg' | 'xl'
  className?: string
}

export const MarketAwarePrice: React.FC<MarketAwarePriceProps> = ({
  amountMinorUnits,
  currency,
  taxMode,
  size = 'base',
  className = '',
}) => {
  const symbol = currency === 'GBP' ? '£' : '$'
  const formatted = `${symbol}${(amountMinorUnits / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const taxLabel = taxMode === 'INCLUSIVE' ? 'inc. VAT' : 'excl. tax'

  const fontSizes = {
    sm: 'var(--text-sm, 0.8125rem)',
    base: 'var(--text-base, 0.9375rem)',
    lg: 'var(--text-xl, 1.5rem)',
    xl: 'var(--text-2xl, 2rem)',
  }

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px' }}>
      <span
        style={{
          fontFamily: 'var(--font-primary, sans-serif)',
          fontWeight: 600,
          fontSize: fontSizes[size],
          color: 'var(--text-primary, #111215)',
          letterSpacing: '-0.02em',
        }}
      >
        {formatted}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.6875rem',
          color: 'var(--text-tertiary, #767A85)',
          letterSpacing: '0.04em',
        }}
      >
        {taxLabel}
      </span>
    </span>
  )
}

// ─── StockStatus ──────────────────────────────────────────────────────────────
export interface StockStatusProps {
  status: AvailabilityStatus
  leadTimeDays?: number | null
  className?: string
}

export const StockStatus: React.FC<StockStatusProps> = ({
  status,
  leadTimeDays,
  className = '',
}) => {
  const statusConfig: Record<
    AvailabilityStatus,
    { label: string; color: string }
  > = {
    IN_STOCK: { label: 'In Stock', color: 'var(--colour-verified, #1A6E34)' },
    LOW_STOCK: { label: 'Low Stock', color: 'var(--colour-caution, #B86818)' },
    PRE_ORDER: { label: 'Pre-Order', color: 'var(--colour-halo, #B8935A)' },
    SPECIAL_ORDER: { label: 'Special Order', color: 'var(--colour-smoke, #606060)' },
    ALLOCATED: { label: 'Allocated', color: 'var(--colour-halo, #B8935A)' },
    OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--colour-error, #C82020)' },
    NOT_AVAILABLE: { label: 'Unavailable', color: 'var(--colour-smoke, #606060)' },
  }

  const { label, color } = statusConfig[status]

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontFamily: 'var(--font-primary, sans-serif)',
          fontSize: 'var(--text-xs, 0.6875rem)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--colour-ash, #909090)',
        }}
      >
        {label}
        {leadTimeDays ? ` (${leadTimeDays}d lead)` : ''}
      </span>
    </div>
  )
}
