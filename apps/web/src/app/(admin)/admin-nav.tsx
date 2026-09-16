'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavSection {
  title?: string
  items: Array<{
    href: string
    label: string
    badge?: string
  }>
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/admin', label: 'Overview' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products & SKUs' },
      { href: '/admin/brands', label: 'Brands & Supply' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/platforms', label: 'Vehicle Platforms' },
      { href: '/admin/media', label: 'Media & Licensing' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/markets', label: 'Markets & Shipping' },
    ],
  },
  {
    title: 'Leads & Enquiries',
    items: [
      { href: '/admin/leads', label: 'Leads (CRM)' },
    ],
  },
  {
    title: 'Content & CMS',
    items: [
      { href: '/admin/content/pages', label: 'Pages' },
      { href: '/admin/content/homepage', label: 'Homepage Config' },
      { href: '/admin/content/navigation', label: 'Navigation' },
    ],
  },
  {
    title: 'Intelligence & SEO',
    items: [
      { href: '/admin/seo', label: 'SEO Audit' },
      { href: '/admin/data-quality', label: 'Data Quality' },
      { href: '/admin/ai', label: 'AI Telemetry' },
    ],
  },
  {
    title: 'Suppliers & Procurement',
    items: [
      { href: '/admin/suppliers', label: 'Supplier Directory' },
      { href: '/admin/procurement', label: 'Procurement Feed' },
      { href: '/admin/procurement/unmatched', label: 'Unmatched SKUs' },
    ],
  },
]

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin Navigation" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {ADMIN_NAV_SECTIONS.map((section, idx) => (
        <div key={section.title || idx}>
          {section.title && (
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                color: 'var(--colour-smoke)',
                textTransform: 'uppercase',
                marginBottom: 'var(--space-1)',
                paddingLeft: 'var(--space-3)',
              }}
            >
              {section.title}
            </span>
          )}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', margin: 0, padding: 0 }}>
            {section.items.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      color: isActive ? 'var(--colour-white)' : 'var(--colour-ash)',
                      backgroundColor: isActive ? 'var(--colour-graphite)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--colour-halo)' : '2px solid transparent',
                      textDecoration: 'none',
                      letterSpacing: '0.02em',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'background-color 120ms ease, color 120ms ease',
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--colour-steel)',
                          color: 'var(--colour-off-white)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
