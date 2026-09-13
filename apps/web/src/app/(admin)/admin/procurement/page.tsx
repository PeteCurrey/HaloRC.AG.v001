import Link from 'next/link'
import {
  getSuppliers,
  getProcurementSummary,
  getSupplierSyncRuns,
  getSupplierChangeEvents,
  getTradeAccountApplications,
  getProcurementTasks,
  getProcurementDataQualityReport,
} from '@halo-rc/db'
import { triggerSupplierSyncAction } from '@/actions/procurement'
import { ProcurementNav } from './ProcurementNav'

export default async function ProcurementDashboardPage() {
  const summary = await getProcurementSummary()
  const suppliers = await getSuppliers()
  const syncRuns = await getSupplierSyncRuns()
  const changeEvents = await getSupplierChangeEvents(undefined, 10)
  const applications = await getTradeAccountApplications()
  const pendingTasks = await getProcurementTasks(undefined, 'OPEN')
  const qualityReport = await getProcurementDataQualityReport()

  const approvedApps = applications.filter((a) => a.status === 'APPROVED').length
  const pendingApps = applications.filter((a) => a.status !== 'APPROVED' && a.status !== 'REJECTED').length

  return (
    <div>
      <ProcurementNav currentTab="overview" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement &amp; Inventory Systems
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Multi-Supplier Ingestion &amp; Sourcing
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Authoritative procurement backbone. Ingest external supplier feeds, run deterministic SKU matching, detect cost drift, and govern commercial offer routing without compromising canonical product truth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link
            href="/admin/procurement/unmatched"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: summary.unmatchedMappings > 0 ? 'var(--colour-race-10)' : 'var(--colour-charcoal)',
              border: `1px solid ${summary.unmatchedMappings > 0 ? 'var(--colour-race)' : 'var(--colour-steel)'}`,
              borderRadius: 'var(--radius-sm)',
              color: summary.unmatchedMappings > 0 ? 'var(--colour-race)' : 'var(--colour-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
            }}
          >
            Unmatched Queue ({summary.unmatchedMappings})
          </Link>
          <Link
            href="/admin/procurement/import"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo-10)',
              border: '1px solid var(--colour-halo)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-halo)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none',
            }}
          >
            + Ingest CSV Feed
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
            Suppliers
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--colour-white)', display: 'block' }}>
            {summary.totalSuppliers}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            {summary.activeSuppliers} active partners
          </span>
        </div>

        <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
            SKU Mappings
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--colour-white)', display: 'block' }}>
            {summary.totalMappings}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            {summary.unmatchedMappings} awaiting triage
          </span>
        </div>

        <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
            Active Sourcing Offers
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--colour-white)', display: 'block' }}>
            {summary.activeOffers}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            {summary.staleOffers} stale / expired
          </span>
        </div>

        <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
            Sync Health
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: summary.syncHealth === 'OPTIMAL' ? 'var(--colour-halo)' : 'var(--colour-race)',
              display: 'block',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-1)',
            }}
          >
            {summary.syncHealth}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            {syncRuns.length} runs recorded
          </span>
        </div>
      </div>

      {/* Supplier Directory Table */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)' }}>
            Registered Suppliers ({suppliers.length})
          </h2>
        </div>

        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-void)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Supplier</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Type</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Country / Currency</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Integration</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Last Sync</th>
                <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/admin/procurement/suppliers/${s.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none' }}>
                      {s.name}
                    </Link>
                    {s.legalName && (
                      <span style={{ display: 'block', color: 'var(--colour-ash)', fontSize: '0.6875rem' }}>{s.legalName}</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-ash)' }}>
                    {s.supplierType}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {s.country} • {s.currency}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', padding: '2px 6px', backgroundColor: 'var(--colour-void)', border: '1px solid var(--colour-steel)', borderRadius: '2px', color: 'var(--colour-silver)' }}>
                      {s.integrationType}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: s.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                        color: s.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)',
                        border: `1px solid ${s.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)'}`,
                      }}
                    >
                      {s.relationshipStatus}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                    {s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                  </td>
                  <td style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)' }}>
                    <form action={async () => {
                      'use server'
                      await triggerSupplierSyncAction(s.id)
                    }} style={{ display: 'inline' }}>
                      <button
                        type="submit"
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--colour-charcoal)',
                          border: '1px solid var(--colour-steel)',
                          borderRadius: '2px',
                          color: 'var(--colour-white)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          cursor: 'pointer',
                        }}
                      >
                        Sync
                      </button>
                    </form>
                    <Link
                      href={`/admin/procurement/suppliers/${s.id}`}
                      style={{
                        marginLeft: 'var(--space-2)',
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: '2px',
                        color: 'var(--colour-silver)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        textDecoration: 'none',
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Recent Diff Events & Recent Sync Runs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Diff Events */}
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
            Recent Procurement Drift &amp; Change Events
          </h2>
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            {changeEvents.length === 0 ? (
              <p style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-xs)', margin: 0 }}>No recent change events recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {changeEvents.map((ev) => (
                  <div key={ev.id} style={{ borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-halo)' }}>
                        {ev.changeType}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                        {new Date(ev.detectedAt).toLocaleTimeString('en-GB')}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-white)', fontWeight: 500 }}>
                      {ev.supplierName} • SKU: {ev.supplierSku}
                    </div>
                    {ev.details && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--colour-ash)' }}>
                        {ev.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync Runs */}
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
            Sync Execution Log
          </h2>
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            {syncRuns.length === 0 ? (
              <p style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-xs)', margin: 0 }}>No sync runs logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {syncRuns.slice(0, 8).map((run) => (
                  <div key={run.runId} style={{ borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--colour-white)', fontSize: 'var(--text-xs)' }}>
                        {run.supplierName}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          color: run.status === 'COMPLETED' ? 'var(--colour-halo)' : 'var(--colour-race)',
                        }}
                      >
                        {run.status}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-ash)' }}>
                      Processed: {run.recordsProcessed} | Matched: {run.recordsMatched} | Unmatched: {run.recordsUnmatched} | Changed: {run.recordsChanged}
                    </div>
                    {run.errors.length > 0 && (
                      <div style={{ color: 'var(--colour-race)', fontSize: '0.625rem', marginTop: '2px' }}>
                        {run.errors[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
