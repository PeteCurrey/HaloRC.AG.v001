export default function AdminDashboard() {
  const metrics = [
    { label: 'Active Brands', value: '31' },
    { label: 'Target Platforms', value: '14' },
    { label: 'Market Offers (UK / US)', value: 'Verified' },
    { label: 'Data Provenance Status', value: 'Strict' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
        Operations & Commercial Roster
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-8)' }}>
        Authoritative management for verified product graphs, supplier CRM, and market-specific commercial offers.
      </p>

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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {m.label}
            </p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--colour-off-white)', marginTop: 'var(--space-2)' }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', marginBottom: 'var(--space-2)' }}>
          RBAC Security Architecture
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', lineHeight: 'var(--leading-relaxed)' }}>
          Admin endpoints are protected via Supabase Auth session JWT and Postgres Row Level Security.
          Supplier costs, margin metrics, and opening order terms are strictly inaccessible to client anon roles.
        </p>
      </div>
    </div>
  )
}
