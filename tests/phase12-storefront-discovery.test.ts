import { describe, it, expect } from 'vitest'
import { searchCatalogue, getMachinesList } from '@halo-rc/db'
import {
  SHOP_DISCIPLINES,
  FEATURED_ENGINEERING_BRANDS,
  MEGA_MENUS,
  RACE_DISCIPLINES,
} from '../apps/web/src/lib/navigation-data'

describe('Phase 12 — Storefront UX, Navigation, Search & Discovery', () => {
  describe('Catalogue Search Engine', () => {
    it('returns exact or partial matches across SKU, brand, and platform', async () => {
      // 1. Search by brand name
      const xrayResults = await searchCatalogue({ query: 'XRAY', marketCode: 'UK' })
      expect(xrayResults.length).toBeGreaterThan(0)
      expect(xrayResults.some((r) => r.brandName === 'XRAY')).toBe(true)

      // 2. Search by platform name
      const xmaxxResults = await searchCatalogue({ query: 'X-Maxx', marketCode: 'UK' })
      expect(xmaxxResults.length).toBeGreaterThan(0)
      expect(xmaxxResults.some((r) => r.name.toLowerCase().includes('x-maxx'))).toBe(true)

      // 3. Search by SKU
      const firstSku = xrayResults[0]?.sku
      if (firstSku) {
        const skuResults = await searchCatalogue({ query: firstSku, marketCode: 'UK' })
        expect(skuResults.length).toBeGreaterThan(0)
        expect(skuResults.some((r) => r.sku === firstSku)).toBe(true)
      }
    })

    it('returns empty array for empty, whitespace, or unmatched queries without throwing', async () => {
      const emptyResults = await searchCatalogue({ query: '   ', marketCode: 'UK' })
      expect(emptyResults).toEqual([])

      const nonExistent = await searchCatalogue({ query: 'NON_EXISTENT_SKU_123456789', marketCode: 'UK' })
      expect(nonExistent).toEqual([])
    })

    it('resolves market-specific offers for UK and US independently in search results', async () => {
      const ukResults = await searchCatalogue({ query: 'X-Maxx', marketCode: 'UK' })
      const usResults = await searchCatalogue({ query: 'X-Maxx', marketCode: 'US' })

      const ukOffer = ukResults.find((r) => r.offer !== null)?.offer
      const usOffer = usResults.find((r) => r.offer !== null)?.offer

      if (ukOffer && usOffer) {
        expect(ukOffer.currency).toBe('GBP')
        expect(usOffer.currency).toBe('USD')
        expect(ukOffer.taxMode).toBe('INCLUSIVE')
        expect(usOffer.taxMode).toBe('EXCLUSIVE')
      }
    })
  })

  describe('Machines Listing Filter & Deterministic Sorting', () => {
    it('filters machines by scale accurately', async () => {
      const allMachines = await getMachinesList({ marketCode: 'UK' })
      expect(allMachines.length).toBeGreaterThan(0)

      const scale110 = await getMachinesList({ scale: '1:10', marketCode: 'UK' })
      expect(scale110.length).toBeGreaterThan(0)
      for (const m of scale110) {
        expect(m.scale).toContain('1:10')
      }

      const scale15 = await getMachinesList({ scale: '1:5', marketCode: 'UK' })
      expect(scale15.length).toBeGreaterThan(0)
      for (const m of scale15) {
        expect(m.scale).toContain('1:5')
      }
    })

    it('sorts machines by price ascending and descending deterministically', async () => {
      const priceAsc = await getMachinesList({ sort: 'price_asc', marketCode: 'UK' })
      const priceDesc = await getMachinesList({ sort: 'price_desc', marketCode: 'UK' })

      expect(priceAsc.length).toBeGreaterThan(1)
      expect(priceDesc.length).toBeGreaterThan(1)

      const firstAscPrice = priceAsc[0]?.offer?.retailPriceMinorUnits ?? 0
      const lastAscPrice = priceAsc[priceAsc.length - 1]?.offer?.retailPriceMinorUnits ?? 0
      expect(firstAscPrice).toBeLessThanOrEqual(lastAscPrice)

      const firstDescPrice = priceDesc[0]?.offer?.retailPriceMinorUnits ?? 0
      const lastDescPrice = priceDesc[priceDesc.length - 1]?.offer?.retailPriceMinorUnits ?? 0
      expect(firstDescPrice).toBeGreaterThanOrEqual(lastDescPrice)
    })

    it('defaults to Featured sort putting HALO tier machines first', async () => {
      const featured = await getMachinesList({ marketCode: 'UK' })
      expect(featured.length).toBeGreaterThan(0)

      // First item must be a HALO tier product if any HALO products exist in catalogue
      const hasHalo = featured.some((m) => m.tier === 'HALO')
      if (hasHalo) {
        expect(featured[0]?.tier).toBe('HALO')
      }
    })
  })

  describe('Homepage & Navigation Data Integrity', () => {
    it('provides structured Shop by Discipline data with 6 core classes', () => {
      expect(SHOP_DISCIPLINES).toHaveLength(6)
      for (const d of SHOP_DISCIPLINES) {
        expect(d.id).toBeTruthy()
        expect(d.label).toBeTruthy()
        expect(d.sub).toBeTruthy()
        expect(d.href).toMatch(/^\/machines\?discipline=/)
      }
    })

    it('provides structured Featured Engineering Brands with commercial verified status', () => {
      expect(FEATURED_ENGINEERING_BRANDS).toHaveLength(6)
      for (const b of FEATURED_ENGINEERING_BRANDS) {
        expect(b.name).toBeTruthy()
        expect(b.country).toBeTruthy()
        expect(b.specialism).toBeTruthy()
        expect(b.status).toBeTruthy()
        expect(b.href).toBe('/brands')
      }
    })

    it('validates MegaMenu columns and links conform to store routing', () => {
      expect(MEGA_MENUS.machines).toBeDefined()
      expect(MEGA_MENUS.race).toBeDefined()
      expect(MEGA_MENUS.brands).toBeDefined()

      // Ensure every link starts with a leading slash
      for (const menu of Object.values(MEGA_MENUS)) {
        for (const col of menu.columns) {
          for (const link of col.links) {
            expect(link.href.startsWith('/')).toBe(true)
            expect(link.label.length).toBeGreaterThan(0)
          }
        }
        if (menu.spotlight) {
          expect(menu.spotlight.href.startsWith('/')).toBe(true)
        }
      }
    })

    it('contains valid race disciplines with labels and subtexts', () => {
      expect(RACE_DISCIPLINES.length).toBeGreaterThanOrEqual(6)
      for (const r of RACE_DISCIPLINES) {
        expect(r.href.startsWith('/race')).toBe(true)
        expect(r.label).toBeTruthy()
      }
    })
  })
})
