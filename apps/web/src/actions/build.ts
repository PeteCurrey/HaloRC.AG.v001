'use server'

import { resolveBuildConfiguration, getBuildMyRigMachines, saveBuildToGarageVehicle } from '@halo-rc/db'
import type { MarketCode, ConfiguredBuild, ConfiguredBuildMachine } from '@halo-rc/types'
import { getSessionUser } from '@/lib/auth'

export async function fetchBuildConfiguration(params: {
  machineId: string
  selectedComponents?: Record<string, string>
  marketCode: MarketCode
}): Promise<ConfiguredBuild> {
  return resolveBuildConfiguration(params)
}

export async function fetchBuildMyRigMachines(
  marketCode: MarketCode
): Promise<ConfiguredBuildMachine[]> {
  return getBuildMyRigMachines(marketCode)
}

export async function saveBuildToGarageAction(params: {
  vehicleId: string
  build: ConfiguredBuild
  name?: string
}): Promise<{ buildId: string }> {
  const user = await getSessionUser()
  if (!user) throw new Error('Authentication required')

  const record = await saveBuildToGarageVehicle(user.id, {
    garageVehicleId: params.vehicleId,
    configuredBuild: params.build,
    marketCode: params.build.marketCode,
    name: params.name ?? 'Configured Build',
  })
  return { buildId: record.id }
}
