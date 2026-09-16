import Link from 'next/link'
import {
  getSuppliers,
  getProcurementSummary,
  getProcurementDashboardData,
  getSupplierSyncRuns,
  getSupplierChangeEvents,
  getTradeAccountApplications,
  getProcurementTasks,
  getProcurementDataQualityReport,
} from '@halo-rc/db'
import { ProcurementNav } from './ProcurementNav'

export default async function ProcurementDashboardPage() {
  const [dashboardData, summary, syncRuns, changeEvents, applications, openTasks, qualityReport] = await Promise.all([
    getProcurementDashboardData(),
    getProcurementSummary(),
    getSupplierSyncRuns(),
    getSupplierChangeEvents(undefined, 8),
    getTradeAccountApplications(),
    getProcurementTasks(undefined, 'OPEN'),
    getProcurementDataQualityReport(),
  ])

  const { supplierCounts } = dashboardData

  const pipelineStages: Array<{ label: string; count: number; color: string; href: string }> = [
    { label: 'Research', count: supplierCounts['RESEARCH'] || 0, color: 'var(--colour-ash)', href: '/admin/procurement/suppliers?status=RESEARCH' },
    { label: 'Target', count: supplierCounts['TARGET'] || 0, color: 'var(--colour-smoke)', href: '/admin/procurement/suppliers?status=TARGET' },
    { label: 'Contact to Make', count: supplierCounts['CONTACT_TO_MAKE'] || 0, color: '#f59e0b', href: '/admin/procurement/suppliers?status=CONTACT_TO_MAKE' },
    { label: 'Contacted', count: supplierCounts['CONTACTED'] || 0, color: '#3b82f6', href: '/admin/procurement/suppliers?status=CONTACTED' },
    { label: 'App Available', count: supplierCounts['APPLICATION_AVAILABLE'] || 0, color: '#8b5cf6', href: '/admin/procurement/suppliers?status=APPLICATION_AVAILABLE' },
    { label: 'App Submitted', count: supplierCounts['APPLICATION_SUBMITTED'] || 0, color: '#ec4899', href: '/admin/procurement/suppliers?status=APPLICATION_SUBMITTED' },
    { label: 'Awaiting Response', count: supplierCounts['AWAITING_RESPONSE'] || 0, color: '#f97316', href: '/admin/procurement/suppliers?status=AWAITING_RESPONSE' },
    { label: 'Approved', count: supplierCounts['APPROVED'] || 0, color: 'var(--colour-halo)', href: '/admin/procurement/suppliers?status=APPROVED' },
    { label: 'Account Open', count: supplierCounts['ACCOUNT_OPEN'] || 0, color: 'var(--colour-halo)', href: '/admin/procurement/suppliers?status=ACCOUNT_OPEN' },
    { label: 'Terms Received', count: supplierCounts['TERMS_RECEIVED'] || 0, color: '#10b981', href: '/admin/procurement/suppliers?status=TERMS_RECEIVED' },
    { label: 'Trading', count: supplierCounts['TRADING'] || 0, color: '#059669', href: '/admin/procurement/suppliers?status=TRADING' },
    { label: 'Paused', count: supplierCounts['PAUSED'] || 0, color: 'var(--colour-slate)', href: '/admin/procurement/suppliers?status=PAUSED' },
    { label: 'Rejected', count: supplierCounts['REJECTED'] || 0, color: 'var(--colour-race)', href: '/admin/procurement/suppliers?status=REJECTED' },
    { label: 'Closed', count: supplierCounts['CLOSED'] || 0, color: 'var(--colour-steel)', href: '/admin/procurement/suppliers?status=CLOSED' },
  ]

  return (
    <div>
      <ProcurementNav currentTab="overview" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Avorria RC Procurement Operations
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Supplier Master &amp; Procurement Hub
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '68ch', lineHeight: 'var(--leading-relaxed)' }}>
            Internal procurement control centre. Manage supplier master records, trade account openings, commercial terms, communications, and brand distribution rights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/admin/procurement/suppliers"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-charcoal)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
            }}
          >
            View Directory ({dashboardData.totalSuppliers})
          </Link>
          <Link
            href="/admin/procurement/tasks"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: dashboardData.overdueTasks > 0 ? 'var(--colour-race-10)' : 'var(--colour-charcoal)',
              border: `1px solid ${dashboardData.overdueTasks > 0 ? 'var(--colour-race)' : 'var(--colour-steel)'}`,
              borderRadius: 'var(--radius-sm)',
              color: dashboardData.overdueTasks > 0 ? 'var(--colour-race)' : 'var(--colour-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
            }}
          >
            Tasks ({dashboardData.openTasks})
          </Link>
        </div>
      </div>

      {/* Pipeline Status Ribbon */}
      <div style={{ marginBottom: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--colour-ash)', display: 'block', marginBottom: 'var(--space-3)' }}>
          Supplier Pipeline Distribution ({dashboardData.totalSuppliers} Total Suppliers)
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
          {pipelineStages.map((stage) => (
            <Link
              key={stage.label}
              href={stage.href}
              style={{
                textDecoration: 'none',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--colour-charcoal)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--colour-steel)',
                display: 'block',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '10px', color: 'var(--colour-ash)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  {stage.label}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stage.color }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: stage.count > 0 ? 'var(--colour-white)' : 'var(--colour-slate)' }}>
                {stage.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Open Applications */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Open Applications ({applications.length})
            </span>
            <Link href="/admin/procurement/applications" style={{ fontSize: '11px', color: 'var(--colour-ash)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
              Manage &rarr;
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {app.applicantEntityName} &rarr; {app.supplierId}
                  </span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--colour-carbon)', color: 'var(--colour-halo)', fontFamily: 'var(--font-mono)' }}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                  Stage: {app.stage} • Ref: {app.accountReference ?? 'None'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Procurement Tasks */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Urgent &amp; Open Tasks ({openTasks.length})
            </span>
            <Link href="/admin/procurement/tasks" style={{ fontSize: '11px', color: 'var(--colour-ash)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
              All Tasks &rarr;
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {openTasks.slice(0, 4).map((task) => (
              <div key={task.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--colour-carbon)', color: task.priority === 'HIGH' || task.priority === 'URGENT' ? 'var(--colour-race)' : 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                    {task.priority}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                  Due: {task.dueDate ?? 'Unset'} • Assigned: {task.assignedTo ?? 'Unassigned'}
                </div>
              </div>
            ))}
            {openTasks.length === 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>No open procurement tasks.</span>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Upcoming Supplier Follow-ups
            </span>
            <Link href="/admin/procurement/contacts" style={{ fontSize: '11px', color: 'var(--colour-ash)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
              Contacts &rarr;
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {dashboardData.upcomingFollowUps.map((fu, idx) => (
              <div key={idx} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {fu.supplierName}
                  </span>
                  <span style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                    {fu.followUpDate}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                  {fu.subject} ({fu.type})
                </div>
              </div>
            ))}
            {dashboardData.upcomingFollowUps.length === 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>No scheduled follow-up dates in next 14 days.</span>
            )}
          </div>
        </div>
      </div>

      {/* Feed Sync & Technical Integrity Section */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Technical Ingestion &amp; Feed Status
            </span>
            <p style={{ fontSize: '11px', color: 'var(--colour-ash)', margin: 0, marginTop: 2 }}>
              Catalogue SKU mapping integrity, recent feed sync events, and price drift detection.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link
              href="/admin/procurement/unmatched"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: summary.unmatchedMappings > 0 ? 'var(--colour-race)' : 'var(--colour-smoke)',
                textDecoration: 'none',
                padding: '2px 8px',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Unmatched SKUs: {summary.unmappedProductsCount || summary.unmatchedMappings}
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: '11px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              SYNC HEALTH
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: summary.syncHealth === 'OPTIMAL' ? 'var(--colour-halo)' : 'var(--colour-race)' }}>
              {summary.syncHealth}
            </span>
          </div>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: '11px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              UNVERIFIED CLAIMS
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: qualityReport.unverifiedRelationshipsCount > 0 ? '#f59e0b' : 'var(--colour-white)' }}>
              {qualityReport.unverifiedRelationshipsCount} relationships
            </span>
          </div>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: '11px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              ACTIVE OFFERS
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
              {summary.activeOffers} offers
            </span>
          </div>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: '11px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              STALE OFFERS
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: summary.staleOffers > 0 ? 'var(--colour-race)' : 'var(--colour-halo)' }}>
              {summary.staleOffers} stale
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
