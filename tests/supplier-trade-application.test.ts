// tests/supplier-trade-application.test.ts
// Phase 11 — Supplier Trade Account Application Lifecycle, Requirements Verification,
// Credit Limits, and State Gating (Scenarios E, F, G, H)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getHaloBusinessProfile,
  getTradeAccountApplications,
  getTradeAccountApplicationById,
  createTradeAccountApplication,
  updateTradeAccountApplicationStatus,
  updateTradeAccountRequirement,
  getSupplierById,
  __resetProcurementPhase11StoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementPhase11StoreForTesting()
})

describe('Phase 11: Trade Account Application Lifecycle (Scenarios E, F, G, H)', () => {
  it('Scenario E: Authoritative business profile provides accurate corporate data for applications', () => {
    const profile = getHaloBusinessProfile()

    expect(profile.legalName).toBe('Halo RC Ltd')
    expect(profile.companyNumber).toBe('14598721')
    expect(profile.vatNumber).toBe('GB 432 9876 54')
    expect(profile.registeredAddress.country).toBe('United Kingdom')
    expect(profile.tradingAddress.postalCode).toBe('NN12 8TJ')
    expect(profile.bankDetails.bankName).toBe('Barclays Bank UK PLC')
    expect(profile.tradeReferences.length).toBeGreaterThanOrEqual(2)
  })

  it('Scenario F: Creates application with full requirements checklist initialized to PENDING', async () => {
    const app = await createTradeAccountApplication({
      supplierId: 'sup-cml',
      notes: 'Applying for direct commercial trade account for UK distribution.',
      assignedTo: 'procurement@halo-rc.com',
    })

    expect(app.id).toBeDefined()
    expect(app.supplierId).toBe('sup-cml')
    expect(app.status).toBe('RESEARCHING')
    expect(app.stage).toBe('IDENTIFIED')
    expect(app.requirements.length).toBeGreaterThanOrEqual(4)

    const reqTypes = app.requirements.map((r) => r.requirementType)
    expect(reqTypes).toContain('COMPANY_REGISTRATION')
    expect(reqTypes).toContain('VAT_NUMBER')
    expect(reqTypes).toContain('BANK_DETAILS')
    expect(reqTypes).toContain('TRADE_REFERENCES')

    for (const req of app.requirements) {
      expect(req.status).toBe('PENDING')
      expect(req.verifiedAt).toBeNull()
    }
  })

  it('Scenario G: Individual requirements can be verified with audit trail', async () => {
    const apps = await getTradeAccountApplications('sup-cml')
    const app = apps[0]
    expect(app).toBeDefined()
    const firstReq = app!.requirements[0]
    expect(firstReq).toBeDefined()

    const updated = await updateTradeAccountRequirement(firstReq!.id, 'VERIFIED', {
      documentId: 'doc-certificate-of-incorporation',
      verifiedBy: 'head_of_procurement@halo-rc.com',
    })

    expect(updated.status).toBe('VERIFIED')
    expect(updated.verifiedBy).toBe('head_of_procurement@halo-rc.com')
    expect(updated.verifiedAt).toBeTruthy()
    expect(updated.documentId).toBe('doc-certificate-of-incorporation')
  })

  it('Scenario H: Approval workflow activates trade account, updates credit limit and supplier status', async () => {
    const apps = await getTradeAccountApplications('sup-cml')
    const app = apps[0]!

    // Step 1: Submit application
    const submitted = await updateTradeAccountApplicationStatus(
      app.id,
      'SUBMITTED',
      'APPLICATION_SUBMITTED'
    )
    expect(submitted.status).toBe('SUBMITTED')

    // Step 2: Under review
    const underReview = await updateTradeAccountApplicationStatus(
      app.id,
      'UNDER_REVIEW',
      'CREDIT_CHECK'
    )
    expect(underReview.status).toBe('UNDER_REVIEW')
    expect(underReview.stage).toBe('CREDIT_CHECK')

    // Step 3: Approve with credit terms
    const approved = await updateTradeAccountApplicationStatus(
      app.id,
      'APPROVED',
      'ACCOUNT_OPENED',
      {
        accountReference: 'CML-HALO-9921',
        creditLimitMinorUnits: 2500000, // £25,000 credit facility
        creditCurrency: 'GBP',
        notes: '30-day net credit facility authorized following D&B check.',
        reviewedBy: 'finance_director@halo-rc.com',
      }
    )

    expect(approved.status).toBe('APPROVED')
    expect(approved.stage).toBe('ACCOUNT_OPENED')
    expect(approved.creditLimitMinorUnits).toBe(2500000)
    expect(approved.creditCurrency).toBe('GBP')
    expect(approved.accountReference).toBe('CML-HALO-9921')
    expect(approved.approvedAt).toBeTruthy()

    // Verify supplier record was activated
    const supplier = await getSupplierById('sup-cml')
    expect(supplier).toBeDefined()
    expect(supplier?.relationshipStatus).toBe('ACTIVE')
    expect(supplier?.accountReference).toBe('CML-HALO-9921')
  })

  it('handles application rejection and marks stage as TERMINATED', async () => {
    const app = await createTradeAccountApplication({
      supplierId: 'sup-rcmart',
      notes: 'Test application for evaluation.',
      assignedTo: 'buyer@halo-rc.com',
    })

    const rejected = await updateTradeAccountApplicationStatus(
      app.id,
      'REJECTED',
      'TERMINATED',
      {
        notes: 'Credit reference rejected due to non-standard overseas credit policy.',
        reviewedBy: 'procurement_admin@halo-rc.com',
      }
    )

    expect(rejected.status).toBe('REJECTED')
    expect(rejected.stage).toBe('TERMINATED')
    expect(rejected.notes).toContain('Credit reference rejected')

    // Check fetched by ID
    const retrieved = await getTradeAccountApplicationById(app.id)
    expect(retrieved?.status).toBe('REJECTED')
  })
})
