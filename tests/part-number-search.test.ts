import { describe, it, expect } from 'vitest'
import { searchCatalogue } from '@halo-rc/db'

describe('Part Number & Catalogue Search Engine (searchCatalogue)', () => {
  it('locates product by exact SKU match', async () => {
    const results = await searchCatalogue({ query: 'XRAY-300040', marketCode: 'UK' })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.sku).toBe('XRAY-300040')
    expect(results[0]?.name).toContain('XRAY X4')
  })

  it('locates product by case-insensitive partial SKU match', async () => {
    const results = await searchCatalogue({ query: '77086', marketCode: 'UK' })
    expect(results.length).toBeGreaterThan(0)
    const match = results.find((r) => r.sku?.includes('77086'))
    expect(match).toBeDefined()
    expect(match?.brandName).toBe('Traxxas')
  })

  it('resolves superseded / replaced SKU to its successor product', async () => {
    // XRAY-301000 is a replaced suspension arm, replaced by XRAY-302000
    const results = await searchCatalogue({ query: 'XRAY-301000', marketCode: 'UK' })
    expect(results.length).toBeGreaterThan(0)

    const replacedProduct = results.find((r) => r.sku === 'XRAY-301000')
    expect(replacedProduct).toBeDefined()
    expect(replacedProduct?.isReplaced).toBe(true)
    expect(replacedProduct?.replacement).toBeDefined()
    expect(replacedProduct?.replacement?.sku).toBe('XRAY-302000')
    expect(replacedProduct?.replacement?.name).toContain('Graphite')
  })

  it('searches across platform name and returns platform-related hardware', async () => {
    const results = await searchCatalogue({ query: 'X-Maxx', marketCode: 'UK' })
    expect(results.length).toBeGreaterThan(0)
    const machine = results.find((r) => r.slug.includes('traxxas-x-maxx'))
    expect(machine).toBeDefined()
  })

  it('returns empty array for empty or whitespace query', async () => {
    const emptyResult = await searchCatalogue({ query: '', marketCode: 'UK' })
    expect(emptyResult).toEqual([])

    const whitespaceResult = await searchCatalogue({ query: '   ', marketCode: 'UK' })
    expect(whitespaceResult).toEqual([])
  })
})
