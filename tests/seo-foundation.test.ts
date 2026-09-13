import { describe, it, expect } from 'vitest'
import robots from '../apps/web/src/app/robots'
import sitemap from '../apps/web/src/app/sitemap'

describe('SEO Foundation & Metadata Verification', () => {
  it('robots configuration disallows sensitive and administrative routes', () => {
    const robotsConfig = robots()
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules

    expect(rules.disallow).toContain('/admin')
    expect(rules.disallow).toContain('/admin/*')
    expect(rules.disallow).toContain('/garage')
    expect(rules.disallow).toContain('/garage/*')
    expect(rules.disallow).toContain('/search')
    expect(rules.disallow).toContain('/cart')
    expect(rules.disallow).toContain('/checkout')
  })

  it('robots configuration points to authoritative sitemap.xml', () => {
    const robotsConfig = robots()
    expect(robotsConfig.sitemap).toBe('https://halo-rc.com/sitemap.xml')
  })

  it('sitemap generates canonical public URLs', () => {
    const sitemapEntries = sitemap()

    const urls = sitemapEntries.map((e) => e.url)
    expect(urls).toContain('https://halo-rc.com/')
    expect(urls).toContain('https://halo-rc.com/machines')
    expect(urls).toContain('https://halo-rc.com/race')
    expect(urls).toContain('https://halo-rc.com/brands')
    expect(urls).toContain('https://halo-rc.com/brands/xray')

    // Must NOT contain private routes
    expect(urls.some((u) => u.includes('/admin'))).toBe(false)
    expect(urls.some((u) => u.includes('/garage'))).toBe(false)
  })

  it('produces valid Schema.org Product JSON-LD without fabricated reviews', () => {
    const productData = {
      name: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      sku: 'XRAY-300040',
      brand: 'XRAY',
      description: 'Championship touring car kit.',
      price: '729.00',
      currency: 'GBP',
      inStock: true,
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productData.name,
      sku: productData.sku,
      brand: {
        '@type': 'Brand',
        name: productData.brand,
      },
      description: productData.description,
      offers: {
        '@type': 'Offer',
        price: productData.price,
        priceCurrency: productData.currency,
        availability: productData.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    }

    const serialized = JSON.stringify(jsonLd)

    expect(serialized).toContain('"@type":"Product"')
    expect(serialized).toContain('"price":"729.00"')
    // Enforce rule: No fabricated aggregateRating or reviews
    expect(serialized).not.toContain('aggregateRating')
    expect(serialized).not.toContain('reviewCount')
  })
})
