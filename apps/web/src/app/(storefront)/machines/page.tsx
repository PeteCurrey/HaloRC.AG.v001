import type { Metadata } from 'next'
import Link from 'next/link'
import { getMarketPreference } from '@/actions/market'
import { getMachinesList } from '@halo-rc/db'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import type { Currency } from '@halo-rc/types'

export const metadata: Metadata = {
  title: 'The Machines — Curated RC Catalogue',
  description: 'Browse our curated selection of verified competition and flagship RC machines across bash, race, drift, crawl, and large scale.',
  alternates: {
    canonical: 'https://halo-rc.com/machines',
  },
}

const DISCIPLINES = [
  { label: 'All Disciplines', slug: 'all', count: 12 },
  { label: 'Bash', slug: 'bash', description: 'Tough, high-speed, built for extreme punishment.' },
  { label: 'Race', slug: 'race', description: 'World-championship competition engineering.' },
  { label: 'Drift', slug: 'drift', description: 'Technical rear-wheel drive drift precision.' },
  { label: 'Crawl', slug: 'crawl', description: 'Scale rock crawling and technical trail rigs.' },
  { label: 'Scale', slug: 'scale', description: 'Authentic engineering fidelity and scale realism.' },
  { label: 'Large Scale / 1:5', slug: 'large_scale', description: 'Serious scale petrol and high-voltage motorsport.' },
]

interface MachinesPageProps {
  searchParams: Promise<{ discipline?: string }>
}

export default async function MachinesPage({ searchParams }: MachinesPageProps) {
  const { discipline } = await searchParams
  const activeDiscipline = discipline ?? 'all'
  const activeMarket = await getMarketPreference()

  const machines = await getMachinesList({
    discipline: activeDiscipline,
    marketCode: activeMarket,
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>

        {/* ── Header ── */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-2)' }}>
          The Machines
        </p>

        <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--colour-off-white)', marginBottom: 'var(--space-3)', textWrap: 'balance' }}>
          Precision engineering,<br />at every scale.
        </h1>

        <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '56ch', marginBottom: 'var(--space-8)', lineHeight: 'var(--leading-relaxed)' }}>
          Every machine in the Halo RC catalogue is chosen for documented engineering excellence.
          Verified platforms, structured compatibility, and market-aware delivery.
        </p>

        {/* ── Discipline Filter Tabs ── */}
        <nav aria-label="Machine disciplines" style={{ marginBottom: 'var(--space-9)' }}>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', listStyle: 'none' }}>
            {DISCIPLINES.map((d) => {
              const isSelected = activeDiscipline.toLowerCase() === d.slug.toLowerCase()
              return (
                <li key={d.slug}>
                  <Link
                    href={d.slug === 'all' ? '/machines' : `/machines?discipline=${d.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                      backgroundColor: isSelected ? 'var(--colour-carbon)' : 'var(--colour-graphite)',
                      color: isSelected ? 'var(--colour-white)' : 'var(--colour-smoke)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.04em',
                      textDecoration: 'none',
                      transition: 'border-color 150ms ease, color 150ms ease',
                    }}
                  >
                    {d.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Product Grid ── */}
        <section aria-label="Machines list">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {machines.map((m) => {
              const isHalo = m.tier === 'HALO'
              return (
                <article
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 'var(--space-6)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: `1px solid ${isHalo ? 'rgba(212, 168, 83, 0.4)' : 'var(--colour-steel)'}`,
                    borderRadius: 'var(--radius-md)',
                    transition: 'border-color 150ms ease',
                  }}
                >
                  <div>
                    {/* Brand & Tier Flag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {m.brand.name}
                      </span>
                      {isHalo ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.625rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(212, 168, 83, 0.15)',
                            color: 'var(--colour-halo)',
                            border: '1px solid rgba(212, 168, 83, 0.3)',
                          }}
                        >
                          ★ Halo / {m.haloClassification ?? 'Competition'}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.625rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--colour-ash)',
                          }}
                        >
                          {m.scale}
                        </span>
                      )}
                    </div>

                    {/* Machine Title */}
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)', lineHeight: 'var(--leading-snug)' }}>
                      <Link
                        href={`/machines/${m.slug}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {m.name}
                      </Link>
                    </h2>

                    {/* Editorial Summary */}
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
                      {m.editorialSummary}
                    </p>

                    {/* Tech specs chip row */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
                      {m.scale && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--colour-graphite)', borderRadius: '2px', color: 'var(--colour-smoke)' }}>
                          Scale: {m.scale}
                        </span>
                      )}
                      {m.powerType && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--colour-graphite)', borderRadius: '2px', color: 'var(--colour-smoke)' }}>
                          Power: {m.powerType}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--colour-graphite)', borderRadius: '2px', color: 'var(--colour-smoke)' }}>
                        Discipline: {m.discipline}
                      </span>
                    </div>
                  </div>

                  {/* Commercial footer */}
                  <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {m.offer ? (
                        <>
                          <MarketAwarePrice
                            amountMinorUnits={m.offer.retailPriceMinorUnits}
                            currency={m.offer.currency as Currency}
                            taxMode={m.offer.taxMode}
                            size="base"
                          />
                          <div style={{ marginTop: 'var(--space-1)' }}>
                            <StockStatus status={m.offer.availability} leadTimeDays={m.offer.leadTimeDays} />
                          </div>
                        </>
                      ) : (
                        <div>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                            Not Available in {activeMarket}
                          </p>
                          <StockStatus status="NOT_AVAILABLE" />
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/machines/${m.slug}`}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: isHalo ? 'var(--colour-halo)' : 'var(--colour-steel)',
                        color: isHalo ? 'var(--colour-void)' : 'var(--colour-white)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        textDecoration: 'none',
                        letterSpacing: '0.04em',
                      }}
                    >
                      View Specs →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
