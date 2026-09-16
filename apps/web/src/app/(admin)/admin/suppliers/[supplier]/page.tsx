import Link from 'next/link'
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

  const [feeds, products, mappings, exceptions, syncRuns, changeEvents] = await Promise.all([
    getSupplierFeeds(supplier.id),
    getSupplierProducts(supplier.id),
    getSupplierMappings(supplier.id),
    getSupplierImportExceptions(supplier.id),
    getSupplierSyncRuns(supplier.id),
    getSupplierChangeEvents(supplier.id, 25),
  ])

  const openExceptions = exceptions.filter((e) => e.resolutionStatus === 'OPEN')
  const unmappedMappings = mappings.filter((m) => m.status === 'UNMATCHED')
  const matchedMappings = mappings.filter((m) => m.status === 'MATCHED')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'feeds', label: `Feeds (${feeds.length})` },
    { id: 'products', label: `Products Ingested (${products.length})` },
    { id: 'mapping', label: `Mapping (${unmappedMappings.length} unmapped)` },
    { id: 'exceptions', label: `Exceptions (${openExceptions.length})`, badge: openExceptions.length > 0 ? String(openExceptions.length) : undefined },
    { id: 'history', label: `Sync History (${syncRuns.length})` },
  ]

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/suppliers" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          &larr; Supplier Directory
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-halo)' }}>{supplier.name}</span>
      </div>

      {/* Supplier Profile Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              {supplier.name}
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                padding: '2px 8px',
                borderRadius: '2px',
                backgroundColor: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                color: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)',
                border: `1px solid ${supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)'}`,
              }}
            >
              {supplier.relationshipStatus}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            <span>Account: <strong style={{ color: 'var(--colour-white)' }}>{supplier.accountReference || 'None'}</strong></span>
            <span>&bull;</span>
            <span>Country: <strong style={{ color: 'var(--colour-white)' }}>{supplier.country}</strong></span>
            <span>&bull;</span>
            <span>Currency: <strong style={{ color: 'var(--colour-white)' }}>{supplier.currency}</strong></span>
            <span>&bull;</span>
            <span>Integration: <strong style={{ color: 'var(--colour-white)' }}>{supplier.integrationType}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/admin/procurement/import"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo)',
              color: 'var(--colour-charcoal)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Trigger Import &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--colour-slate)', marginBottom: 'var(--space-6)', gap: 'var(--space-2)' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`/admin/suppliers/${supplier.slug}?tab=${tab.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: isActive ? '2px solid var(--colour-halo)' : '2px solid transparent',
                color: isActive ? 'var(--colour-white)' : 'var(--colour-ash)',
                textDecoration: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{ padding: '1px 5px', borderRadius: '10px', fontSize: '0.625rem', backgroundColor: 'var(--colour-race)', color: 'var(--colour-white)' }}>
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                Configured Feeds
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)' }}>
                {feeds.length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', marginTop: 'var(--space-1)' }}>
                {feeds.filter((f) => f.isActive).length} active schedules
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                Product Mapping Rate
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)' }}>
                {products.length > 0 ? Math.round((matchedMappings.length / products.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
                {matchedMappings.length} of {products.length} mapped to master
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                Open Exceptions
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: openExceptions.length > 0 ? 'var(--colour-race)' : 'var(--colour-halo)' }}>
                {openExceptions.length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
                Requires cataloguer review
              </div>
            </div>
          </div>

          {/* Supplier Details Card */}
          <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-4)' }}>
              Connection &amp; Supplier Profile
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--colour-ash)' }}>Legal Entity:</span>
                <div style={{ color: 'var(--colour-white)', fontWeight: 600, marginTop: '2px' }}>{supplier.legalName || supplier.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)' }}>Official Website:</span>
                <div style={{ marginTop: '2px' }}>
                  {supplier.website ? (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colour-halo)' }}>
                      {supplier.website}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--colour-smoke)' }}>None listed</span>
                  )}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)' }}>Order / Trade Email:</span>
                <div style={{ color: 'var(--colour-white)', marginTop: '2px' }}>{supplier.contactEmail || 'None'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)' }}>VAT / Tax ID:</span>
                <div style={{ color: 'var(--colour-white)', marginTop: '2px' }}>{supplier.vatStatus || 'Unregistered / Exempt'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--colour-ash)' }}>Operational Notes:</span>
                <p style={{ color: 'var(--colour-off-white)', marginTop: '2px', lineHeight: 'var(--leading-relaxed)' }}>
                  {supplier.notes || 'No supplier notes recorded.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEEDS */}
      {activeTab === 'feeds' && (
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-slate)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Configured Ingestion Feeds
            </h2>
          </div>
          {feeds.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
              No automated feeds configured yet for this supplier.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--colour-graphite)', borderBottom: '1px solid var(--colour-slate)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Feed Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Type</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Format</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Schedule</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Auth</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr key={feed.id} style={{ borderBottom: '1px solid var(--colour-slate)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--colour-white)' }}>
                      {feed.feedName}
                      {feed.sourceUrl && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                          {feed.sourceUrl}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>{feed.feedType}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{feed.format}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{feed.scheduleCron || 'Manual'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{feed.authType}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '2px', backgroundColor: feed.isActive ? 'var(--colour-halo-10)' : 'var(--colour-steel)', color: feed.isActive ? 'var(--colour-halo)' : 'var(--colour-ash)' }}>
                        {feed.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                      {feed.lastSuccessfulRun ? new Date(feed.lastSuccessfulRun).toLocaleDateString('en-GB') : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === 'products' && (
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-slate)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Raw Ingested Supplier Catalogue ({products.length} items)
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', margin: '4px 0 0 0' }}>
              Separate staging records preserving exact source provenance without overwriting canonical Avorria editorial content.
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--colour-graphite)', borderBottom: '1px solid var(--colour-slate)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Supplier SKU</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Product Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Brand / Category</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Wholesale Cost</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Supplier Stock</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Availability</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--colour-slate)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {p.supplierSku}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>{p.supplierProductName}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-ash)' }}>
                    {p.supplierBrand || 'Unknown'} {p.supplierCategory ? `(${p.supplierCategory})` : ''}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-halo)' }}>
                    {p.currency} {(p.rawCostMinorUnits / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    {p.rawStockQuantity !== null ? `${p.rawStockQuantity} units` : 'Unknown'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: p.rawAvailability === 'IN_STOCK' ? 'var(--colour-halo)' : 'var(--colour-smoke)' }}>
                      {p.rawAvailability}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '0.625rem', backgroundColor: p.isDiscontinued ? 'var(--colour-race-10)' : 'var(--colour-slate)', color: p.isDiscontinued ? 'var(--colour-race)' : 'var(--colour-off-white)' }}>
                      {p.importStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: MAPPING */}
      {activeTab === 'mapping' && (
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-slate)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Deterministic Mapping Registry ({mappings.length} mappings)
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', margin: '4px 0 0 0' }}>
              Maps external supplier SKUs to internal canonical Avorria products and variants with verified confidence.
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--colour-graphite)', borderBottom: '1px solid var(--colour-slate)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Supplier SKU</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Canonical Product</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Match Method</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Confidence</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--colour-slate)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {m.supplierSku}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>
                    {m.canonicalProductName ? (
                      <div>
                        <strong>{m.canonicalProductName}</strong>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)' }}>
                          {m.canonicalProductSku}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--colour-race)' }}>Unmapped (No canonical product)</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    {m.matchMethod || 'NONE'}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: m.matchConfidenceCategory === 'EXACT_MATCH' ? 'var(--colour-halo)' : 'var(--colour-smoke)' }}>
                      {m.matchConfidenceCategory}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '0.625rem', backgroundColor: m.status === 'MATCHED' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)', color: m.status === 'MATCHED' ? 'var(--colour-halo)' : 'var(--colour-race)' }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-slate)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Exception &amp; Validation Queue ({exceptions.length} total)
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', margin: '4px 0 0 0' }}>
              Structured ingestion errors (missing SKU, price out of bounds, unmapped items, duplicate SKUs).
            </p>
          </div>
          {exceptions.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-halo)' }}>
              &check; Clean feed! No validation exceptions or quarantined records.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--colour-graphite)', borderBottom: '1px solid var(--colour-slate)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>SKU</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Exception Code</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Severity</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Message</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex) => (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--colour-slate)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--colour-white)' }}>
                      {ex.supplierSku || 'N/A'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{ex.exceptionCode}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '0.625rem', backgroundColor: ex.severity === 'CRITICAL' || ex.severity === 'ERROR' ? 'var(--colour-race-10)' : 'var(--colour-steel)', color: ex.severity === 'CRITICAL' || ex.severity === 'ERROR' ? 'var(--colour-race)' : 'var(--colour-off-white)' }}>
                        {ex.severity}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>{ex.message}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '0.625rem', backgroundColor: ex.resolutionStatus === 'OPEN' ? 'var(--colour-race-10)' : 'var(--colour-halo-10)', color: ex.resolutionStatus === 'OPEN' ? 'var(--colour-race)' : 'var(--colour-halo)' }}>
                        {ex.resolutionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 6: SYNC HISTORY */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: 'var(--colour-charcoal)', border: '1px solid var(--colour-slate)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-slate)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Import Run Ledger ({syncRuns.length} executions)
            </h2>
          </div>
          {syncRuns.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
              No sync runs recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--colour-graphite)', borderBottom: '1px solid var(--colour-slate)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Run ID</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Timestamp</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Received</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Processed</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Matched</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Changed</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {syncRuns.map((run) => (
                  <tr key={run.runId} style={{ borderBottom: '1px solid var(--colour-slate)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-halo)' }}>
                      {run.runId}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                      {new Date(run.startedAt).toLocaleString('en-GB')}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '0.625rem', backgroundColor: run.status === 'COMPLETED' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)', color: run.status === 'COMPLETED' ? 'var(--colour-halo)' : 'var(--colour-race)' }}>
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{run.recordsReceived}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{run.recordsProcessed}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-halo)' }}>{run.recordsMatched}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-race)' }}>{run.recordsChanged}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)' }}>{run.recordsRejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
