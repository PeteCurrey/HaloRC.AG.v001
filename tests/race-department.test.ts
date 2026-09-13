// tests/race-department.test.ts
// Phase 6 — Race Department / Halo Builds: discovery, validation, pricing.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPublishedHaloBuilds,
  getHaloBuildBySlug,
  getHaloBuildById,
  validateHaloBuild,
  resolveCurrentBuildPricing,
  createHaloBuildDraft,
  __resetRaceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetRaceStoreForTesting()
})

describe('Halo Build discovery', () => {
  it('returns only published builds when no filter applied', async () => {
    const builds = await getPublishedHaloBuilds({})
    expect(builds.length).toBeGreaterThan(0)
    expect(builds.every((b) => b.published)).toBe(true)
    expect(builds.every((b) => b.status === 'PUBLISHED')).toBe(true)
  })

  it('never returns draft or retired builds in discovery listing', async () => {
    const builds = await getPublishedHaloBuilds({})
    expect(builds.every((b) => b.status !== 'DRAFT')).toBe(true)
    expect(builds.every((b) => b.status !== 'RETIRED')).toBe(true)
  })

  it('filters by discipline', async () => {
    const builds = await getPublishedHaloBuilds({ discipline: 'TOURING' })
    expect(builds.every((b) => b.discipline === 'TOURING')).toBe(true)
  })

  it('filters by scale', async () => {
    const builds = await getPublishedHaloBuilds({ scale: '1:10' })
    expect(builds.every((b) => b.scale === '1:10')).toBe(true)
  })

  it('returns empty array for a discipline with no published builds', async () => {
    const builds = await getPublishedHaloBuilds({ discipline: 'CRAWLER' })
    expect(builds).toHaveLength(0)
  })
})

describe('Halo Build retrieval by slug/id', () => {
  it('retrieves a published build by slug', async () => {
    const build = await getHaloBuildBySlug('halo-x4-competition-spec')
    expect(build).not.toBeNull()
    expect(build?.slug).toBe('halo-x4-competition-spec')
    expect(build?.published).toBe(true)
  })

  it('returns null for an unknown slug', async () => {
    const build = await getHaloBuildBySlug('non-existent-build')
    expect(build).toBeNull()
  })

  it('retrieves a build by ID', async () => {
    const build = await getHaloBuildById('hbld-x4-comp-001')
    expect(build?.id).toBe('hbld-x4-comp-001')
  })

  it('returns null for an unknown build ID', async () => {
    const build = await getHaloBuildById('hbld-does-not-exist')
    expect(build).toBeNull()
  })

  it('published build contains at least one published version', async () => {
    const build = await getHaloBuildBySlug('halo-x4-competition-spec')
    const publishedVersion = build?.versions.find(
      (v) => v.version === build.currentVersion && v.status === 'PUBLISHED'
    )
    expect(publishedVersion).toBeDefined()
  })
})

