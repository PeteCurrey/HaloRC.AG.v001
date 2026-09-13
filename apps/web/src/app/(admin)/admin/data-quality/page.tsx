import { getDataQualityAudit } from '@halo-rc/db'

export default async function DataQualityDashboard() {
  const audit = await getDataQualityAudit()

  const metrics = [
    { label: 'Total Products', value: audit.totalProducts, detail: `${audit.totalVariants} variants active` },
    { label: 'Specifications', value: audit.totalSpecifications, detail: `${audit.verifiedSpecificationsCount} verified (${Math.round((audit.verifiedSpecificationsCount / Math.max(1, audit.totalSpecifications)) * 100)}%)` },
    { label: 'UK Offers', value: audit.ukOffersCount, detail: `${audit.missingUkOffersCount} missing UK offers` },
    { label: 'US Offers', value: audit.usOffersCount, detail: `${audit.missingUsOffersCount} missing US offers` },
  ]

  const flags = [
    { label: 'UNKNOWN Specs (Omitted)', value: audit.unknownSpecificationsCount, status: audit.unknownSpecificationsCount > 0 ? 'INFO' : 'CLEAN', note: 'Strictly omitted from public customer-facing pages' },
    { label: 'INFERRED Specs', value: audit.inferredSpecificationsCount, status: audit.inferredSpecificationsCount > 0 ? 'CAUTION' : 'CLEAN', note: 'Requires manual verification with factory documentation' },
    { label: 'Missing Provenance', value: audit.missingProvenanceCount, status: audit.missingProvenanceCount > 0 ? 'CAUTION' : 'CLEAN', note: 'Specifications lacking source URL or documentation' },
    { label: 'Discontinued / Replaced', value: audit.discontinuedProductsCount, status: 'INFO', note: 'Archived products with active replacement lineage' },
    { label: 'Pre-Order / Special Order', value: audit.preorderCount + audit.specialOrderCount, status: 'INFO', note: 'Allocated or lead-time driven inventory items' },
    { label: 'Orphaned Products', value: audit.orphanedProductsCount, status: audit.orphanedProductsCount > 0 ? 'ALERT' : 'CLEAN', note: 'Products missing valid brand association' },
    { label: 'Build My Rig Machines', value: audit.buildMyRigEligibleMachinesCount, status: 'CLEAN', note: 'Machines with active chassis slot blueprints in configurator' },
    { label: 'Kits Missing Slots', value: audit.kitsWithMissingRequiredSlotsCount, status: audit.kitsWithMissingRequiredSlotsCount > 0 ? 'ALERT' : 'CLEAN', note: 'Competition kits lacking mandatory electronics slot rules' },
    { label: 'Discontinued in Rules', value: audit.discontinuedBuildComponentsCount, status: audit.discontinuedBuildComponentsCount > 0 ? 'INFO' : 'CLEAN', note: 'Superseded parts with active replacement lineage in build engine' },
    { label: 'Unmatched Supplier SKUs', value: audit.unmatchedSupplierMappingsCount, status: audit.unmatchedSupplierMappingsCount > 0 ? 'CAUTION' : 'CLEAN', note: 'Supplier items awaiting deterministic or manual product link' },
    { label: 'Active Supplier Offers', value: audit.totalSupplierOffersCount, status: 'CLEAN', note: 'Live commercial sourcing offers mapped across active suppliers' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
          Data Integrity Engine
        </span>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
        Data Provenance &amp; Confidence Audit
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-8)' }}>
        Halo RC non-negotiable principle: UNKNOWN data must never silently become KNOWN.
        Every published specification retains full source documentation, verification timestamp, and confidence status.
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

      {/* Audit Findings Table */}
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
            Catalogue Health &amp; Integrity Invariants
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Check / Invariant</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Count</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Policy</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((row) => (
              <tr key={row.label} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-4)', color: 'var(--colour-off-white)', fontWeight: 500 }}>{row.label}</td>
                <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)', fontWeight: 600 }}>{row.value}</td>
                <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                  <span
                    style={{
                      color:
                        row.status === 'CLEAN'
                          ? 'var(--colour-verified)'
                          : row.status === 'CAUTION'
                          ? 'var(--colour-caution)'
                          : row.status === 'ALERT'
                          ? '#ff4444'
                          : 'var(--colour-halo)',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commercial Media Rule */}
      <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-graphite)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-2)' }}>
          Commercial Media &amp; Licensing Rule
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)' }}>
          All manufacturer imagery must carry an explicit <code style={{ color: 'var(--colour-halo)' }}>approved_for_commercial_use = true</code> flag before exposure to public CDN endpoints. No generic AI stock imagery is permitted on the platform.
        </p>
      </div>
    </div>
  )
}

