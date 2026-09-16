import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getAdminProduct,
  getProductContent,
  getProductSeo,
  getAdminBrands,
  getAdminCategories,
} from '@halo-rc/db'
import { updateProductAction, publishProductAction, unpublishProductAction } from '@/actions/admin'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = 'core' } = await searchParams

  const [product, content, seo, brands, categories] = await Promise.all([
    getAdminProduct(id),
    getProductContent(id),
    getProductSeo(id),
    getAdminBrands(),
    getAdminCategories(),
  ])

  if (!product) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateProductAction(id, formData)
  }

  const tabStyle = (t: string) => ({
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
    fontFamily: 'var(--font-mono)' as const,
    fontSize: '0.6875rem',
    color: tab === t ? 'var(--colour-white)' : 'var(--colour-smoke)',
    backgroundColor: tab === t ? 'var(--colour-carbon)' : 'transparent',
    borderBottom: tab === t ? '1px solid var(--colour-carbon)' : '1px solid transparent',
    textDecoration: 'none' as const,
    display: 'inline-block' as const,
    marginBottom: '-1px',
    borderTop: tab === t ? '1px solid var(--colour-steel)' : '1px solid transparent',
    borderLeft: tab === t ? '1px solid var(--colour-steel)' : '1px solid transparent',
    borderRight: tab === t ? '1px solid var(--colour-steel)' : '1px solid transparent',
  })

  const inputStyle = {
    width: '100%',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--colour-graphite)',
    border: '1px solid var(--colour-steel)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--colour-white)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
  }

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'var(--font-mono)' as const,
    fontSize: '0.6875rem',
    color: 'var(--colour-smoke)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 'var(--space-2)',
  }

  const monoInputStyle = { ...inputStyle, fontFamily: 'var(--font-mono)' }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/products" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>Products</Link>
        <span>/</span>
        <Link href={`/admin/products/${id}`} style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>{product.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>Edit</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--colour-white)' }}>
            {product.name}
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {product.id} &bull; {product.slug}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            backgroundColor: product.published ? 'rgba(0,200,100,0.15)' : 'rgba(255,180,0,0.15)',
            color: product.published ? 'var(--colour-verified)' : 'var(--colour-amber)',
          }}>
            {product.published ? 'PUBLISHED' : product.status}
          </span>

          <form action={async () => {
            'use server'
            if (product.published) {
              await unpublishProductAction(id)
            } else {
              await publishProductAction(id)
            }
          }}>
            <button type="submit" style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-xs)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${product.published ? 'var(--colour-amber)' : 'var(--colour-verified)'}`,
              color: product.published ? 'var(--colour-amber)' : 'var(--colour-verified)',
              backgroundColor: 'transparent',
            }}>
              {product.published ? 'Unpublish' : 'Publish'}
            </button>
          </form>

          <Link href={`/admin/products/${id}`} style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            backgroundColor: 'var(--colour-graphite)',
            color: 'var(--colour-ash)',
            textDecoration: 'none',
            border: '1px solid var(--colour-steel)',
          }}>
            View Detail
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--colour-steel)', marginBottom: 0 }}>
        {[
          { key: 'core', label: 'Core Details' },
          { key: 'content', label: 'Editorial Content' },
          { key: 'seo', label: 'SEO & Metadata' },
          { key: 'identifiers', label: 'Identifiers' },
        ].map(({ key, label }) => (
          <Link key={key} href={`/admin/products/${id}/edit?tab=${key}`} style={tabStyle(key)}>
            {label}
          </Link>
        ))}
      </div>

      {/* Tab Panel */}
      <div style={{
        padding: 'var(--space-6)',
        backgroundColor: 'var(--colour-carbon)',
        border: '1px solid var(--colour-steel)',
        borderTop: 'none',
        borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
      }}>
        <form action={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* ── Core Details Tab ── */}
          {tab === 'core' && (
            <>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input type="text" name="name" defaultValue={product.name} required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Brand Partner *</label>
                  <select name="brandId" defaultValue={product.brandId} required style={inputStyle}>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select name="categoryId" defaultValue={product.categoryId ?? ''} style={inputStyle}>
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Catalogue Tier</label>
                  <select name="tier" defaultValue={product.tier} style={inputStyle}>
                    <option value="STANDARD">Standard</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="HALO">Halo (Flagship)</option>
                    <option value="COLLECTOR">Collector</option>
                    <option value="SPECIAL_ORDER">Special Order</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Lifecycle Status</label>
                  <select name="lifecycle" defaultValue={product.lifecycle} style={inputStyle}>
                    <option value="ACTIVE">Active — Available</option>
                    <option value="PREORDER">Pre-Order — Upcoming</option>
                    <option value="EOL">End of Life</option>
                    <option value="DISCONTINUED">Discontinued</option>
                    <option value="LEGACY">Legacy</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Discipline</label>
                  <select name="discipline" defaultValue={product.discipline ?? 'RACE'} style={inputStyle}>
                    <option value="RACE">Race (Circuit)</option>
                    <option value="BASH">Bash (Extreme)</option>
                    <option value="DRIFT">Drift</option>
                    <option value="CRAWL">Crawl / Trail</option>
                    <option value="SCALE">Scale Realism</option>
                    <option value="LARGE_SCALE">Large Scale (1:5)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Product Type</label>
                  <select name="productType" defaultValue={product.productType} style={inputStyle}>
                    <option value="VEHICLE">Complete Vehicle / Kit</option>
                    <option value="PART">Spare Part / Upgrade</option>
                    <option value="ELECTRONICS">Electronics / Power</option>
                    <option value="ACCESSORY">Accessory / Tool</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Scale</label>
                  <input type="text" name="scale" defaultValue={product.scale ?? ''} placeholder="e.g. 1/10, 1/8" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Editorial Summary (Internal / Storefront Header)</label>
                <textarea name="editorialSummary" rows={3} defaultValue={product.editorialSummary ?? ''} style={inputStyle} placeholder="Concise technical positioning statement..." />
              </div>
            </>
          )}

          {/* ── Content Tab ── */}
          {tab === 'content' && (
            <>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--colour-halo)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                Editorial content is displayed on the customer-facing product detail page. All content requires staff review — AI-generated drafts are never auto-published.
              </div>

              <div>
                <label style={labelStyle}>Short Description (Storefront card / header)</label>
                <textarea name="shortDescription" rows={3} defaultValue={content?.shortDescription ?? ''} style={inputStyle} placeholder="One to two sentence positioning statement for catalogue cards..." />
              </div>

              <div>
                <label style={labelStyle}>Long Description (Full editorial body)</label>
                <textarea name="longDescription" rows={8} defaultValue={content?.longDescription ?? ''} style={inputStyle} placeholder="Full machine biography, championship pedigree, engineering rationale..." />
              </div>

              <div>
                <label style={labelStyle}>Key Features (one per line)</label>
                <textarea
                  name="keyFeatures"
                  rows={6}
                  defaultValue={content?.keyFeatures?.join('\n') ?? ''}
                  style={inputStyle}
                  placeholder={`CNC-machined 2.5mm carbon fibre lower deck\nBall-bearing suspension with titanium pivot pins\nLow-profile servo mount for sub-20mm steering height`}
                />
                <p style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>Each line becomes one bullet in the storefront features list.</p>
              </div>
            </>
          )}

          {/* ── SEO Tab ── */}
          {tab === 'seo' && (
            <>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--colour-amber)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                SEO metadata is strictly staff-governed. Halo RC non-negotiable: every published product must have a custom SEO title and meta description before indexation.
              </div>

              <div>
                <label style={labelStyle}>SEO Title (≤60 chars recommended)</label>
                <input type="text" name="seoTitle" defaultValue={seo?.seoTitle ?? ''} placeholder={`${product.name} | Halo RC`} style={inputStyle} maxLength={80} />
                <p style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
                  Displayed in browser tab and Google search results. Leave blank to auto-generate from product name.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Meta Description (≤155 chars recommended)</label>
                <textarea name="metaDescription" rows={3} defaultValue={seo?.metaDescription ?? ''} style={inputStyle} maxLength={300}
                  placeholder="Championship-calibre RC kit with verified engineering specifications. UK & US dual-market fulfilment from Halo RC." />
                <p style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>
                  Shown in search snippets. Must be unique per product.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Primary Keyword (for AI tools & internal reference)</label>
                <input type="text" name="primaryKeyword" defaultValue={seo?.primaryKeyword ?? ''} placeholder="e.g. XRAY X4 2026 touring car kit" style={monoInputStyle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  name="indexPage"
                  value="true"
                  defaultChecked={seo?.indexPage !== false}
                  id="indexPage"
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="indexPage" style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', cursor: 'pointer' }}>
                  Index this page (allow Google to crawl and rank). Uncheck for NOINDEX.
                </label>
              </div>
            </>
          )}

          {/* ── Identifiers Tab ── */}
          {tab === 'identifiers' && (
            <>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--colour-halo)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                Product identifiers govern data integrity. Halo SKU must be unique. Manufacturer SKU links to supplier data feeds.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Halo RC SKU (internal primary)</label>
                  <input type="text" name="sku" defaultValue={product.sku ?? ''} placeholder="HALO-XR-X426" style={monoInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Manufacturer Part Number</label>
                  <input type="text" name="manufacturerSku" defaultValue={product.manufacturerSku ?? ''} placeholder="300034" style={monoInputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Internal Code</label>
                  <input type="text" name="internalCode" defaultValue={product.internalCode ?? ''} placeholder="TC-XRAY-01" style={monoInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>URL Slug (read-only)</label>
                  <input type="text" value={product.slug} readOnly disabled style={{ ...monoInputStyle, color: 'var(--colour-smoke)', cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginTop: 'var(--space-1)' }}>Slug changes require migration. Contact engineering.</p>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Product UUID (immutable)</label>
                <input type="text" value={product.id} readOnly disabled style={{ ...monoInputStyle, color: 'var(--colour-smoke)', cursor: 'not-allowed' }} />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)', marginTop: 'var(--space-2)' }}>
            <Link href={`/admin/products/${id}`} style={{
              padding: 'var(--space-2) var(--space-5)',
              backgroundColor: 'transparent',
              border: '1px solid var(--colour-steel)',
              color: 'var(--colour-ash)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              Cancel
            </Link>
            <button type="submit" style={{
              padding: 'var(--space-2) var(--space-6)',
              backgroundColor: 'var(--colour-halo)',
              border: 'none',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
