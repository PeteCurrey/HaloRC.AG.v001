import Link from 'next/link'
import {
  getSuppliers,
  getSupplierFeeds,
  getSupplierProducts,
  getSupplierMappings,
  getSupplierImportExceptions,
  getSupplierSyncRuns,
} from '@halo-rc/db'

export default async function AdminSuppliersDirectoryPage() {
  const suppliers = await getSuppliers()

  const supplierMetrics = await Promise.all(
    suppliers.map(async (supplier) => {
      const [feeds, products, mappings, exceptions, syncRuns] = await Promise.all([
        getSupplierFeeds(supplier.id),
        getSupplierProducts(supplier.id),
        getSupplierMappings(supplier.id),
        getSupplierImportExceptions(supplier.id, 'OPEN'),
        getSupplierSyncRuns(supplier.id),
      ])

      const activeFeeds = feeds.filter((f) => f.isActive)
      const unmappedCount = mappings.filter((m) => m.status === 'UNMATCHED').length
      const latestRun = syncRuns[0] ?? null
      const hasErrors = latestRun?.status === 'FAILED' || exceptions.length > 0

      return {
        supplier,
        feedsCount: feeds.length,
        activeFeedsCount: activeFeeds.length,
        productsCount: products.length,
        unmappedCount,
        openExceptionsCount: exceptions.length,
        latestRun,
        health: hasErrors ? ('DEGRADED' as const) : ('HEALTHY' as const),
      }
    })
  )

  const totalProducts = supplierMetrics.reduce((sum, m) => sum + m.productsCount, 0)
  const totalExceptions = supplierMetrics.reduce((sum, m) => sum + m.openExceptionsCount, 0)
  const totalUnmapped = supplierMetrics.reduce((sum, m) => sum + m.unmappedCount, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Multi-Supplier Ingestion Framework
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Supplier Catalogue Network
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Central registry of multi-supplier connections, automated feeds, raw product staging, deterministic mappings, and auditable exception queues.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/admin/procurement/import"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo-10)',
              border: '1px solid var(--colour-halo)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-halo)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            Import Feed &rarr;
          </Link>
        </div>
      </div>

      {/* High-Level Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
            Registered Suppliers
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)' }}>
            {suppliers.length}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', marginTop: 'var(--space-1)' }}>
            {suppliers.filter((s) => s.relationshipStatus === 'ACTIVE').length} active partners
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
            Ingested Supplier Records
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)' }}>
            {totalProducts}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
            Across all external feeds
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
            Unmapped SKUs
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: totalUnmapped > 0 ? 'var(--colour-race)' : 'var(--colour-white)' }}>
            {totalUnmapped}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
            Requires canonical mapping
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
            Open Feed Exceptions
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: totalExceptions > 0 ? 'var(--colour-race)' : 'var(--colour-halo)' }}>
            {totalExceptions}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
            Validation &amp; mapping issues
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-slate)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Supplier</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Type / Region</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Feeds (Active / Total)</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Ingested Products</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Sync Health</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Exceptions</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 600 }}>Last Sync</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--colour-off-white)', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {supplierMetrics.map(({ supplier, feedsCount, activeFeedsCount, productsCount, unmappedCount, openExceptionsCount, latestRun, health }) => {
              const formattedSync = supplier.lastSyncAt
                ? new Date(supplier.lastSyncAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
                : 'Never'

              return (
                <tr
                  key={supplier.id}
                  style={{
                    borderBottom: '1px solid var(--colour-slate)',
                    transition: 'background-color 120ms ease',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--colour-white)', fontSize: 'var(--text-sm)' }}>
                      <Link href={`/admin/suppliers/${supplier.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {supplier.name}
                      </Link>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)' }}>
                      {supplier.accountReference || supplier.slug}
                    </div>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ color: 'var(--colour-off-white)' }}>{supplier.supplierType}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)' }}>
                      {supplier.country} &bull; {supplier.currency}
                    </div>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: activeFeedsCount > 0 ? 'var(--colour-halo)' : 'var(--colour-smoke)' }}>
                      {activeFeedsCount}
                    </span>
                    <span style={{ color: 'var(--colour-smoke)' }}> / {feedsCount}</span>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: 'var(--colour-white)' }}>{productsCount} records</div>
                    {unmappedCount > 0 && (
                      <div style={{ color: 'var(--colour-race)', fontSize: '0.6875rem' }}>
                        {unmappedCount} unmapped
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6875rem',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: health === 'HEALTHY' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                        color: health === 'HEALTHY' ? 'var(--colour-halo)' : 'var(--colour-race)',
                        border: `1px solid ${health === 'HEALTHY' ? 'var(--colour-halo)' : 'var(--colour-race)'}`,
                      }}
                    >
                      {health}
                    </span>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    {openExceptionsCount > 0 ? (
                      <span style={{ color: 'var(--colour-race)', fontWeight: 600 }}>
                        {openExceptionsCount} open
                      </span>
                    ) : (
                      <span style={{ color: 'var(--colour-halo)' }}>0</span>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {formattedSync}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/suppliers/${supplier.slug}`}
                      style={{
                        display: 'inline-block',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--colour-graphite)',
                        color: 'var(--colour-off-white)',
                        textDecoration: 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6875rem',
                        border: '1px solid var(--colour-slate)',
                      }}
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
