// apps/web/src/app/(storefront)/race/page.tsx
// Authoritative Race Department Discovery Hub.
// Filter and discover engineered Halo Builds by discipline, scale, and platform.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedHaloBuilds, resolveCurrentBuildPricing } from '@halo-rc/db'

export const metadata: Metadata = {
  title: 'The Race Department — Halo RC',
  description: 'Specialist engineering & competition vehicle configurations. Turnkey championship blueprints calibrated on authoritative product graphs.',
}

interface RacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RaceDepartmentPage({ searchParams }: RacePageProps) {
  const params = await searchParams
  const selectedDiscipline = typeof params['discipline'] === 'string' ? params['discipline'] : 'ALL'
  const selectedScale = typeof params['scale'] === 'string' ? params['scale'] : 'ALL'
  const selectedType = typeof params['type'] === 'string' ? params['type'] : 'ALL'

  const builds = await getPublishedHaloBuilds({
    discipline: selectedDiscipline,
    scale: selectedScale,
    buildType: selectedType,
  })

  const disciplines = ['ALL', 'TOURING', 'BUGGY', 'GT', 'LARGE_SCALE']
  const scales = ['ALL', '1:10', '1:8', '1:5']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        {/* Eyebrow & Headline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-race)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-off-white)' }}>
            Engineering &amp; Competition Division
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
              Halo Builds
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '56ch', lineHeight: 'var(--leading-relaxed)' }}>
              Engineered competition vehicle configurations. Each build integrates verified chassis platforms, matched powertrain electronics, and calibrated running gear.
            </p>
          </div>
          <Link
            href="/race/compare"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-off-white)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Compare Builds →
          </Link>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-8)', padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', borderRadius: 'var(--radius-md)', border: '1px solid var(--colour-steel)' }}>
          <div>
            <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-1)' }}>
              Discipline
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {disciplines.map((d) => (
                <Link
                  key={d}
                  href={`/race?discipline=${d}&scale=${selectedScale}&type=${selectedType}`}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                    backgroundColor: selectedDiscipline === d ? 'var(--colour-race)' : 'var(--colour-graphite)',
                    color: selectedDiscipline === d ? 'var(--colour-white)' : 'var(--colour-ash)',
                  }}
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-1)' }}>
              Scale
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {scales.map((s) => (
                <Link
                  key={s}
                  href={`/race?discipline=${selectedDiscipline}&scale=${s}&type=${selectedType}`}
                  style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                    backgroundColor: selectedScale === s ? 'var(--colour-race)' : 'var(--colour-graphite)',
                    color: selectedScale === s ? 'var(--colour-white)' : 'var(--colour-ash)',
                  }}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Builds Grid */}
        {builds.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
              No published Halo Builds match the active filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
            {builds.map((build) => {
              const ukPricing = resolveCurrentBuildPricing(build, 'UK')
              const currentVersionRecord = build.versions.find((v) => v.version === build.currentVersion)

              return (
                <div
                  key={build.id}
                  style={{
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ padding: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-race)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {build.discipline} • {build.scale}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                        v{build.currentVersion}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--colour-off-white)', marginBottom: 'var(--space-2)' }}>
                      {build.title}
                    </h2>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
                      {build.engineeringSummary}
                    </p>

                    <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                        Platform: {build.platformName}
                      </span>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', margin: 'var(--space-1) 0 0 0' }}>
                        {currentVersionRecord?.components.length ?? 0} engineered component lines
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-4) var(--space-6)', backgroundColor: 'var(--colour-graphite)', borderTop: '1px solid var(--colour-steel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', display: 'block' }}>
                        Current UK Build Total
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        {ukPricing.totalMinorUnits ? `£${(ukPricing.totalMinorUnits / 100).toFixed(2)}` : 'Pricing On Request'}
                      </span>
                    </div>
                    <Link
                      href={`/race/${build.slug}`}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'var(--colour-race)',
                        color: 'var(--colour-white)',
                        fontWeight: 600,
                        fontSize: 'var(--text-xs)',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Inspect Blueprint →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
