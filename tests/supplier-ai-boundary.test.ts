// tests/supplier-ai-boundary.test.ts
// Phase 11 — Grounded AI Consultation Boundary for Brand Distribution & Sourcing (Scenario M)

import { describe, it, expect, beforeEach } from 'vitest'
import { consultBrandDistribution } from '@/lib/ai/consultation'
import { __resetProcurementStoreForTesting } from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: Grounded AI Consultation Boundary for Brand Distribution (Scenario M)', () => {
  it('Confirms verified authorised distributors with official evidence references in UK', async () => {
    const response = await consultBrandDistribution('brand-xray', 'UK')

    expect(response.groundingState).toBe('GROUNDED')
    expect(response.answer).toContain('CML Distribution')
    expect(response.answer).toContain('Authorised Distributors')
    expect(response.sources.length).toBeGreaterThan(0)
    expect(response.sources[0]?.verified).toBe(true)
  })

  it('Isolates territory and confirms exclusive distributor for USA without leaking to UK', async () => {
    const usResponse = await consultBrandDistribution('brand-xray', 'USA')

    expect(usResponse.groundingState).toBe('GROUNDED')
    expect(usResponse.answer).toContain('RC America')
    expect(usResponse.answer).toContain('EXCLUSIVE')
    expect(usResponse.answer).toContain('Exclusivity Notice')

    const ukResponse = await consultBrandDistribution('brand-xray', 'UK')
    expect(ukResponse.answer).not.toContain('RC America (AUTHORISED DISTRIBUTOR [EXCLUSIVE')
  })

  it('Strictly refuses unverified supplier claims, placing them under CAUTION warnings', async () => {
    // RC Mart has an unverified secondary claim for Team XRAY in the UK
    const response = await consultBrandDistribution('brand-xray', 'UK')

    expect(response.answer).toContain('Unverified Reseller Feeds (CAUTION)')
    expect(response.answer).toContain('RC Mart')
    expect(response.answer).toContain('UNVERIFIED')
    expect(response.warnings.some((w) => w.includes('unverified'))).toBe(true)
  })

  it('Strictly prevents confidential commercial data leakage (wholesale cost, margin, credit)', async () => {
    const response = await consultBrandDistribution('brand-xray', 'UK')
    const serialized = JSON.stringify(response)

    // Wholesale costs, margins, and credit lines must NEVER be present in AI responses
    expect(serialized).not.toContain('costMinorUnits')
    expect(serialized).not.toContain('creditLimitMinorUnits')
    expect(serialized).not.toContain('wholesaleMargin')
    expect(serialized).not.toContain('49500') // Internal £495 wholesale cost
    expect(serialized).not.toContain('earlyPaymentDiscountPercent')
    expect(serialized).not.toContain('2500000') // Internal £25k credit line
  })

  it('Returns INSUFFICIENT_EVIDENCE when consulted on uncatalogued or unknown brands', async () => {
    const response = await consultBrandDistribution('nonexistent-racing-brand', 'UK')

    expect(response.groundingState).toBe('INSUFFICIENT_EVIDENCE')
    expect(response.answer).toContain('not found')
    expect(response.warnings).toContain('Brand not recognized in technical catalogue.')
  })
})
