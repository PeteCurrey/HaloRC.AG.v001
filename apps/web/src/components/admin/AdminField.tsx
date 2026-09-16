import React from 'react'

export interface AdminFieldProps {
  label: React.ReactNode
  value?: React.ReactNode
  children?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  monospace?: boolean
  style?: React.CSSProperties
}

export function AdminField({
  label,
  value,
  children,
  hint,
  error,
  layout = 'vertical',
  monospace = false,
  style,
}: AdminFieldProps) {
  const isHorizontal = layout === 'horizontal'

  return (
    <div
      style={{
        display: isHorizontal ? 'flex' : 'block',
        alignItems: isHorizontal ? 'baseline' : undefined,
        justifyContent: isHorizontal ? 'space-between' : undefined,
        gap: isHorizontal ? '12px' : undefined,
        marginBottom: '12px',
        ...style,
      }}
    >
      <label
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--admin-text-tertiary, #767A85)',
          marginBottom: isHorizontal ? 0 : '4px',
          whiteSpace: isHorizontal ? 'nowrap' : undefined,
        }}
      >
        {label}
      </label>

      <div>
        {value !== undefined ? (
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--admin-text-primary, #111317)',
              fontFamily: monospace ? 'var(--font-mono, monospace)' : 'inherit',
              fontWeight: 500,
            }}
          >
            {value}
          </div>
        ) : (
          children
        )}

        {hint && (
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--admin-text-tertiary, #767A85)',
              marginTop: '3px',
            }}
          >
            {hint}
          </div>
        )}

        {error && (
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--admin-dot-alert, #C8001A)',
              marginTop: '3px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
