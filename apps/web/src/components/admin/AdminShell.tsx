'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminHeader } from './AdminHeader'

export interface NavSectionItem {
  href: string
  label: string
  badge?: string
  shortLabel?: string
}

export interface NavSection {
  title?: string
  items: NavSectionItem[]
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/admin', label: 'Overview', shortLabel: 'OV' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products & SKUs', shortLabel: 'PR' },
      { href: '/admin/brands', label: 'Brands & Supply', shortLabel: 'BR' },
      { href: '/admin/categories', label: 'Categories', shortLabel: 'CA' },
      { href: '/admin/platforms', label: 'Vehicle Platforms', shortLabel: 'VP' },
      { href: '/admin/media', label: 'Media & Licensing', shortLabel: 'MD' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/admin/orders', label: 'Orders', shortLabel: 'OR' },
      { href: '/admin/customers', label: 'Customers', shortLabel: 'CU' },
      { href: '/admin/markets', label: 'Markets & Shipping', shortLabel: 'MK' },
    ],
  },
  {
    title: 'Leads & Enquiries',
    items: [
      { href: '/admin/leads', label: 'Leads (CRM)', shortLabel: 'LD' },
    ],
  },
  {
    title: 'Content & CMS',
    items: [
      { href: '/admin/content/pages', label: 'Pages', shortLabel: 'PG' },
      { href: '/admin/content/homepage', label: 'Homepage Config', shortLabel: 'HP' },
      { href: '/admin/content/navigation', label: 'Navigation', shortLabel: 'NV' },
    ],
  },
  {
    title: 'Intelligence & SEO',
    items: [
      { href: '/admin/seo', label: 'SEO Audit', shortLabel: 'SO' },
      { href: '/admin/data-quality', label: 'Data Quality', shortLabel: 'DQ' },
      { href: '/admin/ai', label: 'AI Telemetry', shortLabel: 'AI' },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { href: '/admin/procurement', label: 'Dashboard', shortLabel: 'PD' },
      { href: '/admin/procurement/suppliers', label: 'Suppliers', shortLabel: 'SP' },
      { href: '/admin/procurement/brands', label: 'Brand Sourcing', shortLabel: 'BS' },
      { href: '/admin/procurement/contacts', label: 'Contacts', shortLabel: 'CT' },
      { href: '/admin/procurement/applications', label: 'Applications', shortLabel: 'AP' },
      { href: '/admin/procurement/tasks', label: 'Tasks', shortLabel: 'TK' },
      { href: '/admin/procurement/unmatched', label: 'Unmatched SKUs', shortLabel: 'UM' },
      { href: '/admin/procurement/import', label: 'Feed Import', shortLabel: 'FI' },
    ],
  },
]

export interface AdminShellProps {
  children: React.ReactNode
  userRole?: string | undefined
  userEmail?: string | undefined
}

const STORAGE_KEY = 'avorria_admin_sidebar_collapsed'

export function AdminShell({ children, userRole, userEmail }: AdminShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setCollapsed(stored === 'true')
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const handleToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Ignore
      }
      return next
    })
  }

  const sidebarWidth = mounted && collapsed ? 60 : 240

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--admin-canvas, #F5F5F3)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-primary, system-ui, sans-serif)',
      }}
    >
      <AdminHeader
        sidebarCollapsed={collapsed}
        onToggleSidebar={handleToggleSidebar}
        userRole={userRole}
        userEmail={userEmail}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Operational Sidebar */}
        <aside
          style={{
            width: `${sidebarWidth}px`,
            minWidth: `${sidebarWidth}px`,
            backgroundColor: 'var(--admin-surface, #FFFFFF)',
            borderRight: '1px solid var(--admin-border, #E2E2DE)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 150ms cubic-bezier(0.16, 1, 0.3, 1), min-width 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            overflowX: 'hidden',
            overflowY: 'auto',
            height: 'calc(100vh - 48px)',
            position: 'sticky',
            top: 48,
            zIndex: 20,
          }}
        >
          <nav
            aria-label="Admin Operational Navigation"
            style={{
              padding: collapsed ? '12px 6px' : '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {ADMIN_NAV_SECTIONS.map((section, idx) => (
              <div key={section.title || idx}>
                {section.title && !collapsed && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.09em',
                      color: 'var(--admin-text-tertiary, #767A85)',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      marginBottom: '2px',
                    }}
                  >
                    {section.title}
                  </div>
                )}
                {section.title && collapsed && (
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: 'var(--admin-border-subtle, #EBEBE7)',
                      margin: '6px 4px',
                    }}
                  />
                )}
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {section.items.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={item.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'space-between',
                            padding: collapsed ? '7px 0' : '6px 10px',
                            borderRadius: 'var(--admin-radius-sm, 3px)',
                            fontSize: '0.75rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive
                              ? 'var(--admin-text-primary, #111317)'
                              : 'var(--admin-text-secondary, #494D55)',
                            backgroundColor: isActive
                              ? 'var(--admin-surface-well, #EFEFED)'
                              : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 80ms ease',
                            borderLeft: isActive
                              ? '2px solid var(--admin-text-primary, #111317)'
                              : '2px solid transparent',
                          }}
                        >
                          {collapsed ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                              }}
                            >
                              {item.shortLabel || item.label.slice(0, 2).toUpperCase()}
                            </span>
                          ) : (
                            <>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.label}
                              </span>
                              {item.badge && (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontSize: '0.625rem',
                                    padding: '1px 5px',
                                    borderRadius: 'var(--admin-radius-sm, 3px)',
                                    backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)',
                                    border: '1px solid var(--admin-border, #E2E2DE)',
                                    color: 'var(--admin-text-secondary, #494D55)',
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div
            style={{
              padding: collapsed ? '8px 4px' : '10px 12px',
              borderTop: '1px solid var(--admin-border-subtle, #EBEBE7)',
              backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)',
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--admin-text-tertiary, #767A85)',
              textAlign: collapsed ? 'center' : 'left',
            }}
          >
            {collapsed ? 'v2.4' : 'AVORRIA OS v2.4.0'}
          </div>
        </aside>

        {/* Main Central Workspace */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: '24px 32px',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
