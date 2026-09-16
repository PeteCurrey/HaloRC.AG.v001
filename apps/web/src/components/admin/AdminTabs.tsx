import React from 'react'
import Link from 'next/link'

export interface AdminTabItem {
  id: string
  label: string
  href?: string | undefined
  badge?: string | number | undefined
  active?: boolean | undefined
}

export interface AdminTabsProps {
  tabs: AdminTabItem[]
  activeId?: string | undefined
  activeTab?: string | undefined
  onChange?: ((id: string) => void) | undefined
  style?: React.CSSProperties | undefined
}

export function AdminTabs({
  tabs,
  activeId,
  activeTab,
  onChange,
  style,
}: AdminTabsProps) {
  const currentActiveId = activeId ?? activeTab

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--admin-border, #E2E2DE)',
        marginBottom: '16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentActiveId !== undefined ? currentActiveId === tab.id : tab.active

        const content = (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  padding: '1px 5px',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  backgroundColor: isActive
                    ? 'var(--admin-text-primary, #111317)'
                    : 'var(--admin-surface-well, #EFEFED)',
                  color: isActive ? '#FFFFFF' : 'var(--admin-text-tertiary, #767A85)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </span>
        )

        const baseStyle: React.CSSProperties = {
          padding: '8px 14px',
          fontSize: '0.75rem',
          fontFamily: 'inherit',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--admin-text-primary, #111317)' : 'var(--admin-text-secondary, #494D55)',
          borderBottom: isActive ? '2px solid var(--admin-text-primary, #111317)' : '2px solid transparent',
          marginBottom: '-1px',
          textDecoration: 'none',
          cursor: 'pointer',
          background: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          transition: 'all 100ms ease',
          display: 'inline-flex',
          alignItems: 'center',
        }

        if (tab.href) {
          return (
            <Link key={tab.id} href={tab.href} style={baseStyle}>
              {content}
            </Link>
          )
        }

        return (
          <button
            key={tab.id}
            type="button"
            style={baseStyle}
            onClick={() => onChange?.(tab.id)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
