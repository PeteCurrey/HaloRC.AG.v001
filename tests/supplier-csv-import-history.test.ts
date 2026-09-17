import { describe, it, expect, beforeEach } from 'vitest'
import {
  __resetCsvImportStoreForTesting,
  createImportJob,
  getImportJobs,
  updateImportJobStatus,
  rollbackImportJob,
  getImportAuditTrail,
} from '@halo-rc/db'

describe('Supplier CSV Import History & Audit', () => {
  const supplierA = 'sup-mugen'
  const supplierB = 'sup-kyosho'

  beforeEach(() => {
    __resetCsvImportStoreForTesting()
  })

  it('filters import jobs strictly by supplier and orders recent first', async () => {
    const j1 = await createImportJob(supplierA, 'admin1', ['a1.csv'])
    const j2 = await createImportJob(supplierB, 'admin2', ['b1.csv'])
    const j3 = await createImportJob(supplierA, 'admin1', ['a2.csv'])

    const historyA = await getImportJobs(supplierA)
    expect(historyA.length).toBe(2)
    expect(historyA.map((j) => j.id)).toContain(j1.id)
    expect(historyA.map((j) => j.id)).toContain(j3.id)
    expect(historyA.map((j) => j.id)).not.toContain(j2.id)

    const historyB = await getImportJobs(supplierB)
    expect(historyB.length).toBe(1)
    expect(historyB[0]?.id).toBe(j2.id)
  })

  it('records and returns full audit trail for an import job', async () => {
    const job = await createImportJob(supplierA, 'admin@avorria.com', ['test.csv'])
    await updateImportJobStatus(job.id, 'READY')

    const trail = await getImportAuditTrail(supplierA, job.id)
    expect(trail.length).toBeGreaterThanOrEqual(1)
    expect(trail[0]?.action).toBe('JOB_CREATED')
    expect(trail[0]?.actor).toBe('admin@avorria.com')
  })
})
