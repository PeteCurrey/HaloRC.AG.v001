import { notFound } from 'next/navigation'
import {
  getSupplierById,
  getSupplierFeeds,
  getSupplierProducts,
  getSupplierMappings,
  getSupplierImportExceptions,
  getSupplierSyncRuns,
  getSupplierChangeEvents,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminAction,
  AdminTabs,
  AdminEmptyState,
} from '@/components/admin'

interface PageProps {
  params: Promise<{ supplier: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminSupplierDetailPage({ params, searchParams }: PageProps) {
  const { supplier: supplierSlugOrId } = await params
  const { tab: rawTab } = await searchParams
  const activeTab = rawTab || 'overview'

  const supplier = await getSupplierById(supplierSlugOrId)
  if (!supplier) notFound()

  const [feeds, products, mappings, exceptions, syncRuns] = await Promise.all([
    getSupplierFeeds(supplier.id),
    getSupplierProducts(supplier.id),
    getSupplierMappings(supplier.id),
    getSupplierImportExceptions(supplier.id),
    getSupplierSyncRuns(supplier.id),
  ])

  const openExceptions = exceptions.filter((e) => e.resolutionStatus === 'OPEN')
  const unmappedMappings = mappings.filter((m) => m.status === 'UNMATCHED')
  const matchedMappings = mappings.filter((m) => m.status === 'MATCHED')

  const tabs = [
    { id: 'overview', label: 'Overview', href: `/admin/suppliers/${supplier.slug}?tab=overview` },
    { id: 'feeds', label: `Feeds (${feeds.length})`, href: `/admin/suppliers/${supplier.slug}?tab=feeds` },
    { id: 'products', label: `Products (${products.length})`, href: `/admin/suppliers/${supplier.slug}?tab=products` },
    { id: 'mapping', label: `Mapping (${unmappedMappings.length} unmapped)`, href: `/admin/suppliers/${supplier.slug}?tab=mapping` },
    { id: 'exceptions', label: `Exceptions (${openExceptions.length})`, href: `/admin/suppliers/${supplier.slug}?tab=exceptions`, badge: openExceptions.length > 0 ? String(openExceptions.length) : undefined },
    { id: 'history', label: `Sync History (${syncRuns.length})`, href: `/admin/suppliers/${supplier.slug}?tab=history` },
  ]

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Supplier Directory', href: '/admin/suppliers' },
          { label: supplier.name },
        ]}
        title={supplier.name}
        description={`Account: ${supplier.accountReference || 'None'} · ${supplier.country} · ${supplier.currency} · ${supplier.integrationType}`}
        status={<AdminStatus status={supplier.relationshipStatus === 'ACTIVE' ? 'active' : 'inactive'} label={supplier.relationshipStatus} />}
        actions={
          <AdminAction href="/admin/procurement/import" variant="primary">
            Trigger Import →
          </AdminAction>
        }
      />

