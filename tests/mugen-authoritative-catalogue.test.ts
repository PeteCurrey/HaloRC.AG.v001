import { describe, it, expect } from 'vitest'
import {
  MugenCanonicalPromoter,
  resolveAvorriaCategoryId,
  calculateRetailPrices,
  KNOWN_ZERO_PRICE_SKUS,
  CONTROLLED_PUBLISHED_SKUS,
} from '../packages/db/src/importers/mugen-canonical-promoter'
import { getAdminProducts } from '../packages/db/src/queries/admin-products'
import { getMachinesList, getPartsList, getMachineDetail, getPartDetail, searchCatalogue } from '../packages/db/src/queries'

describe('MUGEN Authoritative Ecommerce Catalogue Architecture', () => {
  it('strictly isolates zero-price SKUs from commercial publication', () => {
    const blocked = ['H2120', 'H2126', 'H2202', 'H2205', 'H2306', 'H2307', 'H2309', 'H2803', 'H2807']
    for (const sku of blocked) {
      expect(KNOWN_ZERO_PRICE_SKUS.has(sku)).toBe(true)
      expect(CONTROLLED_PUBLISHED_SKUS.has(sku)).toBe(false)
    }
  })

  it('calculates retail prices cleanly separated from supplier net cost', () => {
    const costEurMinor = 52900 // €529.00
    const fx = { gbp: 0.8542, usd: 1.0825 }
    const prices = calculateRetailPrices(costEurMinor, 'KIT', fx)

    // Retail price in GBP must never equal wholesale net cost
    expect(prices.retailGbp).not.toBe(costEurMinor)
    expect(prices.retailUsd).not.toBe(costEurMinor)
    expect(prices.retailGbp).toBeGreaterThan(costEurMinor * fx.gbp) // contains retail markup
    expect(prices.retailUsd).toBeGreaterThan(costEurMinor * fx.usd) // contains retail markup
  })

  it('correctly maps MUGEN product categories into existing Avorria schema categories', () => {
    expect(resolveAvorriaCategoryId('KIT', 'COMPLETE_KIT', 'A2006', 'MTC-3 1/10 EP TOURING KIT')).toBe('cat-110-touring')
    expect(resolveAvorriaCategoryId('KIT', 'COMPLETE_KIT', 'B2001', 'MSB1 1/10 2WD OFF-ROAD ELEKTRO BUGGY')).toBe('cat-18-buggy')
    expect(resolveAvorriaCategoryId('KIT', 'COMPLETE_KIT', 'H2009', 'MRX-7 1/8 ON-ROAD FAHRZEUG')).toBe('cat-15-onroad')
    expect(resolveAvorriaCategoryId('PART', 'ENGINE', 'H0755', 'KUPPLUNGS-EINSTELLMUTTER')).toBe('cat-race-engines')
    expect(resolveAvorriaCategoryId('TOOLS', 'TOOLS', 'B0554a', 'RITZEL MONTAGE WERKZEUG')).toBe('cat-garage-culture')
    expect(resolveAvorriaCategoryId('REPLACEMENT_PART', 'REPLACEMENT_PART', 'A2101L', 'FRONT UPPER BULKHEAD LEFT')).toBe('cat-parts')
  })

  it('queries machines list and finds published MUGEN kits with live market offers', async () => {
    const machines = await getMachinesList({ brand: 'mugen-seiki' })
    expect(machines.length).toBeGreaterThanOrEqual(3)
    for (const m of machines) {
      expect(m.offer).not.toBeNull()
      expect(m.offer?.retailPriceMinorUnits).toBeGreaterThan(0)
    }
  })

  it('queries parts list and finds published MUGEN parts with live market offers', async () => {
    const parts = await getPartsList({ brand: 'mugen-seiki' })
    expect(parts.length).toBeGreaterThanOrEqual(5)
    for (const p of parts) {
      expect(p.offer).not.toBeNull()
      expect(p.offer?.retailPriceMinorUnits).toBeGreaterThan(0)
    }
  })

  it('searches admin products by brand name MUGEN and returns complete canonical catalogue', async () => {
    const res = await getAdminProducts({ search: 'MUGEN' }, { page: 1, perPage: 25 })
    expect(res.total).toBeGreaterThanOrEqual(2600)
    expect(res.items.length).toBe(25)
    expect(res.error).toBeFalsy()
  })

  it('retrieves machine detail and part detail end-to-end', async () => {
    const machine = await getMachineDetail('mugen-mtc3-1-10-4wd-ep-touring-kit', 'UK')
    expect(machine).not.toBeNull()
    expect(machine?.sku).toBe('A2006')
    expect(machine?.offer?.currency).toBe('GBP')

    const part = await getPartDetail('mugen-a2101l-191549', 'UK')
    expect(part).not.toBeNull()
    expect(part?.sku).toBe('A2101L')
    expect(part?.offer?.currency).toBe('GBP')
  })
})
