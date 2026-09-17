import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTradeAccountApplicationById,
  getSupplierById,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminStatus,
  AdminAction,
} from '@/components/admin'
import { ProcurementNav } from '../../ProcurementNav'
import {
  updateTradeAccountStatusAction,
  updateTradeAccountRequirementAction,
} from '@/actions/procurement'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TradeApplicationDetailPage({ params }: PageProps) {
  const { id } = await params
  const app = await getTradeAccountApplicationById(id)
  if (!app) notFound()

  const supplier = await getSupplierById(app.supplierId)

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Procurement', href: '/admin/procurement' },
          { label: 'Applications', href: '/admin/procurement/applications' },
          { label: supplier?.name ?? 'Application Detail' },
        ]}
        title={`${supplier?.name ?? 'Supplier'} • Trade Application`}
        description={`Application ID: ${app.id} • Entity: ${app.applicantEntityName} • Pipeline Stage: ${app.stage.replace('_', ' ')}`}
        status={
          <AdminStatus
            status={app.status === 'APPROVED' ? 'verified' : app.status === 'REJECTED' ? 'alert' : 'warning'}
            label={app.status}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            {app.status !== 'APPROVED' && (
              <form
                action={async () => {
                  'use server'
                  await updateTradeAccountStatusAction(app.id, 'APPROVED', 'ACCOUNT_OPENED', {
                    accountReference: `ACC-${supplier?.slug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
                    creditLimitMinorUnits: 1500000,
                  })
                }}
              >
                <AdminAction type="submit" variant="primary">
                  Approve Application
                </AdminAction>
              </form>
            )}

            {app.status === 'RESEARCHING' && (
              <form
                action={async () => {
                  'use server'
                  await updateTradeAccountStatusAction(app.id, 'SUBMITTED', 'APPLICATION_SUBMITTED')
                }}
              >
                <AdminAction type="submit" variant="secondary">
                  Mark as Submitted
                </AdminAction>
              </form>
            )}
          </div>
        }
      />

      <ProcurementNav currentTab="applications" />

      {/* Application Snapshot Grid */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <AdminPanel padding="md">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Account Reference
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.125rem', color: '#111317', fontWeight: 600 }}>
              {app.accountReference ?? 'Awaiting Approval'}
            </span>
          </AdminPanel>

          <AdminPanel padding="md">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Approved Credit Line
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.125rem', color: '#111317', fontWeight: 600 }}>
              {app.creditLimitMinorUnits
                ? `${app.creditCurrency === 'USD' ? '$' : '£'}${(app.creditLimitMinorUnits / 100).toLocaleString()}`
                : 'Prepayment / Proforma'}
            </span>
          </AdminPanel>

          <AdminPanel padding="md">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Assigned Lead
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', color: '#111317', fontWeight: 600 }}>
              {app.assignedTo ?? 'Unassigned'}
            </span>
          </AdminPanel>

          <AdminPanel padding="md">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Submission Date
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.875rem', color: '#111317', fontWeight: 600 }}>
              {app.submittedAt ? app.submittedAt.slice(0, 10) : 'Not submitted'}
            </span>
          </AdminPanel>
        </div>
      </AdminSection>

      {/* Compliance & Requirements Checklist */}
      <AdminSection>
        <AdminPanel
          title="Trade Account Requirements Checklist"
          subtitle="Every item must be explicitly provided and verified before commercial purchase order activation."
          padding="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {app.requirements.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  backgroundColor: '#FAFAF9',
                  border: '1px solid #E2E2DE',
                  borderRadius: 4,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {req.title}
                    </span>
                    <AdminStatus
                      status={req.status === 'VERIFIED' ? 'verified' : 'neutral'}
                      label={req.status}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#494D55' }}>
                    {req.description ?? req.requirementType} {req.verifiedBy ? `• Verified by ${req.verifiedBy} on ${req.verifiedAt?.slice(0, 10)}` : ''}
                  </span>
                </div>

                {req.status !== 'VERIFIED' && (
                  <form
                    action={async () => {
                      'use server'
                      await updateTradeAccountRequirementAction(req.id, 'VERIFIED')
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#111317',
                        border: 'none',
                        borderRadius: 3,
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Verify Requirement ✓
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
