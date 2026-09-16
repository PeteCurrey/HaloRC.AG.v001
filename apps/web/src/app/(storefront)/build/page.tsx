import type { Metadata } from 'next'
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
    <BuildEngineClient
      initialMachines={machines}
      initialBuild={initialBuild}
      activeMarket={activeMarket}
    />
  )
}
