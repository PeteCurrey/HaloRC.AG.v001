// tests/supplier-product-matching.test.ts
// Phase 8 — Deterministic product matching hierarchy and anti-hallucination invariants (Scenarios A & B)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeSupplierItem,
  matchSupplierProduct,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Scenario A — Exact manufacturer SKU deterministic matching', () => {
  it('matches supplier item with exact manufacturer SKU to the correct canonical product', async () => {
    const raw = {
      supplierSku: 'DIST-X4-2026',
      manufacturerSku: 'XRAY-300040', // Matches prod-xray-x4-2026
      title: 'XRAY 1/10 Electric Touring Car Chassis Kit',
      cost: 49500,
      currency: 'GBP' as const,
      availability: 'in stock',
    }

    const normalized = normalizeSupplierItem(raw)
    const mapping = await matchSupplierProduct('sup-cml', normalized)

    expect(mapping.status).toBe('MATCHED')
    expect(mapping.canonicalProductId).toBe('prod-xray-x4-2026')
    expect(mapping.matchMethod).toBe('EXACT_SKU')
    expect(mapping.matchConfidenceCategory).toBe('EXACT_MATCH')
  })

  it('matches supplier item directly when supplierSku equals the canonical SKU', async () => {
    const raw = {
      supplierSku: 'HW-30401140', // Matches prod-hw-v10-g4-135t
      title: 'XeRun V10 G4 13.5T Motor',
      cost: 6500,
      currency: 'GBP' as const,
      availability: 'in stock',
    }

    const normalized = normalizeSupplierItem(raw)
    const mapping = await matchSupplierProduct('sup-hobbywing-uk', normalized)

    expect(mapping.status).toBe('MATCHED')
    expect(mapping.canonicalProductId).toBe('prod-hw-v10-g4-135t')
    expect(mapping.matchMethod).toBe('EXACT_SKU')
  })
})

describe('Scenario B — Similar title without verified SKU refusal', () => {
  it('does NOT automatically match items solely based on similar title or description', async () => {
    const raw = {
      supplierSku: 'UNKNOWN-COMP-CHASSIS-01',
      title: "XRAY X4 2026 Competition Touring Car Kit Brand New", // Highly similar title
      description: 'The ultimate 1/10 electric touring car from Slovakian engineering.',
      cost: 48000,
      currency: 'GBP' as const,
      availability: 'in stock',
    }

    const normalized = normalizeSupplierItem(raw)
    const mapping = await matchSupplierProduct('sup-cml', normalized)

    // INVARIANT: Cannot establish exact SKU identity -> remains UNMATCHED
    expect(mapping.status).toBe('UNMATCHED')
    expect(mapping.canonicalProductId).toBeNull()
    expect(mapping.matchMethod).toBeNull()
    expect(mapping.matchConfidenceCategory).toBe('UNVERIFIED')
  })

  it('does NOT use AI inference or guessing when SKU is omitted', async () => {
    const raw = {
      supplierSku: 'GENERIC-SERVO-09',
      title: 'High Performance Low Profile Brushless Steering Servo',
      cost: 4500,
      currency: 'GBP' as const,
      availability: 'in stock',
    }

    const normalized = normalizeSupplierItem(raw)
    const mapping = await matchSupplierProduct('sup-cml', normalized)

    expect(mapping.status).toBe('UNMATCHED')
    expect(mapping.canonicalProductId).toBeNull()
  })
})

describe('Deterministic part number matching', () => {
  it('matches exact part number when manufacturerSku is not provided', async () => {
    const raw = {
      supplierSku: 'SUP-PART-300040',
      partNumber: '300040', // Part of XRAY-300040 SKU
      title: 'Competition Touring Chassis Kit',
      cost: 49500,
      currency: 'GBP' as const,
      availability: 'in stock',
    }

    const normalized = normalizeSupplierItem(raw)
    const mapping = await matchSupplierProduct('sup-cml', normalized)

    expect(mapping.status).toBe('MATCHED')
    expect(mapping.canonicalProductId).toBe('prod-xray-x4-2026')
    expect(mapping.matchMethod).toBe('EXACT_PART_NUMBER')
  })
})
