import { describe, it, expect } from 'vitest'
import { getAdminProducts } from '../packages/db/src/queries/admin-products'
import { getMachinesList, getPartsList, getMachineDetail, getPartDetail } from '../packages/db/src/queries'

describe('End-to-End Verification & Trace', () => {
  it('verifies exact database counts and traces machine & part SKUs', async () => {
    // 1. Admin product query for MUGEN
    const adminRes = await getAdminProducts({ search: 'MUGEN' }, { page: 1, perPage: 25 })
    console.log('=== ADMIN CATALOGUE ===')
    console.log('Total MUGEN Products in Registry:', adminRes.total)
    console.log('Page 1 Items Returned:', adminRes.items.length)
    expect(adminRes.total).toBe(2648)

    // 2. Machines Storefront Query
    const machines = await getMachinesList({ brand: 'mugen-seiki', marketCode: 'UK' })
    console.log('\n=== STOREFRONT /MACHINES ===')
    console.log('Published MUGEN Kits:', machines.length)
    for (const m of machines) {
      console.log(`- [${m.sku}] ${m.name} | Slug: ${m.slug} | Retail: £${((m.offer?.retailPriceMinorUnits ?? 0) / 100).toFixed(2)} | Availability: ${m.offer?.availability}`)
    }
    expect(machines.length).toBe(10)

    // 3. Parts Storefront Query
    const parts = await getPartsList({ brand: 'mugen-seiki', marketCode: 'UK', limit: 100 })
    console.log('\n=== STOREFRONT /PARTS (SAMPLE) ===')
    console.log('Sample Parts Loaded:', parts.length)
    for (const p of parts.slice(0, 5)) {
      console.log(`- [${p.sku}] ${p.name} | Slug: ${p.slug} | Type: ${p.productType} | Retail: £${((p.offer?.retailPriceMinorUnits ?? 0) / 100).toFixed(2)}`)
    }
    expect(parts.length).toBeGreaterThanOrEqual(10)

    // 4. Trace 1: Machine E2027 (MBX-8R)
    const e2027Kit = machines.find((m) => m.sku === 'E2027' || m.sku === 'MUG-E2027')
    expect(e2027Kit).toBeDefined()
    const machineDetail = await getMachineDetail(e2027Kit!.slug, 'UK')
    console.log('\n=== MACHINE TRACE (E2027) ===')
    console.log('Product Name:', machineDetail?.name)
    console.log('SKU:', machineDetail?.sku)
    console.log('Slug:', machineDetail?.slug)
    console.log('Brand:', machineDetail?.brand.name)
    console.log('Scale / Power:', machineDetail?.scale, '/', machineDetail?.powerType)
    console.log('UK Offer Retail Price:', machineDetail?.offer ? `£${(machineDetail.offer.retailPriceMinorUnits / 100).toFixed(2)} (${machineDetail.offer.taxMode})` : 'None')
    console.log('Offer Notes (Safe):', machineDetail?.offer?.notes)
    expect(machineDetail).not.toBeNull()
    expect(machineDetail?.offer?.notes).not.toContain('Supplier cost')
    expect(machineDetail?.offer?.notes).toContain('Authoritative MUGEN import. Direct manufacturer supply.')

    // 5. Trace 2: Part A2101L (or first sample part)
    const samplePart = parts[0]
    expect(samplePart).toBeDefined()
    const partDetail = await getPartDetail(samplePart!.slug, 'UK')
    console.log('\n=== PART TRACE (' + samplePart?.sku + ') ===')
    console.log('Product Name:', partDetail?.name)
    console.log('SKU:', partDetail?.sku)
    console.log('Slug:', partDetail?.slug)
    console.log('Brand:', partDetail?.brand.name)
    console.log('Product Type:', partDetail?.productType)
    console.log('UK Offer Retail Price:', partDetail?.offer ? `£${(partDetail.offer.retailPriceMinorUnits / 100).toFixed(2)} (${partDetail.offer.taxMode})` : 'None')
    console.log('Offer Notes (Safe):', partDetail?.offer?.notes)
    expect(partDetail).not.toBeNull()
    expect(partDetail?.offer?.notes).not.toContain('Supplier cost')
    expect(partDetail?.offer?.notes).toContain('Authoritative MUGEN import. Direct manufacturer supply.')
  })
})
