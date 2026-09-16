import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminProduct, getProductContent, getProductSeo, getAdminBrands } from '@halo-rc/db'
import { publishProductAction, unpublishProductAction } from '@/actions/admin'

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
    <div style={{ maxWidth: '1000px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/products" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          Products
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>{product.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: product.published ? 'rgba(0, 200, 100, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                color: product.published ? 'var(--colour-verified)' : 'var(--colour-amber)',
                border: `1px solid ${product.published ? 'var(--colour-verified)' : 'var(--colour-amber)'}`,
              }}
            >
              {product.published ? 'PUBLISHED' : product.status}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--colour-graphite)',
                color: 'var(--colour-smoke)',
              }}
            >
              {product.tier}
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            {product.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
            Brand: {brand?.name || product.brandId} &bull; SKU: {product.sku || 'None'} &bull; Slug: /{product.slug}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <form action={handleTogglePublish}>
            <button
              type="submit"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: product.published ? 'transparent' : 'var(--colour-verified)',
                border: `1px solid ${product.published ? 'var(--colour-amber)' : 'transparent'}`,
                color: product.published ? 'var(--colour-amber)' : 'var(--colour-void)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {product.published ? 'Unpublish to Draft' : 'Publish Product'}
            </button>
          </form>

          <Link
            href={`/admin/products/${product.id}/edit`}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo)',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Edit Product &rarr;
          </Link>

          {product.published && (
            <Link
              href={`/machines/${product.slug}`}
              target="_blank"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--colour-graphite)',
                border: '1px solid var(--colour-steel)',
                color: 'var(--colour-off-white)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              View on Storefront &nearr;
            </Link>
          )}
        </div>
      </div>

      {/* Grid Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Identity & Technical Specs */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
              Technical Identity
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Product Type</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.productType}</span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Discipline</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.discipline || 'Unassigned'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Scale</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.scale || 'Not set'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Power Type</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.powerType || 'Not set'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Manufacturer SKU</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.manufacturerSku || 'None'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Internal Code</span>
                <span style={{ color: 'var(--colour-white)', fontFamily: 'var(--font-mono)' }}>{product.internalCode || 'None'}</span>
              </div>
            </div>

            {product.editorialSummary && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-graphite)' }}>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>Editorial Summary</span>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)' }}>
                  {product.editorialSummary}
                </p>
              </div>
            )}
          </div>

          {/* Structured Content */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
              Editorial Content
            </h2>

            {content ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                {content.shortDescription && (
                  <div>
                    <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Short Description</span>
                    <p style={{ color: 'var(--colour-ash)' }}>{content.shortDescription}</p>
                  </div>
                )}
                {content.keyFeatures && content.keyFeatures.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '4px' }}>Key Features ({content.keyFeatures.length})</span>
                    <ul style={{ paddingLeft: 'var(--space-4)', margin: 0, color: 'var(--colour-ash)' }}>
                      {content.keyFeatures.map((f, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                No structured editorial content configured yet. Edit product to add descriptions and features.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: SEO & Governance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* SEO Status */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
              SEO Metadata
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>SEO Title</span>
                <span style={{ color: seo?.seoTitle ? 'var(--colour-white)' : 'var(--colour-amber)' }}>
                  {seo?.seoTitle || 'Defaulting to product name'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Meta Description</span>
                <span style={{ color: seo?.metaDescription ? 'var(--colour-ash)' : 'var(--colour-amber)' }}>
                  {seo?.metaDescription || 'Missing meta description'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: '2px' }}>Index Status</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: seo?.indexPage ? 'var(--colour-verified)' : 'var(--colour-amber)' }}>
                  {seo?.indexPage ? 'INDEX' : 'NOINDEX'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Details */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
              Record Provenance
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
              <div>ID: {product.id}</div>
              <div>Created: {new Date(product.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(product.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
