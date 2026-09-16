import Link from 'next/link'
import {
  getAdminProducts,
  getAdminOrderStats,
  getAdminLeadStats,
  getAdminSeoStats,
  getAdminBrands,
} from '@halo-rc/db'

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
      value: totalProducts !== null ? totalProducts.toString() : 'No data available',
      detail: 'Catalogued machines, kits & parts',
      href: '/admin/products',
    },
    {
      label: 'Managed Brands',
      value: totalBrands !== null ? totalBrands.toString() : 'No data available',
      detail: 'Direct & authorised partners',
      href: '/admin/brands',
    },
    {
      label: 'Active Orders',
      value: orders !== null ? orders.totalOrders.toString() : 'No data available',
      detail: orders ? `${orders.pendingFulfilment} pending fulfilment` : 'No orders recorded',
      href: '/admin/orders',
    },
    {
      label: 'Open Leads & Enquiries',
      value: leads !== null ? leads.totalLeads.toString() : 'No data available',
      detail: leads ? `${leads.newLeads} awaiting review` : 'No leads recorded',
      href: '/admin/leads',
    },
  ]

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-verified)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-verified)', textTransform: 'uppercase' }}>
              Authoritative Operations Control
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Operational Command Center
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
            Authoritative database governance for catalogue, pricing, commerce, customer leads, and editorial CMS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo)',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
            }}
          >
            + New Product
          </Link>
          <Link
            href="/admin/content/pages/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-white)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.04em',
              textDecoration: 'none',
            }}
          >
            + New Page
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'block',
              transition: 'border-color 150ms ease',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {m.label}
            </p>
            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--colour-white)', marginTop: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
              {m.value}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
              {m.detail}
            </p>
          </Link>
        ))}
      </div>

      {/* Operations Quick Actions & Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* SEO & Discovery Health */}
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
              SEO &amp; Discoverability Health
            </h2>
            <Link href="/admin/seo" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-halo)', textDecoration: 'none' }}>
              View Audit &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--colour-graphite)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>Products missing meta description</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: seo && seo.missingDescriptionCount > 0 ? 'var(--colour-amber)' : 'var(--colour-verified)', fontWeight: 600 }}>
                {seo !== null ? seo.missingDescriptionCount : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--colour-graphite)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>Products missing custom SEO title</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: seo && seo.missingTitleCount > 0 ? 'var(--colour-amber)' : 'var(--colour-verified)', fontWeight: 600 }}>
                {seo !== null ? seo.missingTitleCount : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>Published products indexed</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)', fontWeight: 600 }}>
                {seo !== null ? seo.totalPublishedProducts : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Modules Navigation */}
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
            Platform Operational Units
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <Link
              href="/admin/products"
              style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--colour-off-white)', fontSize: 'var(--text-xs)', display: 'block' }}
            >
              <div style={{ fontWeight: 600 }}>Product Catalogue</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: '2px' }}>Variants, SKUs, pricing</div>
            </Link>
            <Link
              href="/admin/orders"
              style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--colour-off-white)', fontSize: 'var(--text-xs)', display: 'block' }}
            >
              <div style={{ fontWeight: 600 }}>Order Ledger</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: '2px' }}>Fulfilment &amp; payment</div>
            </Link>
            <Link
              href="/admin/leads"
              style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--colour-off-white)', fontSize: 'var(--text-xs)', display: 'block' }}
            >
              <div style={{ fontWeight: 600 }}>Leads CRM</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: '2px' }}>Enquiries &amp; quotes</div>
            </Link>
            <Link
              href="/admin/content/pages"
              style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--colour-off-white)', fontSize: 'var(--text-xs)', display: 'block' }}
            >
              <div style={{ fontWeight: 600 }}>CMS Content</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: '2px' }}>Pages &amp; homepage</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Non-negotiable Architecture Notice */}
      <div style={{ padding: 'var(--space-5)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--colour-void)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-halo)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Authoritative Data Policy
          </span>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', lineHeight: 'var(--leading-relaxed)' }}>
          Halo RC operates on a strict single source of truth: all storefront displays, configurator slots, and market offerings are dynamically governed by the PostgreSQL database. Hardcoded product fixtures, client-side price calculations, and unverified AI content generation are prohibited.
        </p>
      </div>
    </div>
  )
}
