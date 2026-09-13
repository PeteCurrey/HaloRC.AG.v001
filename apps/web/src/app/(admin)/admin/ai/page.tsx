// apps/web/src/app/(admin)/admin/ai/page.tsx
// Admin AI Monitoring & Safety Telemetry Dashboard.

import { getAIAuditSummary } from '@/lib/ai/audit'

export default async function AdminAIMonitoringPage() {
  const summary = getAIAuditSummary()

  const metrics = [
    { label: 'Total Queries', value: summary.totalRequests, detail: 'AI consultations logged' },
    { label: 'Grounded %', value: `${summary.totalRequests > 0 ? Math.round((summary.groundedCount / summary.totalRequests) * 100) : 100}%`, detail: `${summary.groundedCount} fully grounded` },
    { label: 'Injections Blocked', value: summary.injectionAttemptsBlocked, detail: 'Hostile override attempts' },
    { label: 'Avg Latency', value: `${summary.avgLatencyMs}ms`, detail: 'Deterministic turnaround' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
          AI Safety &amp; Grounding Telemetry
        </span>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
        AI Intelligence Monitoring
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-8)' }}>
        Halo RC non-negotiable principle: AI is an advisory interface, never the authority.
        All responses are strictly grounded in authoritative database records, verified compatibility rules, and isolated market offers.
      </p>

      {/* Top Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              padding: 'var(--space-5)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
              {m.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--colour-white)', display: 'block', marginBottom: 'var(--space-1)' }}>
              {m.value}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
              {m.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Grounding Breakdown Table */}
      <div
        style={{
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--colour-carbon)',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Grounding &amp; Safety State Distribution
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>State</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Count</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Operational Semantics</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)' }}>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-verified)', fontWeight: 600 }}>GROUNDED</td>
              <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)' }}>{summary.groundedCount}</td>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>100% backed by verified catalogue, compatibility, or document records.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)' }}>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-caution)', fontWeight: 600 }}>PARTIALLY_GROUNDED</td>
              <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)' }}>{summary.partiallyGroundedCount}</td>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>Unverified compatibility or data gap flagged with customer warning.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)' }}>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-smoke)', fontWeight: 600 }}>INSUFFICIENT_EVIDENCE</td>
              <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)' }}>{summary.insufficientEvidenceCount}</td>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>Refusal triggered: UNKNOWN specification or missing verified rule.</td>
            </tr>
            <tr>
              <td style={{ padding: 'var(--space-4)', color: '#ff4444', fontWeight: 600 }}>UNSUPPORTED / BLOCKED</td>
              <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)' }}>{summary.unsupportedCount}</td>
              <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>Prompt injection attempt or autonomous commerce request blocked.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recent Events Ledger */}
      <div
        style={{
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--colour-carbon)',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Recent Consultation Audit Events
          </h2>
        </div>
        <div style={{ padding: 'var(--space-4)' }}>
          {summary.recentEvents.length === 0 ? (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
              No audit events logged yet. Consultations will appear here in real-time.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {summary.recentEvents.map((evt) => (
                <li
                  key={evt.id}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-halo)', marginRight: 'var(--space-2)' }}>
                      [{evt.intent}]
                    </span>
                    <span style={{ color: 'var(--colour-off-white)' }}>
                      Market: {evt.marketCode} | Provider: {evt.modelProvider}
                    </span>
                    {evt.errorState && (
                      <span style={{ color: '#ff4444', marginLeft: 'var(--space-2)' }}>
                        ⚠️ {evt.errorState}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                      {evt.latencyMs}ms
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: '0.625rem',
                        backgroundColor: evt.groundingState === 'GROUNDED' ? 'rgba(0, 200, 100, 0.2)' : 'rgba(255, 180, 0, 0.2)',
                        color: evt.groundingState === 'GROUNDED' ? 'var(--colour-verified)' : 'var(--colour-caution)',
                      }}
                    >
                      {evt.groundingState}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
