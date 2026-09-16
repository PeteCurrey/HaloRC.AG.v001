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
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
  AdminStatus,
  AdminTabs,
} from '@/components/admin'

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
    <div style={{ width: '100%', maxWidth: '960px' }}>
      {/* Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Catalogue', href: '/admin/products' },
          { label: 'Products', href: '/admin/products' },
          { label: product.name, href: `/admin/products/${id}` },
          { label: 'Edit' },
        ]}
        title={`Edit: ${product.name}`}
        description={`${product.id} · ${product.slug}`}
        status={
          <AdminStatus
            status={product.published ? 'published' : product.status}
            label={product.published ? 'PUBLISHED' : product.status}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <form
              action={async () => {
                'use server'
                if (product.published) {
                  await unpublishProductAction(id)
                } else {
                  await publishProductAction(id)
                }
              }}
            >
              <AdminAction
                type="submit"
                variant={product.published ? 'subtle' : 'secondary'}
                size="sm"
              >
                {product.published ? 'Unpublish to Draft' : 'Publish'}
              </AdminAction>
            </form>

            <AdminAction
              variant="subtle"
              size="sm"
              href={`/admin/products/${id}`}
            >
              View Record &rarr;
            </AdminAction>
          </div>
        }
      />

      {/* Tabs */}
      <AdminTabs
        tabs={[
          { id: 'core', label: 'Core Details', href: `/admin/products/${id}/edit?tab=core`, active: tab === 'core' },
          { id: 'content', label: 'Editorial Content', href: `/admin/products/${id}/edit?tab=content`, active: tab === 'content' },
          { id: 'seo', label: 'SEO & Metadata', href: `/admin/products/${id}/edit?tab=seo`, active: tab === 'seo' },
          { id: 'identifiers', label: 'Identifiers', href: `/admin/products/${id}/edit?tab=identifiers`, active: tab === 'identifiers' },
        ]}
      />

      {/* Main Form Panel */}
      <AdminPanel padding="lg">
        <form action={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* ── Core Details Tab ── */}
          {tab === 'core' && (
            <>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input type="text" name="name" defaultValue={product.name} required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                <textarea name="editorialSummary" rows={3} defaultValue={product.editorialSummary ?? ''} style={textareaStyle} placeholder="Concise technical positioning statement..." />
              </div>
            </>
          )}

          {/* ── Content Tab ── */}
          {tab === 'content' && (
            <>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--admin-surface-well, #EFEFED)', borderRadius: 'var(--admin-radius-sm, 3px)', borderLeft: '3px solid var(--admin-accent, #B8935A)', fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                Editorial content is displayed on the customer-facing product detail page. All content requires staff review — AI-generated drafts are never auto-published.
              </div>

              <div>
                <label style={labelStyle}>Short Description (Storefront card / header)</label>
                <textarea name="shortDescription" rows={3} defaultValue={content?.shortDescription ?? ''} style={textareaStyle} placeholder="One to two sentence positioning statement for catalogue cards..." />
              </div>

              <div>
                <label style={labelStyle}>Long Description (Full editorial body)</label>
                <textarea name="longDescription" rows={7} defaultValue={content?.longDescription ?? ''} style={textareaStyle} placeholder="Full machine biography, championship pedigree, engineering rationale..." />
              </div>

              <div>
                <label style={labelStyle}>Key Features (one per line)</label>
                <textarea
                  name="keyFeatures"
                  rows={6}
                  defaultValue={content?.keyFeatures?.join('\n') ?? ''}
                  style={textareaStyle}
                  placeholder={`CNC-machined 2.5mm carbon fibre lower deck\nBall-bearing suspension with titanium pivot pins\nLow-profile servo mount for sub-20mm steering height`}
                />
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '4px' }}>
                  Each line becomes one bullet in the storefront features list.
                </p>
              </div>
            </>
          )}

          {/* ── SEO Tab ── */}
          {tab === 'seo' && (
            <>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--admin-surface-well, #EFEFED)', borderRadius: 'var(--admin-radius-sm, 3px)', borderLeft: '3px solid var(--admin-dot-warning, #B86818)', fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                SEO metadata is strictly staff-governed. Avorria RC non-negotiable: every published product must have a custom SEO title and meta description before indexation.
              </div>

              <div>
                <label style={labelStyle}>SEO Title (&le;60 chars recommended)</label>
                <input type="text" name="seoTitle" defaultValue={seo?.seoTitle ?? ''} placeholder={`${product.name} | Avorria RC`} style={inputStyle} maxLength={80} />
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '4px' }}>
                  Displayed in browser tab and Google search results. Leave blank to auto-generate from product name.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Meta Description (&le;155 chars recommended)</label>
                <textarea name="metaDescription" rows={3} defaultValue={seo?.metaDescription ?? ''} style={textareaStyle} maxLength={300}
                  placeholder="Championship-calibre RC kit with verified engineering specifications. Dual-market fulfilment from Avorria RC." />
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '4px' }}>
                  Shown in search snippets. Must be unique per product.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Primary Keyword (for AI tools & internal reference)</label>
                <input type="text" name="primaryKeyword" defaultValue={seo?.primaryKeyword ?? ''} placeholder="e.g. XRAY X4 touring car kit" style={monoInputStyle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="indexPage"
                  value="true"
                  defaultChecked={seo?.indexPage !== false}
                  id="indexPage"
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="indexPage" style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', cursor: 'pointer' }}>
                  Index this page (allow search engines to crawl and rank). Uncheck for NOINDEX.
                </label>
              </div>
            </>
          )}

          {/* ── Identifiers Tab ── */}
          {tab === 'identifiers' && (
            <>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--admin-surface-well, #EFEFED)', borderRadius: 'var(--admin-radius-sm, 3px)', borderLeft: '3px solid var(--admin-accent, #B8935A)', fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)' }}>
                Product identifiers govern data integrity. Halo/Avorria SKU must be unique. Manufacturer SKU links to supplier data feeds.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Avorria RC SKU (internal primary)</label>
                  <input type="text" name="sku" defaultValue={product.sku ?? ''} placeholder="AV-XR-X426" style={monoInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Manufacturer Part Number</label>
                  <input type="text" name="manufacturerSku" defaultValue={product.manufacturerSku ?? ''} placeholder="300034" style={monoInputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Internal Code</label>
                  <input type="text" name="internalCode" defaultValue={product.internalCode ?? ''} placeholder="TC-XRAY-01" style={monoInputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>URL Slug (read-only)</label>
                  <input type="text" value={product.slug} readOnly disabled style={{ ...monoInputStyle, backgroundColor: 'var(--admin-surface-well, #EFEFED)', cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '4px' }}>
                    Slug changes require migration. Contact engineering.
                  </p>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Product UUID (immutable)</label>
                <input type="text" value={product.id} readOnly disabled style={{ ...monoInputStyle, backgroundColor: 'var(--admin-surface-well, #EFEFED)', cursor: 'not-allowed' }} />
              </div>
            </>
          )}

          {/* Form Actions */}
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
            <AdminAction variant="subtle" size="sm" href={`/admin/products/${id}`}>
              Cancel
            </AdminAction>
            <AdminAction type="submit" variant="primary" size="sm">
              Save Changes
            </AdminAction>
          </div>
        </form>
      </AdminPanel>
    </div>
  )
}
