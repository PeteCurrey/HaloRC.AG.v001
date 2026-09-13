import { describe, it, expect } from 'vitest'
import { getMachinesList, getMachineDetail } from '@halo-rc/db'

describe('Catalogue Query Engine (getMachinesList & getMachineDetail)', () => {
  it('retrieves all published machines across disciplines for UK market', async () => {
    const machines = await getMachinesList({ marketCode: 'UK' })
    expect(machines.length).toBeGreaterThan(0)
    // Every machine must have a name, brand, discipline, and valid slug
    for (const m of machines) {
      expect(m.id).toBeDefined()
      expect(m.name).toBeTruthy()
      expect(m.brand.name).toBeTruthy()
      expect(m.discipline).toBeDefined()
      expect(m.slug).toBeTruthy()
    }
  })

  it('filters machines accurately by discipline', async () => {
    const bashMachines = await getMachinesList({ discipline: 'BASH', marketCode: 'UK' })
    expect(bashMachines.length).toBeGreaterThan(0)
    for (const m of bashMachines) {
      expect(m.discipline).toBe('BASH')
    }

    const raceMachines = await getMachinesList({ discipline: 'RACE', marketCode: 'UK' })
    expect(raceMachines.length).toBeGreaterThan(0)
    for (const m of raceMachines) {
      expect(m.discipline).toBe('RACE')
    }
  })

  it('filters machines by brand', async () => {
    const xrayMachines = await getMachinesList({ brand: 'xray', marketCode: 'UK' })
    expect(xrayMachines.length).toBeGreaterThan(0)
    for (const m of xrayMachines) {
      expect(m.brand.slug).toBe('xray')
    }
  })

  it('filters machines by tier (HALO vs STANDARD)', async () => {
    const haloMachines = await getMachinesList({ tier: 'HALO', marketCode: 'UK' })
    expect(haloMachines.length).toBeGreaterThan(0)
    for (const m of haloMachines) {
      expect(m.tier).toBe('HALO')
    }
  })

  it('resolves market-specific offers and enforces no cross-market fallback', async () => {
    // Awesomatix A800MMX is a deliberate UK-only offer in seed data
    const ukMachines = await getMachinesList({ marketCode: 'UK' })
    const awesomatixUk = ukMachines.find((m) => m.slug.includes('awesomatix'))
    expect(awesomatixUk).toBeDefined()
    expect(awesomatixUk?.offer).not.toBeNull()
    expect(awesomatixUk?.offer?.currency).toBe('GBP')

    const usMachines = await getMachinesList({ marketCode: 'US' })
    const awesomatixUs = usMachines.find((m) => m.slug.includes('awesomatix'))
    expect(awesomatixUs).toBeDefined()
    // In US market, it has no offer -> returns null (NEVER falls back to GBP)
    expect(awesomatixUs?.offer).toBeNull()
  })

  it('hydrates complete product graph via getMachineDetail', async () => {
    const detail = await getMachineDetail('xray-x4-2026-1-10-touring-car-kit', 'UK')
    expect(detail).not.toBeNull()
    expect(detail?.brand.name).toBe('XRAY')
    expect(detail?.platform?.name).toContain('X4')
    expect(detail?.offer).not.toBeNull()
    expect(detail?.offer?.retailPriceMinorUnits).toBe(72900)

    // Specifications sanitized of UNKNOWN
    expect(detail?.dna.length).toBeGreaterThan(0)
    for (const spec of detail!.dna) {
      expect(spec.confidence).not.toBe('UNKNOWN')
    }

    // Documents attached
    expect(detail?.documents.length).toBeGreaterThan(0)

    // Compatible parts hydrated with market offers
    expect(detail?.compatibleParts.length).toBeGreaterThan(0)
  })

  it('returns null for non-existent product slug', async () => {
    const detail = await getMachineDetail('non-existent-chassis-xyz', 'UK')
    expect(detail).toBeNull()
  })
})
