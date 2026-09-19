import { describe, it, expect } from 'vitest'
import { MugenCanonicalPromoter } from '../packages/db/src/importers/mugen-canonical-promoter'

describe('Execute MUGEN Promotion Engine', () => {
  it('promotes all MUGEN supplier items to canonical products with pricing engine', async () => {
    const promoter = new MugenCanonicalPromoter()
    const report = await promoter.promoteAll()
    console.log('PROMOTION REPORT:', JSON.stringify(report, null, 2))
    expect(report.totalProcessed).toBe(2648)
    expect(report.publishedCount).toBeGreaterThanOrEqual(2640)
    expect(report.breakdown.machines).toBe(10)
    expect(report.zeroPriceBlockedCount).toBe(0) // zero price items were already filtered to ingest_exceptions
  }, 120000)
})
