// apps/web/src/app/(storefront)/race/page.tsx
// Authoritative Race Department Discovery Hub.
// Filter and discover engineered Halo Builds by discipline, scale, and platform.

import type { Metadata } from 'next'
import Link from 'next/link'
import s from './race.module.css'
import { PageHero } from '@/components/layout/PageHero'
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
    <>
      <PageHero
        eyebrow="Race Department"
        headline={"Halo Builds"}
        subline="Engineered competition vehicle configurations. Each build integrates verified chassis platforms, matched powertrain electronics, and calibrated running gear."
        imageSrc="/images/disciplines/race.jpg"
        imagePosition="center 40%"
        badge="COMPETITION DIVISION"
      />
      <div className={s.page}>
        <div className={s.container}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <Link href="/race/compare" className={s.compareButton}>
              Compare Builds →
            </Link>
          </div>

          {/* Filter Controls */}
          <div className={s.filterBar}>
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Discipline</span>
            <div className={s.filterPills}>
              {disciplines.map((d) => {
                const isSelected = selectedDiscipline === d
                return (
                  <Link
                    key={d}
                    href={`/race?discipline=${d}&scale=${selectedScale}&type=${selectedType}`}
                    className={`${s.filterPill} ${isSelected ? s.filterPillActive : ''}`}
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    {d}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Scale</span>
            <div className={s.filterPills}>
              {scales.map((sc) => {
                const isSelected = selectedScale === sc
                return (
                  <Link
                    key={sc}
                    href={`/race?discipline=${selectedDiscipline}&scale=${sc}&type=${selectedType}`}
                    className={`${s.filterPill} ${isSelected ? s.filterPillActive : ''}`}
                    aria-current={isSelected ? 'page' : undefined}
                  >
                    {sc}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Builds Grid */}
        {builds.length === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyText}>
              No published Halo Builds match the active filter criteria.
            </p>
          </div>
        ) : (
          <div className={s.buildsGrid}>
            {builds.map((build) => {
              const ukPricing = resolveCurrentBuildPricing(build, 'UK')
              const currentVersionRecord = build.versions.find((v) => v.version === build.currentVersion)

              return (
                <article key={build.id} className={s.buildCard}>
                  <div className={s.cardBody}>
                    <div className={s.cardMeta}>
                      <span className={s.disciplineBadge}>
                        {build.discipline} • {build.scale}
                      </span>
                      <span className={s.versionTag}>
                        v{build.currentVersion}
                      </span>
                    </div>

                    <h2 className={s.buildTitle}>
                      {build.title}
                    </h2>

                    <p className={s.buildSummary}>
                      {build.engineeringSummary}
                    </p>

                    <div className={s.platformRow}>
                      <span className={s.platformLabel}>
                        Platform: {build.platformName}
                      </span>
                      <p className={s.componentCount}>
                        {currentVersionRecord?.components.length ?? 0} engineered component lines
                      </p>
                    </div>
                  </div>

                  <div className={s.cardFooter}>
                    <div>
                      <span className={s.priceLabel}>
                        Current UK Build Total
                      </span>
                      <span className={s.priceValue}>
                        {ukPricing.totalMinorUnits ? `£${(ukPricing.totalMinorUnits / 100).toFixed(2)}` : 'Pricing On Request'}
                      </span>
                    </div>
                    <Link
                      href={`/race/${build.slug}`}
                      className={s.inspectCta}
                    >
                      Inspect Blueprint →
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
