import Link from 'next/link'
import {
  getProcurementSummary,
  getProcurementDashboardData,
  getSupplierSyncRuns,
  getSupplierChangeEvents,
  getTradeAccountApplications,
  getProcurementTasks,
  getProcurementDataQualityReport,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminAction,
  AdminStatus,
} from '@/components/admin'
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
    { label: 'Research', count: supplierCounts['RESEARCH'] || 0, color: '#767A85', href: '/admin/procurement/suppliers?status=RESEARCH' },
    { label: 'Target', count: supplierCounts['TARGET'] || 0, color: '#494D55', href: '/admin/procurement/suppliers?status=TARGET' },
    { label: 'Contact to Make', count: supplierCounts['CONTACT_TO_MAKE'] || 0, color: '#f59e0b', href: '/admin/procurement/suppliers?status=CONTACT_TO_MAKE' },
    { label: 'Contacted', count: supplierCounts['CONTACTED'] || 0, color: '#3b82f6', href: '/admin/procurement/suppliers?status=CONTACTED' },
    { label: 'App Available', count: supplierCounts['APPLICATION_AVAILABLE'] || 0, color: '#8b5cf6', href: '/admin/procurement/suppliers?status=APPLICATION_AVAILABLE' },
    { label: 'App Submitted', count: supplierCounts['APPLICATION_SUBMITTED'] || 0, color: '#ec4899', href: '/admin/procurement/suppliers?status=APPLICATION_SUBMITTED' },
    { label: 'Awaiting Response', count: supplierCounts['AWAITING_RESPONSE'] || 0, color: '#f97316', href: '/admin/procurement/suppliers?status=AWAITING_RESPONSE' },
    { label: 'Approved', count: supplierCounts['APPROVED'] || 0, color: '#B8935A', href: '/admin/procurement/suppliers?status=APPROVED' },
    { label: 'Account Open', count: supplierCounts['ACCOUNT_OPEN'] || 0, color: '#B8935A', href: '/admin/procurement/suppliers?status=ACCOUNT_OPEN' },
    { label: 'Terms Received', count: supplierCounts['TERMS_RECEIVED'] || 0, color: '#10b981', href: '/admin/procurement/suppliers?status=TERMS_RECEIVED' },
    { label: 'Trading', count: supplierCounts['TRADING'] || 0, color: '#059669', href: '/admin/procurement/suppliers?status=TRADING' },
    { label: 'Paused', count: supplierCounts['PAUSED'] || 0, color: '#767A85', href: '/admin/procurement/suppliers?status=PAUSED' },
    { label: 'Rejected', count: supplierCounts['REJECTED'] || 0, color: '#C8001A', href: '/admin/procurement/suppliers?status=REJECTED' },
    { label: 'Closed', count: supplierCounts['CLOSED'] || 0, color: '#E2E2DE', href: '/admin/procurement/suppliers?status=CLOSED' },
  ]

  return (
    <>
      <AdminPageHeader
        category="Avorria RC Procurement Operations"
        title="Supplier Master & Procurement Hub"
        description="Internal procurement control centre. Manage supplier master records, trade account openings, commercial terms, communications, and brand distribution rights."
        actions={
          <>
            <AdminAction href="/admin/procurement/suppliers" variant="secondary">
              View Directory ({dashboardData.totalSuppliers})
            </AdminAction>
            <AdminAction
              href="/admin/procurement/tasks"
              variant={dashboardData.overdueTasks > 0 ? 'primary' : 'secondary'}
            >
              Tasks ({dashboardData.openTasks})
            </AdminAction>
          </>
        }
      />

      <ProcurementNav currentTab="overview" />

      {/* Pipeline Status Ribbon */}
      <AdminSection>
        <AdminPanel
          title="Supplier Pipeline Distribution"
          badge={
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono, monospace)', color: '#767A85', backgroundColor: '#EFEFED', padding: '1px 6px', borderRadius: 3 }}>
              {dashboardData.totalSuppliers} Total
            </span>
          }
          padding="md"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {pipelineStages.map((stage) => (
              <Link
                key={stage.label}
                href={stage.href}
                style={{
                  textDecoration: 'none',
                  padding: '8px 12px',
                  backgroundColor: '#FAFAF9',
                  borderRadius: 4,
                  border: '1px solid #E2E2DE',
                  display: 'block',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
                    {stage.label}
                  </span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stage.color }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.125rem', fontWeight: 700, color: stage.count > 0 ? '#111317' : '#767A85' }}>
                  {stage.count}
                </span>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </AdminSection>

      {/* Operational Highlights Grid */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* Open Applications */}
          <AdminPanel
            title={`Open Applications (${applications.length})`}
            action={
              <AdminAction href="/admin/procurement/applications" variant="subtle" size="sm">
                Manage →
              </AdminAction>
            }
            padding="md"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                      {app.applicantEntityName} → {app.supplierId}
                    </span>
                    <AdminStatus status={app.status === 'APPROVED' ? 'verified' : app.status === 'REJECTED' ? 'alert' : 'warning'} label={app.status} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                    Stage: {app.stage} • Ref: {app.accountReference ?? 'None'}
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#767A85' }}>No active applications.</span>
              )}
            </div>
          </AdminPanel>

          {/* Priority Procurement Tasks */}
          <AdminPanel
            title={`Urgent & Open Tasks (${openTasks.length})`}
            action={
              <AdminAction href="/admin/procurement/tasks" variant="subtle" size="sm">
                All Tasks →
              </AdminAction>
            }
            padding="md"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openTasks.slice(0, 4).map((task) => (
                <div key={task.id} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                      {task.title}
                    </span>
                    <AdminStatus
                      status={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'alert' : 'neutral'}
                      label={task.priority}
                    />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                    Due: {task.dueDate ?? 'Unset'} • Assigned: {task.assignedTo ?? 'Unassigned'}
                  </div>
                </div>
              ))}
              {openTasks.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#767A85' }}>No open procurement tasks.</span>
              )}
            </div>
          </AdminPanel>

          {/* Upcoming Follow-ups */}
          <AdminPanel
            title="Upcoming Supplier Follow-ups"
            action={
              <AdminAction href="/admin/procurement/contacts" variant="subtle" size="sm">
                Contacts →
              </AdminAction>
            }
            padding="md"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dashboardData.upcomingFollowUps.map((fu, idx) => (
                <div key={idx} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                      {fu.supplierName}
                    </span>
                    <span style={{ fontSize: '0.625rem', color: '#B86818', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                      {fu.followUpDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                    {fu.subject} ({fu.type})
                  </div>
                </div>
              ))}
              {dashboardData.upcomingFollowUps.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#767A85' }}>No scheduled follow-up dates in next 14 days.</span>
              )}
            </div>
          </AdminPanel>
        </div>
      </AdminSection>

      {/* Feed Sync & Technical Integrity Section */}
      <AdminSection>
        <AdminPanel
          title="Technical Ingestion & Feed Status"
          subtitle="Catalogue SKU mapping integrity, recent feed sync events, and price drift detection."
          action={
            <AdminAction href="/admin/procurement/unmatched" variant="subtle" size="sm">
              Unmatched SKUs: {summary.unmatchedMappings}
            </AdminAction>
          }
          padding="md"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4 }}>
                SYNC HEALTH
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: summary.syncHealth === 'OPTIMAL' ? '#1A6E34' : '#C8001A' }}>
                {summary.syncHealth}
              </span>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4 }}>
                UNVERIFIED CLAIMS
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: qualityReport.unverifiedRelationshipsCount > 0 ? '#B86818' : '#111317' }}>
                {qualityReport.unverifiedRelationshipsCount} relationships
              </span>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4 }}>
                ACTIVE OFFERS
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111317' }}>
                {summary.activeOffers} offers
              </span>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4 }}>
                STALE OFFERS
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: summary.staleOffers > 0 ? '#C8001A' : '#1A6E34' }}>
                {summary.staleOffers} stale
              </span>
            </div>
          </div>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
