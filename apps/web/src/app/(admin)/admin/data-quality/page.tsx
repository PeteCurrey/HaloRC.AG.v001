import { getDataQualityAudit } from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
} from '@/components/admin'

export default async function DataQualityDashboard() {
  const audit = await getDataQualityAudit()

  const metrics = [
    { label: 'Total Products', value: audit.totalProducts, detail: `${audit.totalVariants} variants active` },
    { label: 'Specifications', value: audit.totalSpecifications, detail: `${audit.verifiedSpecificationsCount} verified (${Math.round((audit.verifiedSpecificationsCount / Math.max(1, audit.totalSpecifications)) * 100)}%)` },
    { label: 'UK Offers', value: audit.ukOffersCount, detail: `${audit.missingUkOffersCount} missing UK offers` },
    { label: 'US Offers', value: audit.usOffersCount, detail: `${audit.missingUsOffersCount} missing US offers` },
  ]

  const flags = [
    { label: 'UNKNOWN Specs (Omitted)', value: audit.unknownSpecificationsCount, status: audit.unknownSpecificationsCount > 0 ? 'neutral' : 'verified', note: 'Strictly omitted from public customer-facing pages' },
    { label: 'INFERRED Specs', value: audit.inferredSpecificationsCount, status: audit.inferredSpecificationsCount > 0 ? 'warning' : 'verified', note: 'Requires manual verification with factory documentation' },
    { label: 'Missing Provenance', value: audit.missingProvenanceCount, status: audit.missingProvenanceCount > 0 ? 'warning' : 'verified', note: 'Specifications lacking source URL or documentation' },
    { label: 'Discontinued / Replaced', value: audit.discontinuedProductsCount, status: 'neutral', note: 'Archived products with active replacement lineage' },
    { label: 'Pre-Order / Special Order', value: audit.preorderCount + audit.specialOrderCount, status: 'neutral', note: 'Allocated or lead-time driven inventory items' },
    { label: 'Orphaned Products', value: audit.orphanedProductsCount, status: audit.orphanedProductsCount > 0 ? 'alert' : 'verified', note: 'Products missing valid brand association' },
    { label: 'Build My Rig Machines', value: audit.buildMyRigEligibleMachinesCount, status: 'verified', note: 'Machines with active chassis slot blueprints in configurator' },
    { label: 'Kits Missing Slots', value: audit.kitsWithMissingRequiredSlotsCount, status: audit.kitsWithMissingRequiredSlotsCount > 0 ? 'alert' : 'verified', note: 'Competition kits lacking mandatory electronics slot rules' },
    { label: 'Discontinued in Rules', value: audit.discontinuedBuildComponentsCount, status: audit.discontinuedBuildComponentsCount > 0 ? 'neutral' : 'verified', note: 'Superseded parts with active replacement lineage in build engine' },
    { label: 'Unmatched Supplier SKUs', value: audit.unmatchedSupplierMappingsCount, status: audit.unmatchedSupplierMappingsCount > 0 ? 'warning' : 'verified', note: 'Supplier items awaiting deterministic or manual product link' },
    { label: 'Active Supplier Offers', value: audit.totalSupplierOffersCount, status: 'verified', note: 'Live commercial sourcing offers mapped across active suppliers' },
  ]

  return (
    <>
      <AdminPageHeader
        category="Data Integrity Engine"
        title="Data Provenance & Confidence Audit"
        description="Avorria RC non-negotiable principle: UNKNOWN data must never silently become KNOWN. Every published specification retains full source documentation, verification timestamp, and confidence status."
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

      {/* Audit Findings Table */}
      <AdminSection>
        <AdminPanel title="Catalogue Health & Integrity Invariants" padding="none">
          <AdminTable columns={['Check / Invariant', 'Count', 'Status', 'Policy']}>
            {flags.map((row) => (
              <AdminTableRow key={row.label} cells={[
                <span key="label" style={{ fontWeight: 500, color: '#111317' }}>{row.label}</span>,
                <span key="count" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{row.value}</span>,
                <AdminStatus key="status" status={row.status} />,
                <span key="note" style={{ color: '#494D55' }}>{row.note}</span>,
              ]} />
            ))}
          </AdminTable>
        </AdminPanel>
      </AdminSection>

      {/* Commercial Media Rule */}
      <AdminSection>
        <AdminPanel title="Commercial Media & Licensing Rule" padding="md">
          <p style={{ fontSize: 'var(--text-xs)', color: '#494D55', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>
            All manufacturer imagery must carry an explicit{' '}
            <code style={{ fontFamily: 'var(--font-mono)', color: '#B8935A' }}>approved_for_commercial_use = true</code>{' '}
            flag before exposure to public CDN endpoints. No generic AI stock imagery is permitted on the platform.
          </p>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
