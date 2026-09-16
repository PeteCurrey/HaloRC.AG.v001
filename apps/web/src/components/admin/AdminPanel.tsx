import React from 'react'

export interface AdminPanelProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  style?: React.CSSProperties
  headerStyle?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  className?: string
}

export function AdminPanel({
  title,
  subtitle,
  badge,
  action,
  children,
  padding = 'md',
  style,
  headerStyle,
  bodyStyle,
  className,
}: AdminPanelProps) {
  const paddingMap = {
    none: 0,
    sm: '12px 16px',
    md: '16px 20px',
    lg: '24px 28px',
  }

  const hasHeader = title || subtitle || badge || action

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        boxShadow: 'var(--admin-shadow-card, 0 1px 3px rgba(0, 0, 0, 0.02))',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)',
            backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)',
            ...headerStyle,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--admin-text-primary, #111317)',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h3>
            )}
            {badge}
            {subtitle && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--admin-text-tertiary, #767A85)',
                  marginLeft: '4px',
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
          {action && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{action}</div>}
        </div>
      )}
      <div
        style={{
          padding: paddingMap[padding],
          flex: 1,
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
