import Link from 'next/link'
import {
  getTradeAccountApplications,
  getSuppliers,
} from '@halo-rc/db'
import type { ProcurementPipelineStage } from '@halo-rc/types'
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
    <div>
      <ProcurementNav currentTab="pipeline" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Supplier Activation Board
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            11-Stage Procurement Pipeline
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Visual progression of supplier commercial activation from initial market discovery through legal account opening and live automated catalog feeds.
          </p>
        </div>
      </div>

      {/* Pipeline Board */}
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(240px, 1fr)',
          gap: 'var(--space-3)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-4)',
        }}
      >
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.stage === stage.key)
          return (
            <div
              key={stage.key}
              style={{
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--colour-steel)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--colour-smoke)',
                    fontWeight: 600,
                  }}
                >
                  {stage.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: stageApps.length > 0 ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                    color: stageApps.length > 0 ? 'var(--colour-halo)' : 'var(--colour-ash)',
                  }}
                >
                  {stageApps.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                {stageApps.map((app) => {
                  const supplier = suppliers.find((s) => s.id === app.supplierId)
                  return (
                    <Link
                      key={app.id}
                      href={`/admin/procurement/applications/${app.id}`}
                      style={{
                        padding: 'var(--space-3)',
                        backgroundColor: 'var(--colour-charcoal)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      <span style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-xs)', display: 'block', marginBottom: 2 }}>
                        {supplier?.name ?? app.supplierId}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block', marginBottom: 4 }}>
                        {supplier?.country ?? 'Global'} • {app.status}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
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
                      border: '1px dashed var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--colour-ash)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
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
    </div>
  )
}
