import Link from 'next/link'
import {
  getTradeAccountApplications,
  getSuppliers,
} from '@halo-rc/db'
import type { ProcurementPipelineStage } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminSection,
} from '@/components/admin'
import { ProcurementNav } from '../ProcurementNav'

const PIPELINE_STAGES: Array<{ key: ProcurementPipelineStage; label: string }> = [
  { key: 'IDENTIFIED', label: '1. Identified' },
  { key: 'CONTACTED', label: '2. Contacted' },
  { key: 'APPLICATION_PREPARED', label: '3. Pack Prepared' },
  { key: 'APPLICATION_SUBMITTED', label: '4. Submitted' },
  { key: 'UNDER_REVIEW', label: '5. Under Review' },
  { key: 'TERMS_NEGOTIATION', label: '6. Terms Agreed' },
  { key: 'ACCOUNT_OPENED', label: '7. Account Opened' },
  { key: 'CATALOGUE_MAPPED', label: '8. Catalogue Mapped' },
  { key: 'TEST_ORDER_PLACED', label: '9. Test Order' },
  { key: 'INTEGRATION_ACTIVE', label: '10. Feed Active' },
  { key: 'ACTIVE_SUPPLIER', label: '11. Active Supplier' },
]

export default async function ProcurementPipelinePage() {
  const applications = await getTradeAccountApplications()
  const suppliers = await getSuppliers()

  return (
    <>
      <AdminPageHeader
        category="Supplier Activation Board"
        title="11-Stage Procurement Pipeline"
        description="Visual progression of supplier commercial activation from initial market discovery through legal account opening and live automated catalog feeds."
      />

      <ProcurementNav currentTab="pipeline" />

      {/* Pipeline Board */}
      <AdminSection>
        <div
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(240px, 1fr)',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 16,
          }}
        >
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.stage === stage.key)
            return (
              <div
                key={stage.key}
                style={{
                  backgroundColor: 'var(--admin-surface, #FFFFFF)',
                  border: '1px solid var(--admin-border, #E2E2DE)',
                  borderRadius: 'var(--admin-radius-md, 5px)',
                  padding: 12,
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--admin-shadow-card)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.6875rem',
                      color: 'var(--admin-text-primary, #111317)',
                      fontWeight: 600,
                    }}
                  >
                    {stage.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.625rem',
                      padding: '1px 6px',
                      borderRadius: 3,
                      backgroundColor: stageApps.length > 0 ? '#B8935A' : '#EFEFED',
                      color: stageApps.length > 0 ? '#FFFFFF' : '#767A85',
                      fontWeight: 600,
                    }}
                  >
                    {stageApps.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {stageApps.map((app) => {
                    const supplier = suppliers.find((s) => s.id === app.supplierId)
                    return (
                      <Link
                        key={app.id}
                        href={`/admin/procurement/applications/${app.id}`}
                        style={{
                          padding: 10,
                          backgroundColor: '#FAFAF9',
                          border: '1px solid #E2E2DE',
                          borderRadius: 4,
                          textDecoration: 'none',
                          display: 'block',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <span style={{ color: '#111317', fontWeight: 600, fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          {supplier?.name ?? app.supplierId}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#767A85', display: 'block', marginBottom: 4 }}>
                          {supplier?.country ?? 'Global'} • {app.status}
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                          <span>Reqs: {app.requirements.filter((r) => r.status === 'VERIFIED').length}/{app.requirements.length}</span>
                          <span>{app.creditLimitMinorUnits ? `${app.creditCurrency === 'USD' ? '$' : '£'}${app.creditLimitMinorUnits / 100}` : 'Cash'}</span>
                        </div>
                      </Link>
                    )
                  })}

                  {stageApps.length === 0 && (
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed #E2E2DE',
                        borderRadius: 4,
                        color: '#767A85',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      No items
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </AdminSection>
    </>
  )
}
