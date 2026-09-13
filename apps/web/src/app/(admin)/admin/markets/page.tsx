import {
  getAllMarketConfigs,
  getShippingMethodsForMarket,
  getMarketCompletenessReport,
  getMultiMarketAnalytics,
} from '@halo-rc/db'

export const metadata = {
  title: 'Markets & Logistics | Halo RC Operations',
  description: 'Multi-market configuration, tax presentation, and international shipping routing.',
}

export default async function AdminMarketsPage() {
  const configs = getAllMarketConfigs()
  const completeness = await getMarketCompletenessReport()
  const analytics = getMultiMarketAnalytics()

  const ukShipping = getShippingMethodsForMarket('UK')
  const usShipping = getShippingMethodsForMarket('US')

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 600,
            color: 'var(--colour-white)',
            marginBottom: 'var(--space-2)',
          }}
        >
          International Markets, Tax & Logistics
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
          Dual-market commercial architecture (UK &amp; USA). Strict product graph parity with segregated pricing,
          tax presentation, inventory availability, and courier dispatch routing.
        </p>
      </div>

      {/* Section 1: Active Market Configs */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--colour-off-white)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Active Market Configurations
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {configs.map((m) => (
            <div
              key={m.marketCode}
              style={{
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#00f0ff',
                      letterSpacing: '0.1em',
                    }}
                  >
                    MARKET [{m.marketCode}]
                  </span>
                  <h3
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 600,
                      color: 'var(--colour-white)',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {m.name}
                  </h3>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: m.enabled ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                    color: m.enabled ? '#00f0ff' : 'var(--colour-smoke)',
                    border: `1px solid ${m.enabled ? '#00f0ff40' : 'var(--colour-mist)'}`,
                  }}
                >
                  {m.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Currency</span>
                  <strong style={{ color: 'var(--colour-off-white)', fontFamily: 'var(--font-mono)' }}>
                    {m.currency}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Locale</span>
                  <strong style={{ color: 'var(--colour-off-white)', fontFamily: 'var(--font-mono)' }}>
                    {m.locale}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Tax Display</span>
                  <strong style={{ color: 'var(--colour-off-white)' }}>
                    {m.taxDisplayMode === 'TAX_INCLUDED' ? 'VAT Included (20%)' : 'Tax Excluded'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Measurement</span>
                  <strong style={{ color: 'var(--colour-off-white)' }}>{m.measurementSystem}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Shipping Region</span>
                  <strong style={{ color: 'var(--colour-off-white)' }}>{m.shippingRegion}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Default Language</span>
                  <strong style={{ color: 'var(--colour-off-white)' }}>{m.defaultLanguage}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Segregated Multi-Market Analytics */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 'var(--space-4)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--colour-off-white)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              margin: 0,
            }}
          >
            Segregated Commercial Analytics
          </h2>
          <span style={{ fontSize: '0.6875rem', color: '#ffb000', fontFamily: 'var(--font-mono)' }}>
            ⚠ Invariant Enforced: Currencies tracked independently (No cross-currency addition)
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {analytics.markets.map((stat) => (
            <div
              key={stat.marketCode}
              style={{
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--colour-smoke)',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.marketCode} Performance
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: stat.currency === 'GBP' ? '#00f0ff' : '#10b981',
                  }}
                >
                  {stat.currency}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', display: 'block' }}>
                    Gross Revenue
                  </span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {stat.currency === 'GBP' ? '£' : '$'}
                    {(stat.grossRevenueMinorUnits / 100).toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', display: 'block' }}>
                    Paid Orders
                  </span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {stat.totalOrders}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', display: 'block' }}>
                    Average Order Value
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)' }}>
                    {stat.currency === 'GBP' ? '£' : '$'}
                    {(stat.averageOrderValueMinorUnits / 100).toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', display: 'block' }}>
                    Active Baskets
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)' }}>
                    {stat.activeBasketsCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Market Completeness Scoring */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--colour-off-white)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Market Completeness &amp; Catalogue Parity
        </h2>

        <div
          style={{
            backgroundColor: 'var(--colour-carbon)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--colour-steel)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--colour-smoke)' }}>
                  Market
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--colour-smoke)' }}>
                  Total Canonical Products
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--colour-smoke)' }}>
                  Commercial Offers Available
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', color: 'var(--colour-smoke)' }}>
                  Coverage %
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--colour-smoke)' }}>
                  Health Status
                </th>
              </tr>
            </thead>
            <tbody>
              {completeness.map((c) => (
                <tr key={c.marketCode} style={{ borderBottom: '1px solid var(--colour-mist)' }}>
                  <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {c.marketCode === 'UK' ? 'United Kingdom (UK)' : 'United States (US)'}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>
                    {c.totalProductsCount}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--colour-off-white)' }}>
                    {c.offeredProductsCount}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--colour-white)', fontWeight: 600 }}>
                    {c.coveragePercentage}%
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        backgroundColor:
                          c.status === 'COMPLETE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : c.status === 'PARTIAL'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          c.status === 'COMPLETE'
                            ? '#10b981'
                            : c.status === 'PARTIAL'
                            ? '#f59e0b'
                            : '#ef4444',
                        border: `1px solid ${
                          c.status === 'COMPLETE'
                            ? '#10b98140'
                            : c.status === 'PARTIAL'
                            ? '#f59e0b40'
                            : '#ef444440'
                        }`,
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Configured Shipping Methods */}
      <div>
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--colour-off-white)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Authoritative Shipping Methods &amp; Free Thresholds
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: '#00f0ff',
                marginBottom: 'var(--space-3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              UK DOMESTIC COURIERS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ukShipping.map((ship) => (
                <div
                  key={ship.id}
                  style={{
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <strong style={{ color: 'var(--colour-white)', fontSize: 'var(--text-xs)' }}>
                      {ship.name}
                    </strong>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#00f0ff', fontSize: 'var(--text-xs)' }}>
                      £{(ship.costMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)' }}>
                    Carrier: {ship.carrier} · Service: {ship.serviceLevel} · ETA: {ship.estimatedDaysMin}-{ship.estimatedDaysMax}d
                  </div>
                  {ship.freeThresholdMinorUnits && (
                    <div style={{ fontSize: '0.6875rem', color: '#10b981', marginTop: 'var(--space-1)' }}>
                      Free for orders over £{(ship.freeThresholdMinorUnits / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: '#10b981',
                marginBottom: 'var(--space-3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              US DOMESTIC COURIERS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {usShipping.map((ship) => (
                <div
                  key={ship.id}
                  style={{
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <strong style={{ color: 'var(--colour-white)', fontSize: 'var(--text-xs)' }}>
                      {ship.name}
                    </strong>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: 'var(--text-xs)' }}>
                      ${(ship.costMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)' }}>
                    Carrier: {ship.carrier} · Service: {ship.serviceLevel} · ETA: {ship.estimatedDaysMin}-{ship.estimatedDaysMax}d
                  </div>
                  {ship.freeThresholdMinorUnits && (
                    <div style={{ fontSize: '0.6875rem', color: '#10b981', marginTop: 'var(--space-1)' }}>
                      Free for orders over ${(ship.freeThresholdMinorUnits / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
