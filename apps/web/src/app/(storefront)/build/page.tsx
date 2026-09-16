import type { Metadata } from 'next'
import { PageHero } from '@/components/layout/PageHero'
import { getMarketPreference } from '@/actions/market'
import { getBuildMyRigMachines, resolveBuildConfiguration } from '@halo-rc/db'
import { BuildEngineClient } from './build-engine-client'

export const metadata: Metadata = {
  title: 'Build My Rig — Halo RC',
  description: 'Specialist RC vehicle build configurator. Deterministic product graph compatibility, verified platform requirements, and market pricing.',
}

export const dynamic = 'force-dynamic'

interface BuildPageProps {
  searchParams?: Promise<{ machine?: string }>
}

export default async function BuildMyRigPage({ searchParams }: BuildPageProps) {
  const activeMarket = await getMarketPreference()
  const machines = await getBuildMyRigMachines(activeMarket)
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const machineParam = resolvedSearchParams?.machine

  let initialBuild = null
  if (machineParam) {
    initialBuild = await resolveBuildConfiguration({
      machineId: machineParam,
      marketCode: activeMarket,
    })
  }

  return (
    <>
      <PageHero
        eyebrow="Engineering Configurator"
        headline="Build My Rig"
        subline="Deterministic product-graph compatibility engine. Assemble verified turnkey chassis configurations with matched competition electronics."
        imageSrc="/images/disciplines/bash.jpg"
        imagePosition="center 30%"
        badge="BLUEPRINT ENGINE"
      />
      <BuildEngineClient
        initialMachines={machines}
        initialBuild={initialBuild}
        activeMarket={activeMarket}
      />
    </>
  )
}
