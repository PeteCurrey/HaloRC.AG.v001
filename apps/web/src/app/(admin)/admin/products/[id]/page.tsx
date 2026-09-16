import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminProduct, getProductContent, getProductSeo, getAdminBrands } from '@halo-rc/db'
import { publishProductAction, unpublishProductAction } from '@/actions/admin'
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
  AdminStatus,
  AdminField,
} from '@/components/admin'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const [product, content, seo, brands] = await Promise.all([
    getAdminProduct(id),
    getProductContent(id),
    getProductSeo(id),
    getAdminBrands(),
  ])

  if (!product) notFound()

  const brand = brands.find((b) => b.id === product.brandId)

  async function handleTogglePublish() {
    'use server'
    if (product?.published) {
      await unpublishProductAction(id)
    } else {
      await publishProductAction(id)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Catalogue', href: '/admin/products' },
          { label: 'Products', href: '/admin/products' },
          { label: product.name },
        ]}
        title={product.name}
        description={`Brand: ${brand?.name || product.brandId} · SKU: ${product.sku || 'None'} · /${product.slug}`}
        status={
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <AdminStatus
              status={product.published ? 'published' : product.status}
              label={product.published ? 'PUBLISHED' : product.status}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.6875rem',
                padding: '2px 6px',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border, #E2E2DE)',
                color: 'var(--admin-text-secondary, #494D55)',
              }}
            >
              {product.tier}
            </span>
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <form action={handleTogglePublish}>
              <AdminAction
                type="submit"
                variant={product.published ? 'subtle' : 'primary'}
                size="sm"
              >
                {product.published ? 'Unpublish to Draft' : 'Publish Product'}
              </AdminAction>
            </form>

            <AdminAction
              variant="secondary"
              size="sm"
              href={`/admin/products/${product.id}/edit`}
            >
              Edit Product &rarr;
            </AdminAction>

            {product.published && (
              <AdminAction
                variant="secondary"
                size="sm"
                href={`/machines/${product.slug}`}
                target="_blank"
                title="View on storefront"
                icon={
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                }
              >
                Storefront
              </AdminAction>
            )}
          </div>
        }
      />

      {/* Grid Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Identity & Technical Specs */}
          <AdminPanel title="Technical Identity" subtitle="Authoritative specifications" padding="md">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <AdminField label="Product Type" value={product.productType} monospace />
              <AdminField label="Discipline" value={product.discipline || 'Unassigned'} monospace />
              <AdminField label="Scale" value={product.scale || 'Not set'} monospace />
              <AdminField label="Power Type" value={product.powerType || 'Not set'} monospace />
              <AdminField label="Manufacturer SKU" value={product.manufacturerSku || 'None'} monospace />
              <AdminField label="Internal Code" value={product.internalCode || 'None'} monospace />
            </div>

            {product.editorialSummary && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--admin-border-subtle, #EBEBE7)' }}>
                <AdminField label="Editorial Summary">
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', lineHeight: 1.5 }}>
                    {product.editorialSummary}
                  </p>
                </AdminField>
              </div>
            )}
          </AdminPanel>

          {/* Structured Content */}
          <AdminPanel title="Editorial Content" subtitle="Storefront descriptions and feature lists" padding="md">
            {content ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {content.shortDescription && (
                  <AdminField label="Short Description">
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', lineHeight: 1.5 }}>
                      {content.shortDescription}
                    </p>
                  </AdminField>
                )}

                {content.keyFeatures && content.keyFeatures.length > 0 && (
                  <AdminField label={`Key Features (${content.keyFeatures.length})`}>
                    <ul style={{ paddingLeft: '18px', margin: '4px 0 0', color: 'var(--admin-text-secondary, #494D55)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                      {content.keyFeatures.map((f, i) => (
                        <li key={i} style={{ marginBottom: '3px' }}>{f}</li>
                      ))}
                    </ul>
                  </AdminField>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                No structured editorial content configured yet. Click Edit Product to add descriptions and features.
              </div>
            )}
          </AdminPanel>
        </div>

        {/* Right Column: SEO & Governance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* SEO Status */}
          <AdminPanel title="SEO Metadata" subtitle="Search engine indexing" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AdminField
                label="SEO Title"
                value={seo?.seoTitle || 'Defaulting to product name'}
              />
              <AdminField
                label="Meta Description"
                value={seo?.metaDescription || 'Missing meta description'}
              />
              <AdminField label="Index Status">
                <AdminStatus
                  status={seo?.indexPage ? 'verified' : 'warning'}
                  label={seo?.indexPage ? 'INDEX' : 'NOINDEX'}
                />
              </AdminField>
            </div>
          </AdminPanel>

          {/* Record Provenance */}
          <AdminPanel title="Record Provenance" subtitle="System timestamps" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AdminField label="Database ID" value={product.id} monospace />
              <AdminField
                label="Created"
                value={new Date(product.createdAt).toLocaleDateString('en-GB')}
                monospace
              />
              <AdminField
                label="Updated"
                value={new Date(product.updatedAt).toLocaleDateString('en-GB')}
                monospace
              />
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
