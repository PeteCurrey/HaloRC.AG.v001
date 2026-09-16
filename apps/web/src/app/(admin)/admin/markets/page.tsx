import {
  getAllMarketConfigs,
  getShippingMethodsForMarket,
  getMarketCompletenessReport,
  getMultiMarketAnalytics,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminTable,
  AdminTableRow,
  AdminStatus,
} from '@/components/admin'

export const metadata = {
  title: 'Markets & Logistics | Avorria RC Operations',
  description: 'Multi-market configuration, tax presentation, and international shipping routing.',
}

export default async function AdminMarketsPage() {
  const configs = getAllMarketConfigs()
  const completeness = await getMarketCompletenessReport()
  const analytics = getMultiMarketAnalytics()

  const ukShipping = getShippingMethodsForMarket('UK')
  const usShipping = getShippingMethodsForMarket('US')

  const completenessColumns = [
    { header: 'Market', width: '25%' },
    { header: 'Canonical Products', width: '20%' },
    { header: 'Commercial Offers', width: '20%' },
    { header: 'Coverage %', width: '15%' },
    { header: 'Health Status', width: '20%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Commerce & Governance"
        title="International Markets, Tax & Logistics"
        description="Dual-market commercial architecture (UK & USA). Strict product graph parity with segregated pricing, tax presentation, and courier dispatch routing."
      />

      {/* Section 1: Active Market Configs */}
      <AdminSection title="Active Market Configurations">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {configs.map((m) => (
            <AdminPanel
              key={m.marketCode}
              title={m.name}
              badge={
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                    color: 'var(--admin-text-tertiary, #767A85)',
                    backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                    padding: '1px 5px',
                    borderRadius: 'var(--admin-radius-sm, 3px)',
                  }}
                >
                  [{m.marketCode}]
                </span>
              }
              action={
                <AdminStatus
                  status={m.enabled ? 'active' : 'neutral'}
                  label={m.enabled ? 'ACTIVE' : 'DISABLED'}
                />
              }
              padding="md"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '0.75rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Currency
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {m.currency}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Locale
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {m.locale}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Tax Presentation
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>
                    {m.taxDisplayMode === 'TAX_INCLUDED' ? 'VAT Included (20%)' : 'Tax Excluded'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Measurement
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>
                    {m.measurementSystem}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Shipping Region
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>
                    {m.shippingRegion}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--admin-text-tertiary, #767A85)', display: 'block', fontSize: '0.6875rem' }}>
                    Language
                  </span>
                  <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>
                    {m.defaultLanguage}
                  </strong>
                </div>
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>

      {/* Section 2: Segregated Commercial Analytics */}
      <AdminSection
        title="Segregated Commercial Analytics"
        action={
          <span style={{ fontSize: '0.6875rem', color: 'var(--admin-dot-warning, #B86818)', fontFamily: 'var(--font-mono, monospace)' }}>
            Invariant: Currencies tracked independently
          </span>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {analytics.markets.map((stat) => (
            <AdminPanel
              key={stat.marketCode}
              title={`${stat.marketCode} Performance`}
              badge={
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, fontSize: '0.6875rem', color: 'var(--admin-accent, #B8935A)' }}>
                  {stat.currency}
                </span>
              }
              padding="md"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', display: 'block' }}>
                    Gross Revenue
                  </span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-primary, #111317)' }}>
                    {stat.currency === 'GBP' ? '£' : '$'}
                    {(stat.grossRevenueMinorUnits / 100).toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', display: 'block' }}>
                    Paid Orders
                  </span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-primary, #111317)' }}>
                    {stat.totalOrders}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', display: 'block' }}>
                    Average Order Value
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
                    {stat.currency === 'GBP' ? '£' : '$'}
                    {(stat.averageOrderValueMinorUnits / 100).toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', display: 'block' }}>
                    Active Baskets
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
                    {stat.activeBasketsCount}
                  </span>
                </div>
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>

      {/* Section 3: Market Completeness */}
      <AdminSection title="Market Completeness & Catalogue Parity">
        <AdminTable columns={completenessColumns} style={{ marginBottom: '20px' }}>
          {completeness.map((c) => (
            <AdminTableRow key={c.marketCode}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
                {c.marketCode === 'UK' ? 'United Kingdom (UK)' : 'United States (US)'}
              </td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
                {c.totalProductsCount}
              </td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-primary, #111317)' }}>
                {c.offeredProductsCount}
              </td>
              <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
                {c.coveragePercentage}%
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                <AdminStatus
                  status={c.status === 'COMPLETE' ? 'verified' : c.status === 'PARTIAL' ? 'warning' : 'alert'}
                  label={c.status}
                />
              </td>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminSection>

      {/* Section 4: Configured Shipping Methods */}
      <AdminSection title="Authoritative Shipping Methods & Free Thresholds">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {/* UK Couriers */}
          <AdminPanel title="UK Domestic Couriers" subtitle="Royal Mail & DPD verified channels" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ukShipping.map((ship) => (
                <div
                  key={ship.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                    borderRadius: 'var(--admin-radius-sm, 3px)',
                    border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--admin-text-primary, #111317)', fontSize: '0.75rem' }}>
                      {ship.name}
                    </strong>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-primary, #111317)', fontSize: '0.75rem', fontWeight: 600 }}>
                      £{(ship.costMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                    Carrier: {ship.carrier} · Service: {ship.serviceLevel} · ETA: {ship.estimatedDaysMin}-{ship.estimatedDaysMax}d
                  </div>
                  {ship.freeThresholdMinorUnits && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--admin-dot-online, #1A6E34)', marginTop: '2px', fontWeight: 500 }}>
                      Free for orders over £{(ship.freeThresholdMinorUnits / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AdminPanel>

          {/* US Couriers */}
          <AdminPanel title="US Domestic Couriers" subtitle="USPS & FedEx domestic lanes" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usShipping.map((ship) => (
                <div
                  key={ship.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                    borderRadius: 'var(--admin-radius-sm, 3px)',
                    border: '1px solid var(--admin-border-subtle, #EBEBE7)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--admin-text-primary, #111317)', fontSize: '0.75rem' }}>
                      {ship.name}
                    </strong>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-primary, #111317)', fontSize: '0.75rem', fontWeight: 600 }}>
                      ${(ship.costMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                    Carrier: {ship.carrier} · Service: {ship.serviceLevel} · ETA: {ship.estimatedDaysMin}-{ship.estimatedDaysMax}d
                  </div>
                  {ship.freeThresholdMinorUnits && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--admin-dot-online, #1A6E34)', marginTop: '2px', fontWeight: 500 }}>
                      Free for orders over ${(ship.freeThresholdMinorUnits / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </AdminSection>
    </div>
  )
}
