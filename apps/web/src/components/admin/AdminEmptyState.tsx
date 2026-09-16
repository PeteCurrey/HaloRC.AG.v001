import React from 'react'

export interface AdminEmptyStateProps {
  title?: string
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  style?: React.CSSProperties
}

export function AdminEmptyState({
  title = 'No records found',
  description = 'No items match the selected filter criteria or query.',
  icon,
  action,
  style,
}: AdminEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        ...style,
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--admin-surface-well, #EFEFED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--admin-text-tertiary, #767A85)',
          marginBottom: '12px',
        }}
      >
        {icon || (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </div>

      <h4
        style={{
          margin: '0 0 4px 0',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--admin-text-primary, #111317)',
        }}
      >
        {title}
      </h4>

      {description && (
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '0.75rem',
            color: 'var(--admin-text-secondary, #494D55)',
            maxWidth: '360px',
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  )
}

export interface AdminErrorStateProps {
  title?: string
  message: React.ReactNode
  action?: React.ReactNode
  style?: React.CSSProperties
}

export function AdminErrorState({
  title = 'Operational Warning / Error',
  message,
  action,
  style,
}: AdminErrorStateProps) {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(200, 0, 26, 0.05)',
        border: '1px solid rgba(200, 0, 26, 0.25)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        ...style,
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'var(--admin-dot-alert, #C8001A)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.6875rem',
          fontWeight: 700,
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        !
      </div>
      <div style={{ flex: 1 }}>
        <h5
          style={{
            margin: '0 0 4px 0',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#9F0015',
          }}
        >
          {title}
        </h5>
        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', lineHeight: 1.4 }}>
          {message}
        </div>
        {action && <div style={{ marginTop: '8px' }}>{action}</div>}
      </div>
    </div>
  )
}
