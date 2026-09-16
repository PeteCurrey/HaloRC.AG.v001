import React from 'react'

export interface AdminSectionProps {
  title?: string | undefined
  count?: number | string | undefined
  action?: React.ReactNode | undefined
  children?: React.ReactNode | undefined
  style?: React.CSSProperties | undefined
}

export function AdminSection({
  title,
  count,
  action,
  children,
  style,
}: AdminSectionProps) {
  const hasHeader = Boolean(title || count !== undefined || action)

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {title && (
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--admin-text-primary, #111317)',
                }}
              >
                {title}
              </h2>
            )}
            {count !== undefined && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--admin-text-tertiary, #767A85)',
                  backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                  padding: '1px 6px',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                }}
              >
                {count}
              </span>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
