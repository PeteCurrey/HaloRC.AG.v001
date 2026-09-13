import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTradeAccountApplicationById,
  getSupplierById,
} from '@halo-rc/db'
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
    <div>
      <ProcurementNav currentTab="applications" />

      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link
          href="/admin/procurement/applications"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            color: 'var(--colour-ash)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            textDecoration: 'none',
            marginBottom: 'var(--space-3)',
          }}
        >
          &larr; Back to Applications
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)' }}>
                {supplier?.name ?? 'Supplier'} • Trade Application
              </h1>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  backgroundColor: app.status === 'APPROVED' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                  color: app.status === 'APPROVED' ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                  border: `1px solid ${app.status === 'APPROVED' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                }}
              >
                {app.status}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
              Application ID: {app.id} • Entity: {app.applicantEntityName} • Pipeline Stage: {app.stage.replace('_', ' ')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
                <button
                  type="submit"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: 'var(--colour-halo-10)',
                    border: '1px solid var(--colour-halo)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-halo)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Approve Application
                </button>
              </form>
            )}

            {app.status === 'RESEARCHING' && (
              <form
                action={async () => {
                  'use server'
                  await updateTradeAccountStatusAction(app.id, 'SUBMITTED', 'APPLICATION_SUBMITTED')
                }}
              >
                <button
                  type="submit"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: 'var(--colour-charcoal)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  Mark as Submitted
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Application Snapshot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
            Account Reference
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', color: 'var(--colour-white)', fontWeight: 600 }}>
            {app.accountReference ?? 'Awaiting Approval'}
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
            Approved Credit Line
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', color: 'var(--colour-white)', fontWeight: 600 }}>
            {app.creditLimitMinorUnits
              ? `${app.creditCurrency === 'USD' ? '$' : '£'}${(app.creditLimitMinorUnits / 100).toLocaleString()}`
              : 'Prepayment / Proforma'}
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
            Assigned Lead
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-white)' }}>
            {app.assignedTo ?? 'Unassigned'}
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
            Submission Date
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-white)' }}>
            {app.submittedAt ? app.submittedAt.slice(0, 10) : 'Not submitted'}
          </span>
        </div>
      </div>

      {/* Compliance & Requirements Checklist */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
          Trade Account Requirements Checklist
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
          Every item must be explicitly provided and verified before commercial purchase order activation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {app.requirements.map((req) => (
            <div
              key={req.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--colour-charcoal)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 2 }}>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    {req.title}
                  </span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: req.status === 'VERIFIED' ? 'var(--colour-halo-10)' : 'var(--colour-carbon)',
                      color: req.status === 'VERIFIED' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                      border: `1px solid ${req.status === 'VERIFIED' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                    }}
                  >
                    {req.status}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
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
                      padding: 'var(--space-1) var(--space-3)',
                      backgroundColor: 'var(--colour-carbon)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--colour-halo)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    Verify Requirement &check;
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
