import { describe, it, expect, beforeEach } from 'vitest'
import {
  __resetCsvImportStoreForTesting,
  createImportJob,
  getImportJob,
  commitImportJob,
  rollbackImportJob,
} from '@halo-rc/db'

describe('Supplier CSV Import Security & Isolation', () => {
  beforeEach(() => {
    __resetCsvImportStoreForTesting()
  })

  it('prevents commit on an already committed job', async () => {
    const job = await createImportJob('sup-1', 'admin@avorria.com', ['test.csv'])
    // Commit once
    await commitImportJob(
      job.id,
      'admin@avorria.com',
      [] as any,
      () => {},
      () => {}
    )

    // Attempting to commit again must throw
    await expect(
      commitImportJob(
        job.id,
        'admin@avorria.com',
        [] as any,
        () => {},
        () => {}
      )
    ).rejects.toThrow(/already committed/)
  })

  it('prevents rollback on a non-committed job', async () => {
    const job = await createImportJob('sup-1', 'admin@avorria.com', ['test.csv'])
    await expect(
      rollbackImportJob(
        job.id,
        'admin@avorria.com',
        'Not committed yet',
        () => {},
        () => {}
      )
    ).rejects.toThrow(/not in COMMITTED state/)
  })

  it('maintains strict job isolation between different suppliers', async () => {
    const job1 = await createImportJob('sup-1', 'admin@avorria.com', ['f1.csv'])
    const job2 = await createImportJob('sup-2', 'admin@avorria.com', ['f2.csv'])

    expect(job1.supplierId).toBe('sup-1')
    expect(job2.supplierId).toBe('sup-2')
    expect(job1.id).not.toBe(job2.id)
  })
})
