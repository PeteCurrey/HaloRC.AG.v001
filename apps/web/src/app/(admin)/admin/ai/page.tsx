// apps/web/src/app/(admin)/admin/ai/page.tsx
// Admin AI Monitoring & Safety Telemetry Dashboard.

import { getAIAuditSummary } from '@/lib/ai/audit'
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminEmptyState,
} from '@/components/admin'

export default async function AdminAIMonitoringPage() {
  const summary = getAIAuditSummary()

  const metrics = [
    { label: 'Total Queries', value: summary.totalRequests, detail: 'AI consultations logged' },
    { label: 'Grounded %', value: `${summary.totalRequests > 0 ? Math.round((summary.groundedCount / summary.totalRequests) * 100) : 100}%`, detail: `${summary.groundedCount} fully grounded` },
    { label: 'Injections Blocked', value: summary.injectionAttemptsBlocked, detail: 'Hostile override attempts' },
    { label: 'Avg Latency', value: `${summary.avgLatencyMs}ms`, detail: 'Deterministic turnaround' },
  ]

  return (
    <>
      <AdminPageHeader
        category="AI Safety & Grounding Telemetry"
        title="AI Intelligence Monitoring"
        description="Avorria RC non-negotiable principle: AI is an advisory interface, never the authority. All responses are strictly grounded in authoritative database records, verified compatibility rules, and isolated market offers."
      />

      {/* Top Metrics Grid */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {metrics.map((m) => (
            <AdminPanel key={m.label} padding="md">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                {m.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#111317', display: 'block', marginBottom: 4 }}>
                {m.value}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: '#494D55' }}>
                {m.detail}
              </span>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>

      {/* Grounding Breakdown Table */}
      <AdminSection>
        <AdminPanel title="Grounding & Safety State Distribution" padding="none">
          <AdminTable columns={['State', 'Count', 'Operational Semantics']}>
            <AdminTableRow cells={[
              <AdminStatus key="s" status="verified" label="GROUNDED" />,
              <span key="c" style={{ fontFamily: 'var(--font-mono)', color: '#111317' }}>{summary.groundedCount}</span>,
              <span key="n" style={{ color: '#494D55' }}>100% backed by verified catalogue, compatibility, or document records.</span>,
            ]} />
            <AdminTableRow cells={[
              <AdminStatus key="s" status="warning" label="PARTIALLY GROUNDED" />,
              <span key="c" style={{ fontFamily: 'var(--font-mono)', color: '#111317' }}>{summary.partiallyGroundedCount}</span>,
              <span key="n" style={{ color: '#494D55' }}>Unverified compatibility or data gap flagged with customer warning.</span>,
            ]} />
            <AdminTableRow cells={[
              <AdminStatus key="s" status="neutral" label="INSUFFICIENT EVIDENCE" />,
              <span key="c" style={{ fontFamily: 'var(--font-mono)', color: '#111317' }}>{summary.insufficientEvidenceCount}</span>,
              <span key="n" style={{ color: '#494D55' }}>Refusal triggered: UNKNOWN specification or missing verified rule.</span>,
            ]} />
            <AdminTableRow cells={[
              <AdminStatus key="s" status="alert" label="UNSUPPORTED / BLOCKED" />,
              <span key="c" style={{ fontFamily: 'var(--font-mono)', color: '#111317' }}>{summary.unsupportedCount}</span>,
              <span key="n" style={{ color: '#494D55' }}>Prompt injection attempt or autonomous commerce request blocked.</span>,
            ]} />
          </AdminTable>
        </AdminPanel>
      </AdminSection>

      {/* Recent Events Ledger */}
      <AdminSection>
        <AdminPanel title="Recent Consultation Audit Events" padding="md">
          {summary.recentEvents.length === 0 ? (
            <AdminEmptyState
              title="No audit events yet"
              description="Consultations will appear here in real-time as AI queries are processed."
            />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.recentEvents.map((evt) => (
                <li
                  key={evt.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#F5F5F3',
                    border: '1px solid #E2E2DE',
                    borderRadius: 5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#B8935A', marginRight: 8 }}>
                      [{evt.intent}]
                    </span>
                    <span style={{ color: '#494D55' }}>
                      Market: {evt.marketCode} | Provider: {evt.modelProvider}
                    </span>
                    {evt.errorState && (
                      <span style={{ color: '#C8001A', marginLeft: 8 }}>
                        ⚠ {evt.errorState}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#767A85' }}>
                      {evt.latencyMs}ms
                    </span>
                    <AdminStatus
                      status={evt.groundingState === 'GROUNDED' ? 'verified' : 'warning'}
                      label={evt.groundingState}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </AdminSection>
    </>
  )
}