      <AdminSection>
        <AdminTabs
          tabs={tabs}
          activeId={activeTab}
        />
      </AdminSection>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <AdminSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <AdminPanel padding="md">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Configured Feeds
              </span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#111317', display: 'block', marginBottom: 4 }}>
                {feeds.length}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: '#B8935A' }}>
                {feeds.filter((f) => f.isActive).length} active schedules
              </span>
            </AdminPanel>

            <AdminPanel padding="md">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Product Mapping Rate
              </span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#111317', display: 'block', marginBottom: 4 }}>
                {products.length > 0 ? Math.round((matchedMappings.length / products.length) * 100) : 0}%
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: '#767A85' }}>
                {matchedMappings.length} of {products.length} mapped to master
              </span>
            </AdminPanel>

            <AdminPanel padding="md">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Open Exceptions
              </span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: openExceptions.length > 0 ? '#C8001A' : '#111317', display: 'block', marginBottom: 4 }}>
                {openExceptions.length}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: '#767A85' }}>
                Requires cataloguer review
              </span>
            </AdminPanel>
          </div>

          <AdminPanel title="Connection & Supplier Profile" padding="lg">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: '#767A85' }}>Legal Entity:</span>
                <div style={{ color: '#111317', fontWeight: 600, marginTop: 2 }}>{supplier.legalName || supplier.name}</div>
              </div>
              <div>
                <span style={{ color: '#767A85' }}>Official Website:</span>
                <div style={{ marginTop: 2 }}>
                  {supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: '#B8935A' }}>
                      {supplier.website}
                    </a>
                  ) : (
                    <span style={{ color: '#767A85' }}>None listed</span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ color: '#767A85' }}>Order / Trade Email:</span>
                <div style={{ color: '#111317', marginTop: 2 }}>{supplier.contactEmail || 'None'}</div>
              </div>
              <div>
                <span style={{ color: '#767A85' }}>VAT / Tax ID:</span>
                <div style={{ color: '#111317', marginTop: 2 }}>{supplier.vatStatus || 'Unregistered / Exempt'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#767A85' }}>Operational Notes:</span>
                <p style={{ color: '#494D55', marginTop: 2, lineHeight: 'var(--leading-relaxed)', marginBottom: 0 }}>
                  {supplier.notes || 'No supplier notes recorded.'}
                </p>
              </div>
            </div>
          </AdminPanel>
        </AdminSection>
      )}

      {/* TAB 2: FEEDS */}
      {activeTab === 'feeds' && (
        <AdminSection>
          <AdminPanel title={`Configured Ingestion Feeds (${feeds.length})`} padding="none">
            {feeds.length === 0 ? (
              <div style={{ padding: 32 }}>
                <AdminEmptyState title="No feeds configured" description="No automated feeds configured yet for this supplier." />
              </div>
            ) : (
              <AdminTable columns={['Feed Name', 'Type', 'Format', 'Schedule', 'Auth', 'Status', 'Last Run']}>
                {feeds.map((feed) => (
                  <AdminTableRow key={feed.id} cells={[
                    <div key="name">
                      <div style={{ fontWeight: 600, color: '#111317' }}>{feed.feedName}</div>
                      {feed.sourceUrl && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85' }}>{feed.sourceUrl}</div>
                      )}
                    </div>,
                    <span key="type" style={{ color: '#494D55' }}>{feed.feedType}</span>,
                    <span key="fmt" style={{ fontFamily: 'var(--font-mono)' }}>{feed.format}</span>,
                    <span key="sched" style={{ fontFamily: 'var(--font-mono)' }}>{feed.scheduleCron || 'Manual'}</span>,
                    <span key="auth" style={{ fontFamily: 'var(--font-mono)' }}>{feed.authType}</span>,
                    <AdminStatus key="status" status={feed.isActive ? 'active' : 'inactive'} />,
                    <span key="last" style={{ fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.6875rem' }}>
                      {feed.lastSuccessfulRun ? new Date(feed.lastSuccessfulRun).toLocaleDateString('en-GB') : 'Never'}
                    </span>,
                  ]} />
                ))}
              </AdminTable>
            )}
          </AdminPanel>
        </AdminSection>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === 'products' && (
        <AdminSection>
          <AdminPanel
            title={`Raw Ingested Supplier Catalogue (${products.length} items)`}
            subtitle="Separate staging records preserving exact source provenance without overwriting canonical Avorria editorial content."
            padding="none"
          >
            <AdminTable columns={['Supplier SKU', 'Product Name', 'Brand / Category', 'Wholesale Cost', 'Supplier Stock', 'Availability', 'Status']}>
              {products.map((p) => (
                <AdminTableRow key={p.id} cells={[
                  <span key="sku" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{p.supplierSku}</span>,
                  <span key="name" style={{ color: '#494D55' }}>{p.supplierProductName}</span>,
                  <span key="brand" style={{ color: '#767A85' }}>{p.supplierBrand || 'Unknown'}{p.supplierCategory ? ` (${p.supplierCategory})` : ''}</span>,
                  <span key="cost" style={{ fontFamily: 'var(--font-mono)', color: '#B8935A' }}>{p.currency} {(p.rawCostMinorUnits / 100).toFixed(2)}</span>,
                  <span key="stock" style={{ fontFamily: 'var(--font-mono)' }}>{p.rawStockQuantity !== null ? `${p.rawStockQuantity} units` : 'Unknown'}</span>,
                  <span key="avail" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: p.rawAvailability === 'IN_STOCK' ? '#1A6E34' : '#767A85' }}>{p.rawAvailability}</span>,
                  <span key="status" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '2px 6px', borderRadius: 2, backgroundColor: p.isDiscontinued ? 'rgba(200,0,26,0.08)' : '#EFEFED', color: p.isDiscontinued ? '#C8001A' : '#494D55' }}>{p.importStatus}</span>,
                ]} />
              ))}
            </AdminTable>
          </AdminPanel>
        </AdminSection>
      )}

      {/* TAB 4: MAPPING */}
      {activeTab === 'mapping' && (
        <AdminSection>
          <AdminPanel
            title={`Deterministic Mapping Registry (${mappings.length} mappings)`}
            subtitle="Maps external supplier SKUs to internal canonical Avorria products and variants with verified confidence."
            padding="none"
          >
            <AdminTable columns={['Supplier SKU', 'Canonical Product', 'Match Method', 'Confidence', 'Status']}>
              {mappings.map((m) => (
                <AdminTableRow key={m.id} cells={[
                  <span key="sku" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{m.supplierSku}</span>,
                  <div key="prod">
                    {m.canonicalProductName ? (
                      <>
                        <strong style={{ color: '#111317' }}>{m.canonicalProductName}</strong>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#B8935A' }}>{m.canonicalProductSku}</div>
                      </>
                    ) : (
                      <span style={{ color: '#C8001A' }}>Unmapped (No canonical product)</span>
                    )}
                  </div>,
                  <span key="method" style={{ fontFamily: 'var(--font-mono)' }}>{m.matchMethod || 'NONE'}</span>,
                  <span key="conf" style={{ fontFamily: 'var(--font-mono)', color: m.matchConfidenceCategory === 'EXACT_MATCH' ? '#B8935A' : '#767A85' }}>{m.matchConfidenceCategory}</span>,
                  <AdminStatus key="status" status={m.status === 'MATCHED' ? 'verified' : 'warning'} label={m.status} />,
                ]} />
              ))}
            </AdminTable>
          </AdminPanel>
        </AdminSection>
      )}

      {/* TAB 5: EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <AdminSection>
          <AdminPanel
            title={`Exception & Validation Queue (${exceptions.length} total)`}
            subtitle="Structured ingestion errors (missing SKU, price out of bounds, unmapped items, duplicate SKUs)."
            padding="none"
          >
            {exceptions.length === 0 ? (
              <div style={{ padding: 32 }}>
                <AdminEmptyState title="Clean feed!" description="No validation exceptions or quarantined records." />
              </div>
            ) : (
              <AdminTable columns={['SKU', 'Exception Code', 'Severity', 'Message', 'Status']}>
                {exceptions.map((ex) => (
                  <AdminTableRow key={ex.id} cells={[
                    <span key="sku" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{ex.supplierSku || 'N/A'}</span>,
                    <span key="code" style={{ fontFamily: 'var(--font-mono)' }}>{ex.exceptionCode}</span>,
                    <AdminStatus key="sev" status={ex.severity === 'CRITICAL' || ex.severity === 'ERROR' ? 'alert' : 'warning'} label={ex.severity} />,
                    <span key="msg" style={{ color: '#494D55' }}>{ex.message}</span>,
                    <AdminStatus key="res" status={ex.resolutionStatus === 'OPEN' ? 'alert' : 'verified'} label={ex.resolutionStatus} />,
                  ]} />
                ))}
              </AdminTable>
            )}
          </AdminPanel>
        </AdminSection>
      )}

      {/* TAB 6: SYNC HISTORY */}
      {activeTab === 'history' && (
        <AdminSection>
          <AdminPanel title={`Import Run Ledger (${syncRuns.length} executions)`} padding="none">
            {syncRuns.length === 0 ? (
              <div style={{ padding: 32 }}>
                <AdminEmptyState title="No sync runs" description="No sync runs recorded yet." />
              </div>
            ) : (
              <AdminTable columns={['Run ID', 'Timestamp', 'Status', 'Received', 'Processed', 'Matched', 'Changed', 'Rejected']}>
                {syncRuns.map((run) => (
                  <AdminTableRow key={run.runId} cells={[
                    <span key="id" style={{ fontFamily: 'var(--font-mono)', color: '#B8935A', fontSize: '0.6875rem' }}>{run.runId}</span>,
                    <span key="ts" style={{ fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.6875rem' }}>{new Date(run.startedAt).toLocaleString('en-GB')}</span>,
                    <AdminStatus key="status" status={run.status === 'COMPLETED' ? 'verified' : 'alert'} label={run.status} />,
                    <span key="recv" style={{ fontFamily: 'var(--font-mono)' }}>{run.recordsReceived}</span>,
                    <span key="proc" style={{ fontFamily: 'var(--font-mono)' }}>{run.recordsProcessed}</span>,
                    <span key="matched" style={{ fontFamily: 'var(--font-mono)', color: '#1A6E34' }}>{run.recordsMatched}</span>,
                    <span key="changed" style={{ fontFamily: 'var(--font-mono)', color: '#B8935A' }}>{run.recordsChanged}</span>,
                    <span key="rej" style={{ fontFamily: 'var(--font-mono)' }}>{run.recordsRejected}</span>,
                  ]} />
                ))}
              </AdminTable>
            )}
          </AdminPanel>
        </AdminSection>
      )}
    </>
  )
}
