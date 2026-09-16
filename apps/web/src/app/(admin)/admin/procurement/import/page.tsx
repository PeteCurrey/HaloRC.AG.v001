import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
} from '@/components/admin'
import { getSuppliers } from '@halo-rc/db'
import { importSupplierCsvFeedAction } from '@/actions/procurement'

export default async function SupplierCsvImportPage() {
  const suppliers = await getSuppliers()

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Procurement', href: '/admin/procurement' },
          { label: 'Ingest CSV Feed' },
        ]}
        category="Multi-Supplier Ingestion"
        title="Supplier CSV Feed Ingestion"
        description="Upload or paste raw supplier CSV exports. The ingestion engine deterministically extracts SKUs, normalizes currencies, runs product matching, and isolates supplier costs without publishing raw feeds automatically."
      />

      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          {/* Upload Form */}
          <AdminPanel title="CSV Payload Ingestion" padding="lg">
            <form
              action={async (formData: FormData) => {
                'use server'
                const supplierId = String(formData.get('supplierId') || '')
                const csvContent = String(formData.get('csvContent') || '')
                if (!supplierId || !csvContent.trim()) return

                await importSupplierCsvFeedAction(supplierId, csvContent)
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', marginBottom: 6 }}>
                  Target Supplier
                </label>
                <select
                  name="supplierId"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--admin-surface, #FFFFFF)',
                    border: '1px solid var(--admin-border, #E2E2DE)',
                    borderRadius: 'var(--admin-radius-sm, 3px)',
                    color: 'var(--admin-text-primary, #111317)',
                    fontSize: '0.75rem',
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
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', marginBottom: 6 }}>
                  Paste CSV Data
                </label>
                <textarea
                  name="csvContent"
                  required
                  rows={12}
                  placeholder="sku,manufacturer_sku,title,brand,cost,rrp,availability,quantity&#10;XRAY-300040,XRAY-300040,XRAY X4 26 Kit,XRAY,495.00,729.00,in stock,15"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--admin-surface, #FFFFFF)',
                    border: '1px solid var(--admin-border, #E2E2DE)',
                    borderRadius: 'var(--admin-radius-sm, 3px)',
                    color: 'var(--admin-text-primary, #111317)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#111317',
                  border: 'none',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.6875rem',
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
          </AdminPanel>

          {/* Guidelines / Format Specs */}
          <AdminPanel title="CSV Format Guidelines" padding="lg">
            <p style={{ fontSize: '0.75rem', color: '#494D55', lineHeight: 'var(--leading-relaxed)', margin: '0 0 16px 0' }}>
              The ingestion pipeline parses standard CSV headers case-insensitively. Unrecognized columns are preserved in the raw payload for audit debugging without blocking matching.
            </p>

            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#494D55', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><strong style={{ color: '#111317' }}>sku / supplier_sku:</strong> Mandatory supplier SKU identifier.</div>
              <div><strong style={{ color: '#111317' }}>manufacturer_sku:</strong> Factory SKU used for tier-1 deterministic matching.</div>
              <div><strong style={{ color: '#111317' }}>title / name:</strong> Product title as declared in supplier inventory.</div>
              <div><strong style={{ color: '#111317' }}>cost / wholesale_price:</strong> Decimal wholesale price (e.g. 495.00).</div>
              <div><strong style={{ color: '#111317' }}>rrp / retail_price:</strong> Optional manufacturer suggested retail price.</div>
              <div><strong style={{ color: '#111317' }}>availability / stock:</strong> &quot;in stock&quot;, &quot;low stock&quot;, &quot;pre-order&quot;, &quot;out of stock&quot;.</div>
              <div><strong style={{ color: '#111317' }}>lead_time_days:</strong> Number of business days before dispatch.</div>
            </div>
          </AdminPanel>
        </div>
      </AdminSection>
    </>
  )
}
