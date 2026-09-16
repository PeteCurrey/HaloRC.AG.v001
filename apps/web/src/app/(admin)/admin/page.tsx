import Link from 'next/link'
import {
  getAdminProducts,
  getAdminOrderStats,
  getAdminLeadStats,
  getAdminSeoStats,
  getAdminBrands,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
  AdminStatus,
  AdminSection,
} from '@/components/admin'

export const revalidate = 0

export default async function AdminDashboard() {
  // Fetch real authoritative operational statistics from DB
  const [productData, orderStats, leadStats, seoStats, brandsList] = await Promise.allSettled([
    getAdminProducts({}, { page: 1, perPage: 1 }),
    getAdminOrderStats(),
    getAdminLeadStats(),
    getAdminSeoStats(),
    getAdminBrands(),
  ])

  const totalProducts = productData.status === 'fulfilled' ? productData.value.total : null
  const totalBrands = brandsList.status === 'fulfilled' ? brandsList.value.length : null
  const orders = orderStats.status === 'fulfilled' ? orderStats.value : null
  const leads = leadStats.status === 'fulfilled' ? leadStats.value : null
  const seo = seoStats.status === 'fulfilled' ? seoStats.value : null

  const metrics = [
    {
      label: 'Authoritative Products',
      value: totalProducts !== null ? totalProducts.toString() : '—',
      detail: 'Catalogued machines, kits & parts',
      href: '/admin/products',
      status: 'active',
    },
    {
      label: 'Managed Brands',
      value: totalBrands !== null ? totalBrands.toString() : '—',
      detail: 'Direct & authorised partners',
      href: '/admin/brands',
      status: 'active',
    },
    {
      label: 'Active Orders',
      value: orders !== null ? orders.totalOrders.toString() : '0',
      detail: orders ? `${orders.pendingFulfilment} pending fulfilment` : 'No orders recorded',
      href: '/admin/orders',
      status: orders && orders.pendingFulfilment > 0 ? 'review' : 'neutral',
    },
    {
      label: 'Open Leads & Enquiries',
      value: leads !== null ? leads.totalLeads.toString() : '0',
      detail: leads ? `${leads.newLeads} awaiting review` : 'No leads recorded',
      href: '/admin/leads',
      status: leads && leads.newLeads > 0 ? 'warning' : 'neutral',
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Page Header */}
      <AdminPageHeader
        category="Operational Command Center"
        title="Authoritative Operations Control"
        description="Database-governed control environment for catalogue, pricing, commerce, customer leads, and content infrastructure."
        actions={
          <>
            <AdminAction variant="primary" href="/admin/products/new">
              + New Product
            </AdminAction>
            <AdminAction variant="secondary" href="/admin/content/pages/new">
              + New Page
            </AdminAction>
          </>
        }
      />

      {/* Primary KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <AdminPanel padding="md" style={{ height: '100%', transition: 'border-color 100ms ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                    color: 'var(--admin-text-tertiary, #767A85)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {m.label}
                </span>
                <AdminStatus status={m.status} showDot={true} size="sm" />
              </div>

              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--admin-text-primary, #111317)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  margin: '4px 0 6px',
                }}
              >
                {m.value}
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--admin-text-secondary, #494D55)',
                }}
              >
                {m.detail}
              </div>
            </AdminPanel>
          </Link>
        ))}
      </div>

      {/* Operations Quick Actions & Health */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* SEO & Discovery Health */}
        <AdminPanel
          title="SEO & Discoverability Health"
          subtitle="Index coverage & meta tagging"
          action={
            <Link
              href="/admin/seo"
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--admin-text-primary, #111317)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              View Full Audit &rarr;
            </Link>
          }
          padding="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                Products missing meta description
              </span>
              <AdminStatus
                status={seo && seo.missingDescriptionCount > 0 ? 'warning' : 'verified'}
                label={seo !== null ? `${seo.missingDescriptionCount} items` : '—'}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                Products missing custom SEO title
              </span>
              <AdminStatus
                status={seo && seo.missingTitleCount > 0 ? 'warning' : 'verified'}
                label={seo !== null ? `${seo.missingTitleCount} items` : '—'}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                Published products indexed
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--admin-text-primary, #111317)',
                }}
              >
                {seo !== null ? seo.totalPublishedProducts : '—'}
              </span>
            </div>
          </div>
        </AdminPanel>

        {/* Operational Modules Navigation */}
        <AdminPanel
          title="Platform Operational Units"
          subtitle="Direct links to governance systems"
          padding="md"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Link
              href="/admin/products"
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--admin-text-primary, #111317)' }}>
                Product Catalogue
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '2px' }}>
                Variants, SKUs, pricing
              </div>
            </Link>

            <Link
              href="/admin/orders"
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--admin-text-primary, #111317)' }}>
                Order Ledger
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '2px' }}>
                Fulfilment &amp; payment
              </div>
            </Link>

            <Link
              href="/admin/leads"
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--admin-text-primary, #111317)' }}>
                Leads CRM
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '2px' }}>
                Enquiries &amp; quotes
              </div>
            </Link>

            <Link
              href="/admin/procurement"
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--admin-text-primary, #111317)' }}>
                Procurement
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '2px' }}>
                Suppliers, brands &amp; feeds
              </div>
            </Link>
          </div>
        </AdminPanel>
      </div>

      {/* Authoritative Data Policy Notice */}
      <AdminPanel padding="md" style={{ backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--admin-accent, #B8935A)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.6875rem',
              color: 'var(--admin-text-primary, #111317)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Authoritative Data Policy
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--admin-text-secondary, #494D55)',
            lineHeight: 1.5,
          }}
        >
          Avorria RC operates on a strict single source of truth: all storefront displays, configurator slots, and market offerings are dynamically governed by the authoritative database. Hardcoded product fixtures, client-side price calculations, and unverified AI content generation are prohibited.
        </p>
      </AdminPanel>
    </div>
  )
}