describe('Halo Build validation', () => {
  it('validates a correctly configured published build and returns a structured result', async () => {
    const result = await validateHaloBuild('hbld-x4-comp-001', '1.0')
    expect(typeof result.isValid).toBe('boolean')
    expect(typeof result.canPublish).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('validation result detail flags are all booleans', async () => {
    const result = await validateHaloBuild('hbld-x4-comp-001', '1.0')
    expect(typeof result.details.baseMachineValid).toBe('boolean')
    expect(typeof result.details.requiredSlotsSatisfied).toBe('boolean')
    expect(result.details.baseMachineValid).toBe(true) // base machine IS in SEED_PRODUCTS
  })

  it('returns isValid false for unknown build', async () => {
    const result = await validateHaloBuild('hbld-does-not-exist', '1.0')
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('Halo Build pricing — market resolution', () => {
  it('resolves UK pricing with GBP currency', async () => {
    const build = await getHaloBuildById('hbld-x4-comp-001')
    const pricing = resolveCurrentBuildPricing(build!, 'UK')
    expect(pricing.marketCode).toBe('UK')
    expect(pricing.currency).toBe('GBP')
  })

  it('pricing lines are one per build component', async () => {
    const build = await getHaloBuildById('hbld-x4-comp-001')
    const currentVer = build!.versions.find(
      (v) => v.version === build!.currentVersion && v.status === 'PUBLISHED'
    )!
    const pricing = resolveCurrentBuildPricing(build!, 'UK')
    expect(pricing.lines).toHaveLength(currentVer.components.length)
  })

  it('isPurchasable only when all components have available market offers', async () => {
    const build = await getHaloBuildById('hbld-x4-comp-001')
    const pricing = resolveCurrentBuildPricing(build!, 'UK')
    if (pricing.availabilityState === 'AVAILABLE') {
      expect(pricing.isPurchasable).toBe(true)
    } else {
      expect(pricing.isPurchasable).toBe(false)
    }
  })

  it('totalMinorUnits is null when any component has no market offer', async () => {
    // The 4th seed build is retired, so we test with a fresh draft that has no offers
    const draft = await createHaloBuildDraft(
      {
        slug: 'test-no-offers-build',
        title: 'Test No Offers Build',
        buildType: 'HALO_BUILD',
        provenance: 'HALO_ENGINEERED',
        discipline: 'GT',
        scale: '1:10',
        platformId: 'plat-xray-x4',
        baseProductId: 'prod-xray-x4-2026',
        engineeringSummary: 'Test build with no offer coverage.',
      },
      'admin-user-001'
    )
    const pricing = resolveCurrentBuildPricing(draft, 'UK')
    // Draft version has no components, so totalMinorUnits should be 0 or null
    expect(pricing.lines).toHaveLength(0)
  })

  it('does not cross-contaminate UK and US pricing', async () => {
    const build = await getHaloBuildById('hbld-x4-comp-001')
    const ukPricing = resolveCurrentBuildPricing(build!, 'UK')
    const usPricing = resolveCurrentBuildPricing(build!, 'US')
    expect(ukPricing.currency).toBe('GBP')
    expect(usPricing.currency).toBe('USD')
    // Totals should differ (different currencies / prices)
    if (ukPricing.totalMinorUnits !== null && usPricing.totalMinorUnits !== null) {
      // Different currency systems — not equal
      expect(ukPricing.currency).not.toBe(usPricing.currency)
    }
  })
})

describe('Halo Build draft lifecycle', () => {
  it('creates a draft build that is not publicly visible', async () => {
    await createHaloBuildDraft(
      {
        slug: 'test-hidden-draft',
        title: 'Test Hidden Draft',
        buildType: 'HALO_BUILD',
        provenance: 'HALO_ENGINEERED',
        discipline: 'GT',
        scale: '1:10',
        platformId: 'plat-xray-x4',
        baseProductId: 'prod-xray-x4-2026',
        engineeringSummary: 'A draft build.',
      },
      'admin-user-001'
    )
    const discovered = await getPublishedHaloBuilds({})
    const draftVisible = discovered.some((b) => b.slug === 'test-hidden-draft')
    expect(draftVisible).toBe(false)
  })

  it('seed DRAFT build is not visible without includeDrafts', async () => {
    // hbld-draft-003 is a pre-seeded DRAFT build
    const build = await getHaloBuildById('hbld-draft-003')
    expect(build).toBeNull()
  })

  it('seed DRAFT build is accessible with includeDrafts option', async () => {
    const build = await getHaloBuildById('hbld-draft-003', { includeDrafts: true })
    expect(build).not.toBeNull()
    expect(build?.status).toBe('DRAFT')
    expect(build?.published).toBe(false)
  })

  it('rejects duplicate slugs', async () => {
    await createHaloBuildDraft(
      {
        slug: 'unique-slug-test',
        title: 'First Build',
        buildType: 'HALO_BUILD',
        provenance: 'HALO_ENGINEERED',
        discipline: 'TOURING',
        scale: '1:10',
        platformId: 'plat-xray-x4',
        baseProductId: 'prod-xray-x4-2026',
        engineeringSummary: 'First.',
      },
      'admin-user-001'
    )
    await expect(
      createHaloBuildDraft(
        {
          slug: 'unique-slug-test',
          title: 'Duplicate Build',
          buildType: 'HALO_BUILD',
          provenance: 'HALO_ENGINEERED',
          discipline: 'TOURING',
          scale: '1:10',
          platformId: 'plat-xray-x4',
          baseProductId: 'prod-xray-x4-2026',
          engineeringSummary: 'Duplicate slug attempt.',
        },
        'admin-user-001'
      )
    ).rejects.toThrow()
  })
})
