import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminAction,
} from '@/components/admin'
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
    <>
      <AdminPageHeader
        category="Multi-Supplier Ingestion Framework"
        title="Supplier Catalogue Network"
        description="Central registry of multi-supplier connections, automated feeds, raw product staging, deterministic mappings, and auditable exception queues."
        actions={
          <AdminAction href="/admin/procurement/import" variant="secondary">
            Import Feed →
          </AdminAction>
        }
      />

      {/* Metrics Strip */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Registered Suppliers', value: suppliers.length, sub: `${suppliers.filter((s) => s.relationshipStatus === 'ACTIVE').length} active partners`, alert: false },
            { label: 'Ingested Supplier Records', value: totalProducts, sub: 'Across all external feeds', alert: false },
            { label: 'Unmapped SKUs', value: totalUnmapped, sub: 'Requires canonical mapping', alert: totalUnmapped > 0 },
            { label: 'Open Feed Exceptions', value: totalExceptions, sub: 'Validation & mapping issues', alert: totalExceptions > 0 },
          ].map((m) => (
            <AdminPanel key={m.label} padding="md">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                {m.label}
              </span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: m.alert ? '#C8001A' : '#111317', display: 'block', marginBottom: 4 }}>
                {m.value}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: '#767A85' }}>{m.sub}</span>
            </AdminPanel>
          ))}
        </div>

        <AdminPanel title="Supplier Directory" padding="none">
          <AdminTable columns={['Supplier', 'Type / Region', 'Feeds (Active / Total)', 'Ingested Products', 'Sync Health', 'Exceptions', 'Last Sync', 'Actions']}>
            {supplierMetrics.map(({ supplier, feedsCount, activeFeedsCount, productsCount, unmappedCount, openExceptionsCount, latestRun, health }) => {
              const formattedSync = supplier.lastSyncAt
                ? new Date(supplier.lastSyncAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
                : 'Never'

              return (
                <AdminTableRow key={supplier.id} cells={[
                  <div key="name">
                    <AdminAction href={`/admin/suppliers/${supplier.slug}`} variant="ghost">
                      {supplier.name}
                    </AdminAction>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85' }}>
                      {supplier.accountReference || supplier.slug}
                    </div>
                  </div>,

                  <div key="type">
                    <div style={{ color: '#494D55' }}>{supplier.supplierType}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85' }}>
                      {supplier.country} · {supplier.currency}
                    </div>
                  </div>,

                  <span key="feeds" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: activeFeedsCount > 0 ? '#B8935A' : '#767A85' }}>{activeFeedsCount}</span>
                    <span style={{ color: '#767A85' }}> / {feedsCount}</span>
                  </span>,

                  <div key="products" style={{ fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: '#111317' }}>{productsCount} records</div>
                    {unmappedCount > 0 && (
                      <div style={{ color: '#C8001A', fontSize: '0.6875rem' }}>{unmappedCount} unmapped</div>
                    )}
                  </div>,

                  <AdminStatus key="health" status={health === 'HEALTHY' ? 'verified' : 'alert'} label={health} />,

                  <span key="exceptions" style={{ fontFamily: 'var(--font-mono)' }}>
                    {openExceptionsCount > 0 ? (
                      <span style={{ color: '#C8001A', fontWeight: 600 }}>{openExceptionsCount} open</span>
                    ) : (
                      <span style={{ color: '#1A6E34' }}>0</span>
                    )}
                  </span>,

                  <span key="sync" style={{ fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.6875rem' }}>
                    {formattedSync}
                  </span>,

                  <AdminAction key="manage" href={`/admin/suppliers/${supplier.slug}`} variant="secondary">
                    Manage →
                  </AdminAction>,
                ]} />
              )
            })}
          </AdminTable>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
