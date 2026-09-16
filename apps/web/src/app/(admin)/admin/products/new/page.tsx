import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminBrands, getAdminCategories } from '@halo-rc/db'
import { createProductAction } from '@/actions/admin'

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

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/products" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          Products
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>New Product</span>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-2)' }}>
        Create Authoritative Product
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-8)' }}>
        New products are created in DRAFT status. They are strictly isolated and not visible on the customer-facing storefront until verified and published.
      </p>

      <form
        action={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          backgroundColor: 'var(--colour-carbon)',
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
        }}
      >
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. XRAY X4 2026 Competition 1/10 Touring Car"
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </div>

        {/* Brand & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Brand Partner *
            </label>
            <select
              name="brandId"
              required
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="">Select Brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.countryOfOrigin})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Primary Category
            </label>
            <select
              name="categoryId"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
              }}
            >
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Halo SKU
            </label>
            <input
              type="text"
              name="sku"
              placeholder="e.g. HALO-XR-X426"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Manufacturer Part #
            </label>
            <input
              type="text"
              name="manufacturerSku"
              placeholder="e.g. 300034"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Internal Code
            </label>
            <input
              type="text"
              name="internalCode"
              placeholder="e.g. TC-XRAY-01"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        </div>

        {/* Tier & Product Type & Discipline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Catalogue Tier
            </label>
            <select
              name="tier"
              defaultValue="STANDARD"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="HALO">Halo (Flagship)</option>
              <option value="COLLECTOR">Collector</option>
              <option value="SPECIAL_ORDER">Special Order</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Product Type
            </label>
            <select
              name="productType"
              defaultValue="VEHICLE"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="VEHICLE">Complete Vehicle / Kit</option>
              <option value="PART">Spare Part / Upgrade</option>
              <option value="ELECTRONICS">Electronics / Power</option>
              <option value="ACCESSORY">Accessory / Tool</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Discipline
            </label>
            <select
              name="discipline"
              defaultValue="RACE"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontSize: 'var(--text-sm)',
              }}
            >
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
          <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Editorial Summary
          </label>
          <textarea
            name="editorialSummary"
            rows={3}
            placeholder="Concise technical overview of the machine's design and championship provenance..."
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
          <Link
            href="/admin/products"
            style={{
              padding: 'var(--space-3) var(--space-5)',
              backgroundColor: 'transparent',
              border: '1px solid var(--colour-steel)',
              color: 'var(--colour-ash)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            style={{
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--colour-halo)',
              border: 'none',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save as Draft &rarr;
          </button>
        </div>
      </form>
    </div>
  )
}
