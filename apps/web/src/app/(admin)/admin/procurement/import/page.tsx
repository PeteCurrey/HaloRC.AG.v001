import Link from 'next/link'
import { getSuppliers } from '@halo-rc/db'
import { importSupplierCsvFeedAction } from '@/actions/procurement'

export default async function SupplierCsvImportPage() {
  const suppliers = await getSuppliers()

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/procurement" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          ← Back to Procurement
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-halo)' }}>Ingest CSV Feed</span>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
          Supplier CSV Feed Ingestion
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
          Upload or paste raw supplier CSV exports. The ingestion engine deterministically extracts SKUs, normalizes currencies, runs product matching, and isolates supplier costs without publishing raw feeds automatically.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Upload Form */}
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <form
            action={async (formData: FormData) => {
              'use server'
              const supplierId = String(formData.get('supplierId') || '')
              const csvContent = String(formData.get('csvContent') || '')
              if (!supplierId || !csvContent.trim()) return

              await importSupplierCsvFeedAction(supplierId, csvContent)
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Target Supplier
              </label>
              <select
                name="supplierId"
                required
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--colour-void)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.country} • {s.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Paste CSV Data
              </label>
              <textarea
                name="csvContent"
                required
                rows={12}
                placeholder="sku,manufacturer_sku,title,brand,cost,rrp,availability,quantity&#10;XRAY-300040,XRAY-300040,XRAY X4 26 Kit,XRAY,495.00,729.00,in stock,15"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--colour-void)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: 'var(--space-3) var(--space-6)',
                backgroundColor: 'var(--colour-halo)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-void)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                alignSelf: 'flex-start',
              }}
            >
              Parse &amp; Ingest Feed
            </button>
          </form>
        </div>

        {/* Guidelines / Format Specs */}
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
            CSV Format Guidelines
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
            The ingestion pipeline parses standard CSV headers case-insensitively. Unrecognized columns are preserved in the raw payload for audit debugging without blocking matching.
          </p>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-silver)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div><strong style={{ color: 'var(--colour-white)' }}>sku / supplier_sku:</strong> Mandatory supplier SKU identifier.</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>manufacturer_sku:</strong> Factory SKU used for tier-1 deterministic matching.</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>title / name:</strong> Product title as declared in supplier inventory.</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>cost / wholesale_price:</strong> Decimal wholesale price (e.g. 495.00).</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>rrp / retail_price:</strong> Optional manufacturer suggested retail price.</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>availability / stock:</strong> &quot;in stock&quot;, &quot;low stock&quot;, &quot;pre-order&quot;, &quot;out of stock&quot;.</div>
            <div><strong style={{ color: 'var(--colour-white)' }}>lead_time_days:</strong> Number of business days before dispatch.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
