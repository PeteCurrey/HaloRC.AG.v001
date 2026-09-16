// apps/web/src/app/(storefront)/race/compare/page.tsx
// Side-by-side Halo Build comparison page.
// Authoritative: reads from product graph, resolves market pricing independently per build.
// Supports comparing up to 3 builds. Slug-based selection via searchParams.

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getPublishedHaloBuilds,
  getHaloBuildById,
  resolveCurrentBuildPricing,
} from '@halo-rc/db'
import type { HaloBuildRecord } from '@halo-rc/types'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'Compare Halo Builds — Race Department — Halo RC',
  description:
    'Side-by-side comparison of engineered Halo RC competition configurations. Compare components, pricing, and specifications across builds.',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function formatPrice(minorUnits: number, currency: string): string {
  return (minorUnits / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

const SUBSYSTEM_ORDER = [
  'CHASSIS',
  'POWERTRAIN',
  'STEERING',
  'SUSPENSION',
  'RUNNING_GEAR',
  'BODYWORK',
  'ELECTRONICS',
  'SUPPORT',
]

const SUBSYSTEM_LABELS: Record<string, string> = {
  CHASSIS: 'Chassis & Platform',
  POWERTRAIN: 'Powertrain',
  STEERING: 'Steering',
  SUSPENSION: 'Suspension',
  RUNNING_GEAR: 'Running Gear',
  BODYWORK: 'Bodywork',
  ELECTRONICS: 'Electronics',
  SUPPORT: 'Support Items',
}

const DISCIPLINE_LABELS: Record<string, string> = {
  TOURING: 'Touring Car',
  BUGGY: 'Buggy',
  GT: 'GT',
  LARGE_SCALE: 'Large Scale',
  RALLY: 'Rally',
  CRAWLER: 'Crawler',
  TRUGGY: 'Truggy',
  SCT: 'Short Course Truck',
}

export default async function BuildComparePage({ searchParams }: PageProps) {
  const params = await searchParams

  // Parse build IDs from querystring — comma-separated or repeated `builds` params, up to 3
  const rawBuilds = params['builds']
  let buildIds: string[] = []
  if (typeof rawBuilds === 'string') {
    buildIds = rawBuilds.split(',').filter(Boolean).slice(0, 3)
  } else if (Array.isArray(rawBuilds)) {
    buildIds = rawBuilds.flatMap((b) => b.split(',')).filter(Boolean).slice(0, 3)
  }

  // Fetch requested builds
  const selectedBuilds: HaloBuildRecord[] = (
    await Promise.all(buildIds.map((id) => getHaloBuildById(id)))
  ).filter((b): b is HaloBuildRecord => b !== null && b.published)

  // Fetch all published builds for the selector
  const allBuilds = await getPublishedHaloBuilds({})

  // Resolve pricing for each selected build
  const buildPricingUK = selectedBuilds.map((b) => resolveCurrentBuildPricing(b, 'UK'))
  const buildPricingUS = selectedBuilds.map((b) => resolveCurrentBuildPricing(b, 'US'))

  // Collect all subsystems across selected builds
  const allSubsystems = new Set<string>()
  for (const build of selectedBuilds) {
    const currentVer = build.versions.find(
      (v) => v.version === build.currentVersion && v.status === 'PUBLISHED'
    )
    if (currentVer) {
      for (const comp of currentVer.components) {
        allSubsystems.add(comp.subsystem)
      }
    }
  }

  // Order subsystems canonically
  const orderedSubsystems = [
    ...SUBSYSTEM_ORDER.filter((s) => allSubsystems.has(s)),
    ...[...allSubsystems].filter((s) => !SUBSYSTEM_ORDER.includes(s)),
  ]

  // For each build, get its current version's components by subsystem
  const buildVersions = selectedBuilds.map((build) =>
    build.versions.find(
      (v) => v.version === build.currentVersion && v.status === 'PUBLISHED'
    )
  )

  return (
    <>
      <PageHero
        eyebrow="Race Department"
        headline="Build Comparison"
        subline="Side-by-side component and pricing analysis across engineered competition configurations."
        imageSrc="/images/brands/schumacher.jpg"
        imagePosition="center 45%"
        badge="COMPARE"
      />
      <div
      style={{
        minHeight: '60vh',
        backgroundColor: 'var(--colour-void)',
        padding: 'var(--space-9) var(--gutter-md)',
      }}
    >
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: 'var(--space-6)' }} aria-label="Breadcrumb">
          <ol
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--colour-ash)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <li>
              <Link href="/race" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
                Race Department
              </Link>
            </li>
            <li aria-hidden="true" style={{ color: 'var(--colour-steel)' }}>
              /
            </li>
            <li style={{ color: 'var(--colour-off-white)' }}>Compare Builds</li>
          </ol>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                backgroundColor: 'var(--colour-race)',
                borderRadius: '50%',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--colour-off-white)',
              }}
            >
              Engineering &amp; Competition Division
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(var(--text-2xl), 4vw, var(--text-4xl))',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--colour-white)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Compare Builds
          </h1>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--colour-ash)',
              maxWidth: '60ch',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            Compare engineered configurations side-by-side. All pricing and component data is
            sourced authoritatively from the product graph.
          </p>
        </div>

        {/* Build Selector */}
        <div
          style={{
            marginBottom: 'var(--space-8)',
            padding: 'var(--space-5)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--colour-carbon)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--colour-ash)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Select builds to compare (up to 3)
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            {allBuilds.map((b) => {
              const isSelected = buildIds.includes(b.id)
              // Toggle: if selected, remove; if not selected and < 3, add
              let newBuildIds: string[]
              if (isSelected) {
                newBuildIds = buildIds.filter((id) => id !== b.id)
              } else if (buildIds.length < 3) {
                newBuildIds = [...buildIds, b.id]
              } else {
                newBuildIds = buildIds
              }
              const href =
                newBuildIds.length > 0
                  ? `/race/compare?builds=${newBuildIds.join(',')}`
                  : '/race/compare'
              return (
                <Link
                  key={b.id}
                  href={href}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    border: isSelected
                      ? '1px solid var(--colour-race)'
                      : '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--colour-race)' : 'transparent',
                    color: isSelected ? 'var(--colour-void)' : 'var(--colour-ash)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.08em',
                    textDecoration: 'none',
                    cursor: buildIds.length >= 3 && !isSelected ? 'not-allowed' : 'pointer',
                    opacity: buildIds.length >= 3 && !isSelected ? 0.4 : 1,
                  }}
                >
                  {b.title}
                </Link>
              )
            })}
          </div>
          {selectedBuilds.length === 0 && (
            <p
              style={{
                marginTop: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                color: 'var(--colour-ash)',
              }}
            >
              Select at least one build above to begin comparison.
            </p>
          )}
        </div>

        {/* Comparison Table */}
        {selectedBuilds.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Build Header Row */}
              <thead>
                <tr>
                  <th
                    style={{
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      backgroundColor: 'var(--colour-carbon)',
                      borderBottom: '1px solid var(--colour-steel)',
                      borderRight: '1px solid var(--colour-steel)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--colour-ash)',
                      width: 200,
                      minWidth: 180,
                    }}
                  >
                    Specification
                  </th>
                  {selectedBuilds.map((build) => (
                    <th
                      key={build.id}
                      style={{
                        padding: 'var(--space-4)',
                        textAlign: 'left',
                        backgroundColor: 'var(--colour-carbon)',
                        borderBottom: '1px solid var(--colour-steel)',
                        borderRight: '1px solid var(--colour-steel)',
                        minWidth: 240,
                      }}
                    >
                      <Link
                        href={`/race/${build.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 700,
                            color: 'var(--colour-white)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          {build.title}
                        </div>
                        {build.subtitle && (
                          <div
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--colour-ash)',
                              fontStyle: 'italic',
                              lineHeight: 1.4,
                            }}
                          >
                            {build.subtitle}
                          </div>
                        )}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Discipline */}
                <CompareRow label="Discipline">
                  {selectedBuilds.map((b) => (
                    <td key={b.id} style={cellStyle}>
                      {DISCIPLINE_LABELS[b.discipline] ?? b.discipline}
                    </td>
                  ))}
                </CompareRow>

                {/* Scale */}
                <CompareRow label="Scale">
                  {selectedBuilds.map((b) => (
                    <td key={b.id} style={cellStyle}>
                      {b.scale}
                    </td>
                  ))}
                </CompareRow>

                {/* Platform */}
                <CompareRow label="Platform">
                  {selectedBuilds.map((b) => (
                    <td key={b.id} style={cellStyle}>
                      {b.platformName}
                    </td>
                  ))}
                </CompareRow>

                {/* Version */}
                <CompareRow label="Version">
                  {selectedBuilds.map((b) => (
                    <td key={b.id} style={cellStyle}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                        v{b.currentVersion}
                      </span>
                    </td>
                  ))}
                </CompareRow>

                {/* Track Conditions */}
                <CompareRow label="Track Conditions">
                  {selectedBuilds.map((b) => (
                    <td key={b.id} style={cellStyle}>
                      {b.trackConditions ?? '—'}
                    </td>
                  ))}
                </CompareRow>

                {/* UK Price */}
                <CompareRow label="UK Price (inc. VAT)" accent>
                  {selectedBuilds.map((b, i) => {
                    const pricing = buildPricingUK[i]!
                    return (
                      <td key={b.id} style={{ ...cellStyle, backgroundColor: 'var(--colour-carbon)' }}>
                        {pricing.totalMinorUnits != null ? (
                          <div>
                            <div
                              style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: 700,
                                color: pricing.isPurchasable
                                  ? 'var(--colour-white)'
                                  : 'var(--colour-ash)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {formatPrice(pricing.totalMinorUnits, 'GBP')}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color:
                                  pricing.availabilityState === 'AVAILABLE'
                                    ? 'var(--colour-race)'
                                    : 'var(--colour-ash)',
                                marginTop: 2,
                              }}
                            >
                              {pricing.availabilityState === 'AVAILABLE' && '✓ Purchasable'}
                              {pricing.availabilityState === 'PARTIALLY_AVAILABLE' &&
                                `${pricing.unavailableCount} unavailable`}
                              {pricing.availabilityState === 'UNAVAILABLE' && 'Not available'}
                              {pricing.availabilityState === 'REVIEW_REQUIRED' && 'Review required'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                            —
                          </span>
                        )}
                      </td>
                    )
                  })}
                </CompareRow>

                {/* US Price */}
                <CompareRow label="US Price">
                  {selectedBuilds.map((b, i) => {
                    const pricing = buildPricingUS[i]!
                    return (
                      <td key={b.id} style={cellStyle}>
                        {pricing.totalMinorUnits != null ? (
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPrice(pricing.totalMinorUnits, 'USD')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--colour-ash)' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </CompareRow>

                {/* Component count */}
                <CompareRow label="Component Count">
                  {selectedBuilds.map((b, i) => {
                    const ver = buildVersions[i]
                    return (
                      <td key={b.id} style={cellStyle}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {ver ? ver.components.length : '—'}
                        </span>
                      </td>
                    )
                  })}
                </CompareRow>

                {/* Separator */}
                <tr>
                  <td
                    colSpan={selectedBuilds.length + 1}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--colour-carbon)',
                      borderTop: '1px solid var(--colour-steel)',
                      borderBottom: '1px solid var(--colour-steel)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--colour-ash)',
                    }}
                  >
                    Components by Subsystem
                  </td>
                </tr>

                {/* Subsystem component rows */}
                {orderedSubsystems.map((subsystem) => (
                  <tr key={subsystem}>
                    <td
                      style={{
                        ...labelCellStyle,
                        verticalAlign: 'top',
                        paddingTop: 'var(--space-4)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--colour-off-white)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        {SUBSYSTEM_LABELS[subsystem] ?? subsystem}
                      </div>
                    </td>
                    {selectedBuilds.map((build, i) => {
                      const ver = buildVersions[i]
                      const comps = ver
                        ? ver.components.filter((c) => c.subsystem === subsystem)
                        : []
                      return (
                        <td key={build.id} style={{ ...cellStyle, verticalAlign: 'top' }}>
                          {comps.length === 0 ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--colour-ash)',
                                opacity: 0.5,
                              }}
                            >
                              —
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                              {comps.map((comp) => (
                                <div key={comp.productId}>
                                  <div
                                    style={{
                                      fontSize: 'var(--text-sm)',
                                      fontWeight: 600,
                                      color: 'var(--colour-white)',
                                      marginBottom: 2,
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {comp.productName}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: 'var(--text-xs)',
                                      color: 'var(--colour-ash)',
                                    }}
                                  >
                                    {comp.brandName}
                                    {comp.sku ? ` · ${comp.sku}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Action Row */}
                <tr>
                  <td style={labelCellStyle} />
                  {selectedBuilds.map((build, i) => {
                    const pricing = buildPricingUK[i]!
                    return (
                      <td
                        key={build.id}
                        style={{
                          ...cellStyle,
                          borderTop: '2px solid var(--colour-steel)',
                          backgroundColor: 'var(--colour-carbon)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <Link
                            href={`/race/${build.slug}`}
                            style={{
                              display: 'block',
                              padding: 'var(--space-2) var(--space-3)',
                              backgroundColor: pricing.isPurchasable
                                ? 'var(--colour-race)'
                                : 'var(--colour-steel)',
                              borderRadius: 'var(--radius-sm)',
                              color: pricing.isPurchasable
                                ? 'var(--colour-void)'
                                : 'var(--colour-ash)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              textDecoration: 'none',
                              textAlign: 'center',
                            }}
                          >
                            View Build
                          </Link>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {selectedBuilds.length === 0 && buildIds.length === 0 && (
          <div
            style={{
              padding: 'var(--space-10)',
              textAlign: 'center',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--colour-ash)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                letterSpacing: '0.08em',
                marginBottom: 'var(--space-3)',
              }}
            >
              No builds selected for comparison
            </div>
            <Link
              href="/race"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--colour-race)',
                textDecoration: 'none',
                letterSpacing: '0.08em',
              }}
            >
              Browse Race Department →
            </Link>
          </div>
        )}

        {/* Back link */}
        <div
          style={{
            marginTop: 'var(--space-8)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--colour-steel)',
          }}
        >
          <Link
            href="/race"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--colour-ash)',
              textDecoration: 'none',
            }}
          >
            ← Back to Race Department
          </Link>
        </div>
      </div>
      </div>
    </>
  )
}

// ── Helper components ────────────────────────────────────────────────────────

const labelCellStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  textAlign: 'left',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--colour-steel)',
  borderRight: '1px solid var(--colour-steel)',
  backgroundColor: 'var(--colour-carbon)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--colour-ash)',
  width: 200,
  minWidth: 180,
}

const cellStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  textAlign: 'left',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--colour-steel)',
  borderRight: '1px solid var(--colour-steel)',
  fontSize: 'var(--text-sm)',
  color: 'var(--colour-off-white)',
  backgroundColor: 'var(--colour-void)',
}

function CompareRow({
  label,
  children,
  accent,
}: {
  label: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <tr>
      <td
        style={{
          ...labelCellStyle,
          ...(accent ? { color: 'var(--colour-off-white)', fontWeight: 700 } : {}),
        }}
      >
        {label}
      </td>
      {children}
    </tr>
  )
}
