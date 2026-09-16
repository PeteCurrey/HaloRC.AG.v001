import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminBrands, getAdminCategories } from '@halo-rc/db'
import { createProductAction } from '@/actions/admin'
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getAdminBrands(),
    getAdminCategories(),
  ])

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createProductAction(formData)
    if (result.success && result.id) {
      redirect(`/admin/products/${result.id}/edit`)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '0 10px',
    backgroundColor: 'var(--admin-surface, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E2DE)',
    borderRadius: 'var(--admin-radius-sm, 3px)',
    color: 'var(--admin-text-primary, #111317)',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'var(--admin-surface, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E2DE)',
    borderRadius: 'var(--admin-radius-sm, 3px)',
    color: 'var(--admin-text-primary, #111317)',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.6875rem',
    color: 'var(--admin-text-tertiary, #767A85)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    fontWeight: 600,
  }

  const monoInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: 'var(--font-mono, monospace)',
  }

  return (
    <div style={{ width: '100%', maxWidth: '840px' }}>
      {/* Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Catalogue', href: '/admin/products' },
          { label: 'Products', href: '/admin/products' },
          { label: 'New Product' },
        ]}
        title="Create Authoritative Product"
        description="New products are initialized in DRAFT status and quarantined from public storefront views until verified."
      />

      <AdminPanel padding="lg">
        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. XRAY X4 2026 Competition 1/10 Touring Car"
              style={inputStyle}
            />
          </div>

          {/* Brand & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Brand Partner *</label>
              <select name="brandId" required style={inputStyle}>
                <option value="">Select Brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.countryOfOrigin})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Primary Category</label>
              <select name="categoryId" style={inputStyle}>
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Identifiers: SKU, Manufacturer SKU, Internal Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Avorria SKU</label>
              <input
                type="text"
                name="sku"
                placeholder="AV-XR-X426"
                style={monoInputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Manufacturer Part #</label>
              <input
                type="text"
                name="manufacturerSku"
                placeholder="300034"
                style={monoInputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Internal Code</label>
              <input
                type="text"
                name="internalCode"
                placeholder="TC-XRAY-01"
                style={monoInputStyle}
              />
            </div>
          </div>

          {/* Tier & Product Type & Discipline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Catalogue Tier</label>
              <select name="tier" defaultValue="STANDARD" style={inputStyle}>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="HALO">Halo (Flagship)</option>
                <option value="COLLECTOR">Collector</option>
                <option value="SPECIAL_ORDER">Special Order</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Product Type</label>
              <select name="productType" defaultValue="VEHICLE" style={inputStyle}>
                <option value="VEHICLE">Complete Vehicle / Kit</option>
                <option value="PART">Spare Part / Upgrade</option>
                <option value="ELECTRONICS">Electronics / Power</option>
                <option value="ACCESSORY">Accessory / Tool</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Discipline</label>
              <select name="discipline" defaultValue="RACE" style={inputStyle}>
                <option value="RACE">Race (Circuit)</option>
                <option value="BASH">Bash (Extreme)</option>
                <option value="DRIFT">Drift</option>
                <option value="CRAWL">Crawl / Trail</option>
                <option value="SCALE">Scale Realism</option>
                <option value="LARGE_SCALE">Large Scale (1:5)</option>
              </select>
            </div>
          </div>

          {/* Editorial Summary */}
          <div>
            <label style={labelStyle}>Editorial Summary</label>
            <textarea
              name="editorialSummary"
              rows={3}
              placeholder="Concise technical overview of the machine's design and championship provenance..."
              style={textareaStyle}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid var(--admin-border-subtle, #EBEBE7)',
              marginTop: '8px',
            }}
          >
            <AdminAction variant="subtle" size="sm" href="/admin/products">
              Cancel
            </AdminAction>
            <AdminAction type="submit" variant="primary" size="sm">
              Save as Draft &rarr;
            </AdminAction>
          </div>
        </form>
      </AdminPanel>
    </div>
  )
}
