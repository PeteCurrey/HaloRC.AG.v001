'use client'

import React from 'react'
import Link from 'next/link'
import { AdminAction } from './AdminAction'

export interface AdminHeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  userRole?: string | undefined
  userEmail?: string | undefined
}

export function AdminHeader({
  sidebarCollapsed,
  onToggleSidebar,
  userRole = 'STAFF',
  userEmail,
}: AdminHeaderProps) {
  return (
    <header
      style={{
        height: '48px',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        borderBottom: '1px solid var(--admin-border, #E2E2DE)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Left: Sidebar Toggle & System Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--admin-radius-sm, 3px)',
            backgroundColor: 'var(--admin-surface-well, #EFEFED)',
            border: '1px solid var(--admin-border, #E2E2DE)',
            color: 'var(--admin-text-primary, #111317)',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 100ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d={sidebarCollapsed ? 'M14 9l3 3-3 3' : 'M17 9l-3 3 3 3'} />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--admin-dot-online, #1A6E34)',
              boxShadow: '0 0 0 2px rgba(26, 110, 52, 0.2)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--admin-text-primary, #111317)',
              textTransform: 'uppercase',
            }}
          >
            Avorria RC
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--admin-text-tertiary, #767A85)',
              backgroundColor: 'var(--admin-surface-well, #EFEFED)',
              padding: '1px 5px',
              borderRadius: '2px',
              letterSpacing: '0.04em',
            }}
          >
            AUTHORITATIVE ENGINE
          </span>
        </div>
      </div>

      {/* Right: Operational User Badge & Storefront Exit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {userEmail && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              backgroundColor: 'var(--admin-surface-well, #EFEFED)',
              border: '1px solid var(--admin-border-subtle, #EBEBE7)',
              borderRadius: 'var(--admin-radius-sm, 3px)',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--admin-text-secondary, #494D55)',
            }}
          >
            <span
              style={{
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: 'var(--admin-text-primary, #111317)',
                padding: '1px 4px',
                borderRadius: '2px',
                letterSpacing: '0.04em',
              }}
            >
              {userRole}
            </span>
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </span>
          </div>
        )}

        <AdminAction
          variant="secondary"
          size="sm"
          href="/"
          target="_blank"
          title="Open live customer storefront in new tab"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          }
        >
          Storefront
        </AdminAction>
      </div>
    </header>
  )
}
