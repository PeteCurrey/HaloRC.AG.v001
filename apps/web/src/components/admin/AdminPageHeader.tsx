import React from 'react'
import Link from 'next/link'

export interface AdminBreadcrumbItem {
  label: string
  href?: string
}

export interface AdminPageHeaderProps {
  breadcrumbs?: AdminBreadcrumbItem[]
  category?: string
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  status?: React.ReactNode
  style?: React.CSSProperties
}

export function AdminPageHeader({
  breadcrumbs,
  category,
  title,
  description,
  actions,
  status,
  style,
}: AdminPageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        ...style,
      }}
    >
      <div style={{ flex: '1 1 300px' }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumbs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--admin-text-tertiary, #767A85)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1
              return (
                <React.Fragment key={i}>
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      style={{
                        color: 'var(--admin-text-secondary, #494D55)',
                        textDecoration: 'none',
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span style={{ color: isLast ? 'var(--admin-text-primary, #111317)' : undefined }}>
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span style={{ opacity: 0.4 }}>/</span>}
                </React.Fragment>
              )
            })}
          </nav>
        )}

        {category && !breadcrumbs && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.6875rem',
                letterSpacing: '0.1em',
                color: 'var(--admin-text-tertiary, #767A85)',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              {category}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--admin-text-primary, #111317)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {status}
        </div>

        {description && (
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--admin-text-secondary, #494D55)',
              marginTop: '4px',
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
