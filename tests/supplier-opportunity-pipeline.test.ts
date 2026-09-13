// tests/supplier-opportunity-pipeline.test.ts
// Phase 11 — Supplier Opportunity Scoring, 11-Stage Pipeline Tracking,
// Duplicate Detection, and Procurement Data Quality Reporting (Scenarios P, I)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateSupplierOpportunityScore,
  createProcurementTask,
  updateProcurementTask,
  getProcurementTasks,
  detectDuplicateSupplier,
  getProcurementDataQualityReport,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: Supplier Opportunity Scoring & Pipeline Management (Scenarios P, I)', () => {
  it('Scenario P: Deterministic opportunity scorer evaluates 5 weighted dimensions and assigns tier', async () => {
    // sup-cml: carries Tier 1 brand (XRAY), has mappings, good terms, CSV integration, UK territory
    const score = await calculateSupplierOpportunityScore('sup-cml')

    expect(score.supplierId).toBe('sup-cml')
    expect(score.overallScore).toBeGreaterThanOrEqual(50)
    expect(['HIGH', 'MEDIUM']).toContain(score.tier)

    // Breakdown components
    expect(score.breakdown.brandStrategicValue).toBeGreaterThanOrEqual(15)
    expect(score.breakdown.catalogueBreadth).toBeGreaterThanOrEqual(5)
    expect(score.breakdown.commercialMarginPotential).toBeGreaterThanOrEqual(10)
    expect(score.breakdown.easeOfIntegration).toBeGreaterThanOrEqual(5)
    expect(score.breakdown.territoryCoverageStrength).toBeGreaterThanOrEqual(5)

    // Human-readable justifications
    expect(score.reasons.length).toBeGreaterThanOrEqual(2)
  })

  it('Scenario I: Procurement tasks track workflow actions and state transitions across suppliers', async () => {
    const task = await createProcurementTask({
      supplierId: 'sup-cml',
      taskType: 'TERMS_NEGOTIATION',
      title: 'Request 35% discount tier on 2026 XRAY kits',
      description: 'Follow up with sales manager after initial £25k trade account opening.',
      status: 'OPEN',
      priority: 'HIGH',
      dueDate: '2026-04-01T00:00:00Z',
      assignedTo: 'buyer@halo-rc.com',
      completedAt: null,
    })

    expect(task.id).toBeDefined()
    expect(task.status).toBe('OPEN')
    expect(task.priority).toBe('HIGH')

    // Update status to IN_PROGRESS then COMPLETED
    const inProgress = await updateProcurementTask(task.id, { status: 'IN_PROGRESS' })
    expect(inProgress.status).toBe('IN_PROGRESS')

    const completed = await updateProcurementTask(task.id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    })
    expect(completed.status).toBe('COMPLETED')
    expect(completed.completedAt).toBeTruthy()

    // Filter tasks by supplier and status
    const allCmlTasks = await getProcurementTasks('sup-cml')
    expect(allCmlTasks.some((t) => t.id === task.id)).toBe(true)
  })

  it('Detects duplicate supplier by name, website URL, or contact email', async () => {
    // Exact name duplicate
    const nameMatch = await detectDuplicateSupplier('CML Distribution')
    expect(nameMatch.isDuplicate).toBe(true)
    expect(nameMatch.matchedSupplier?.id).toBe('sup-cml')
    expect(nameMatch.reason).toContain('matches existing record')

    // Website match with protocol variance
    const urlMatch = await detectDuplicateSupplier('Alternative Name Ltd', 'http://cmldistribution.co.uk/')
    expect(urlMatch.isDuplicate).toBe(true)
    expect(urlMatch.matchedSupplier?.id).toBe('sup-cml')

    // Contact email match
    const emailMatch = await detectDuplicateSupplier(
      'Brand New Wholesaler',
      null,
      'trade@cmldistribution.co.uk'
    )
    expect(emailMatch.isDuplicate).toBe(true)
    expect(emailMatch.matchedSupplier?.id).toBe('sup-cml')

    // Genuine unique new supplier
    const noMatch = await detectDuplicateSupplier(
      'Yokomo Europe GmbH',
      'https://yokomo-europe.eu',
      'info@yokomo-europe.eu'
    )
    expect(noMatch.isDuplicate).toBe(false)
    expect(noMatch.matchedSupplier).toBeNull()
  })

  it('Procurement data quality report identifies unverified claims, pending requirements, and alerts', async () => {
    const report = await getProcurementDataQualityReport()

    expect(report).toBeDefined()
    expect(typeof report.unverifiedRelationshipsCount).toBe('number')
    expect(typeof report.unverifiedTermsCount).toBe('number')
    expect(typeof report.pendingRequirementsCount).toBe('number')
    expect(typeof report.staleOffersCount).toBe('number')
    expect(typeof report.unmappedProductsCount).toBe('number')
    expect(Array.isArray(report.alerts)).toBe(true)

    // Verify presence of warnings for unverified relationships
    if (report.unverifiedRelationshipsCount > 0) {
      expect(report.alerts.some((a) => a.severity === 'WARNING')).toBe(true)
    }
  })
})
