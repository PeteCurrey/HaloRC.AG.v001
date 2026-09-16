'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ConfiguredBuild,
  ConfiguredBuildMachine,
  MarketCode,
  Discipline,
  Currency,
} from '@halo-rc/types'
import { MarketAwarePrice, StockStatus } from '@halo-rc/ui'
import { fetchBuildConfiguration } from '@/actions/build'
import { setMarketPreference } from '@/actions/market'

interface BuildEngineClientProps {
  initialMachines: ConfiguredBuildMachine[]
  initialBuild: ConfiguredBuild | null
  activeMarket: MarketCode
}

export function BuildEngineClient({
  initialMachines,
  initialBuild,
  activeMarket: initialMarket,
}: BuildEngineClientProps) {
  const [market, setMarket] = useState<MarketCode>(initialMarket)
  const [activeStage, setActiveStage] = useState<number>(initialBuild ? 2 : 1)
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL')
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    initialBuild?.machine?.id ?? null
  )
  const [selectedComponents, setSelectedComponents] = useState<Record<string, string>>(() => {
    if (!initialBuild) return {}
    const map: Record<string, string> = {}
    for (const s of initialBuild.slots) {
      if (s.selectedProduct) {
        map[s.role] = s.selectedProduct.id
      }
    }
    return map
  })
  const [build, setBuild] = useState<ConfiguredBuild | null>(initialBuild)
  const [isPending, startTransition] = useTransition()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Re-fetch build state when selections or market change
  const updateBuild = (machineId: string, components: Record<string, string>, targetMarket: MarketCode) => {
    startTransition(async () => {
      const nextBuild = await fetchBuildConfiguration({
        machineId,
        selectedComponents: components,
        marketCode: targetMarket,
      })
      setBuild(nextBuild)
    })
  }

  const handleSelectMachine = (m: ConfiguredBuildMachine) => {
    setSelectedMachineId(m.id)
    updateBuild(m.id, selectedComponents, market)
    setActiveStage(2)
  }

  const handleSelectComponent = (role: string, productId: string) => {
    const next = { ...selectedComponents, [role]: productId }
    setSelectedComponents(next)
    if (selectedMachineId) {
      updateBuild(selectedMachineId, next, market)
    }
  }

  const handleRemoveComponent = (role: string) => {
    const next = { ...selectedComponents }
    delete next[role]
    setSelectedComponents(next)
    if (selectedMachineId) {
      updateBuild(selectedMachineId, next, market)
    }
  }

  const handleMarketChange = (newMarket: MarketCode) => {
    setMarket(newMarket)
    startTransition(async () => {
      await setMarketPreference(newMarket)
      if (selectedMachineId) {
        const nextBuild = await fetchBuildConfiguration({
          machineId: selectedMachineId,
          selectedComponents,
          marketCode: newMarket,
        })
        setBuild(nextBuild)
      }
    })
  }

  const filteredMachines = initialMachines.filter((m) => {
    if (selectedDiscipline === 'ALL') return true
    return m.discipline === selectedDiscipline
  })

  const stages = [
    { num: 1, title: '01 Machine', label: 'Select Machine' },
    { num: 2, title: '02 Architecture', label: 'Chassis Architecture' },
    { num: 3, title: '03 Required', label: 'Required Components' },
    { num: 4, title: '04 Upgrades', label: 'Options & Upgrades' },
    { num: 5, title: '05 Verification', label: 'Compatibility Matrix' },
    { num: 6, title: '06 Summary', label: 'Build Breakdown' },
  ]

  const requiredSlots = build?.slots.filter((s) => s.requirement === 'REQUIRED') ?? []
  const optionalSlots = build?.slots.filter((s) => s.requirement !== 'REQUIRED') ?? []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', color: 'var(--colour-white)', paddingBottom: '120px' }}>
      {/* Top Engineering Banner */}
      <header
        style={{
          borderBottom: '1px solid var(--colour-steel)',
          backgroundColor: 'var(--colour-graphite)',
          padding: 'var(--space-4) var(--gutter-md)',
        }}
      >
        <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
                Halo RC Build Engine · Deterministic Product Graph
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 'var(--space-1) 0 0' }}>
              Build My Rig
            </h1>
          </div>

          {/* Market & Engine Status Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
              <span>MARKET:</span>
              <button
                type="button"
                onClick={() => handleMarketChange('UK')}
                style={{
                  padding: '2px 8px',
                  backgroundColor: market === 'UK' ? 'var(--colour-carbon)' : 'transparent',
                  color: market === 'UK' ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                  border: `1px solid ${market === 'UK' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: market === 'UK' ? 600 : 400,
                }}
              >
                UK (GBP)
              </button>
              <button
                type="button"
                onClick={() => handleMarketChange('US')}
                style={{
                  padding: '2px 8px',
                  backgroundColor: market === 'US' ? 'var(--colour-carbon)' : 'transparent',
                  color: market === 'US' ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                  border: `1px solid ${market === 'US' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: market === 'US' ? 600 : 400,
                }}
              >
                US (USD)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Stepper (Engineering Stages) */}
      <nav
        aria-label="Build Stages"
        style={{
          borderBottom: '1px solid var(--colour-steel)',
          backgroundColor: 'var(--colour-carbon)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '0 var(--gutter-md)',
        }}
      >
        <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto', display: 'flex', gap: 'var(--space-2)' }}>
          {stages.map((stage) => {
            const isActive = activeStage === stage.num
            const isCompleted = activeStage > stage.num || (stage.num === 1 && selectedMachineId)
            return (
              <button
                key={stage.num}
                type="button"
                onClick={() => {
                  if (stage.num === 1 || selectedMachineId) {
                    setActiveStage(stage.num)
                  }
                }}
                disabled={stage.num > 1 && !selectedMachineId}
                style={{
                  padding: 'var(--space-4) var(--space-3)',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--colour-halo)' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? 'var(--colour-halo)' : isCompleted ? 'var(--colour-off-white)' : 'var(--colour-smoke)',
                  cursor: stage.num === 1 || selectedMachineId ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  opacity: stage.num > 1 && !selectedMachineId ? 0.4 : 1,
                }}
              >
                <span>{stage.title}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto', padding: 'var(--space-6) var(--gutter-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 'var(--space-8)', alignItems: 'start' }}>
          
          {/* Main Stage Content */}
          <main style={{ minWidth: 0 }}>
            {/* Loading Indicator */}
            {isPending && (
              <div style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: 'var(--colour-graphite)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)' }}>
                Recalculating build graph from verified database rules...
              </div>
            )}

            {/* STAGE 01: Choose Machine */}
            {activeStage === 1 && (
              <section aria-labelledby="stage-1-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-1-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    01. Select Base Vehicle or Chassis
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    Choose the competition platform or ready-to-run machine to establish build architecture.
                  </p>
                </div>

                {/* Discipline Filter Tabs */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
                  {['ALL', 'RACE', 'BASH', 'DRIFT', 'CRAWL', 'SCALE', 'LARGE_SCALE'].map((disc) => (
                    <button
                      key={disc}
                      type="button"
                      onClick={() => setSelectedDiscipline(disc)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6875rem',
                        textTransform: 'uppercase',
                        backgroundColor: selectedDiscipline === disc ? 'var(--colour-halo)' : 'var(--colour-carbon)',
                        color: selectedDiscipline === disc ? 'var(--colour-void)' : 'var(--colour-smoke)',
                        border: `1px solid ${selectedDiscipline === disc ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: selectedDiscipline === disc ? 600 : 400,
                      }}
                    >
                      {disc}
                    </button>
                  ))}
                </div>

                {/* Machine Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
                  {filteredMachines.map((m) => {
                    const isSelected = selectedMachineId === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMachine(m)}
                        style={{
                          padding: 'var(--space-5)',
                          backgroundColor: isSelected ? 'var(--colour-graphite)' : 'var(--colour-carbon)',
                          border: `1px solid ${isSelected ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                              {m.brandName}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.5625rem',
                                padding: '1px 5px',
                                borderRadius: '2px',
                                backgroundColor: m.productType === 'RTR_MACHINE' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(232, 197, 71, 0.15)',
                                color: m.productType === 'RTR_MACHINE' ? 'var(--colour-verified)' : 'var(--colour-halo)',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                              }}
                            >
                              {m.productType === 'RTR_MACHINE' ? 'RTR COMPLETE' : 'COMPETITION KIT'}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--colour-off-white)', margin: '0 0 var(--space-2)' }}>
                            {m.name}
                          </h3>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 1.4, marginBottom: 'var(--space-3)' }}>
                            {m.editorialSummary.slice(0, 95)}...
                          </p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          {m.offer ? (
                            <>
                              <MarketAwarePrice
                                amountMinorUnits={m.offer.retailPriceMinorUnits}
                                currency={m.offer.currency as Currency}
                                taxMode={m.offer.taxMode}
                                size="sm"
                              />
                              <StockStatus status={m.offer.availability} />
                            </>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                              Not Available in {market}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* STAGE 02: Chassis Architecture & Build Definition */}
            {activeStage === 2 && build?.machine && (
              <section aria-labelledby="stage-2-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-2-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    02. Architecture &amp; Requirement Specification
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    Engineered requirement determination for {build.machine.name}.
                  </p>
                </div>

                <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
                        {build.machine.brandName} · {build.machine.tier}
                      </span>
                      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--colour-white)', margin: 'var(--space-1) 0' }}>
                        {build.machine.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStage(1)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        backgroundColor: 'transparent',
                        color: 'var(--colour-smoke)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      Change Vehicle
                    </button>
                  </div>

                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                    {build.machine.editorialSummary}
                  </p>

                  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                    {build.machine.scale && <span>Scale: {build.machine.scale}</span>}
                    {build.machine.powerType && <span>Power: {build.machine.powerType}</span>}
                    {build.machine.platformName && <span>Platform: {build.machine.platformName}</span>}
                  </div>
                </div>

                {/* Architecture Policy Notice */}
                <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--colour-graphite)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-8)' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-off-white)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                    {build.machine.productType === 'RTR_MACHINE' ? 'Ready-To-Run Architecture' : 'Competition Rolling Chassis Architecture'}
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 1.5 }}>
                    {build.machine.productType === 'RTR_MACHINE'
                      ? 'This vehicle comes factory-assembled with pre-installed electronics, transmitter, and servo. No additional electronics slots are mandatory to complete this build. You may optionally configure performance upgrades.'
                      : 'This chassis requires matched competition electronics (Motor, ESC, Steering Servo, LiPo Battery) and recommends high-response telemetry radio equipment. All selections are validated against explicit manufacturer compatibility rules.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(build.machine?.productType === 'RTR_MACHINE' ? 4 : 3)}
                    style={{
                      padding: 'var(--space-3) var(--space-6)',
                      backgroundColor: 'var(--colour-halo)',
                      color: 'var(--colour-void)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Proceed to Component Selection →
                  </button>
                </div>
              </section>
            )}

            {/* STAGE 03: Select Required Components */}
            {activeStage === 3 && (
              <section aria-labelledby="stage-3-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-3-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    03. Mandatory Electronics &amp; Power Requirements
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    Every slot below is required to complete this chassis. Components are filtered strictly by verified compatibility rules.
                  </p>
                </div>

                {requiredSlots.length === 0 ? (
                  <div style={{ padding: 'var(--space-8)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--colour-verified)', fontWeight: 500 }}>
                      No mandatory slots required for this ready-to-run vehicle.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveStage(4)}
                      style={{
                        marginTop: 'var(--space-4)',
                        padding: 'var(--space-3) var(--space-5)',
                        backgroundColor: 'var(--colour-halo)',
                        color: 'var(--colour-void)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      View Options &amp; Upgrades →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                    {requiredSlots.map((slot) => {
                      return (
                        <div
                          key={slot.role}
                          style={{
                            backgroundColor: 'var(--colour-carbon)',
                            border: `1px solid ${slot.slotState === 'INVALID' ? '#ff4444' : slot.selectedProduct ? 'var(--colour-steel)' : 'var(--colour-steel)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-6)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.5625rem',
                                  padding: '1px 5px',
                                  borderRadius: '2px',
                                  backgroundColor: 'rgba(232, 197, 71, 0.15)',
                                  color: 'var(--colour-halo)',
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                }}
                              >
                                REQUIRED
                              </span>
                              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-off-white)' }}>
                                {slot.name}
                              </h3>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                              {slot.compatibleProducts.length} verified option{slot.compatibleProducts.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
                            {slot.description}
                          </p>

                          {/* Selected Item Callout */}
                          {slot.selectedProduct && (
                            <div
                              style={{
                                padding: 'var(--space-4)',
                                backgroundColor: 'var(--colour-graphite)',
                                border: '1px solid var(--colour-steel)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--space-4)',
                              }}
                            >
                              <div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-verified)', display: 'block' }}>
                                  ✓ SELECTED COMPONENT
                                </span>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                                  {slot.selectedProduct.name}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', marginLeft: 'var(--space-2)' }}>
                                  SKU: {slot.selectedProduct.sku}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                {slot.selectedProduct.offer ? (
                                  <MarketAwarePrice
                                    amountMinorUnits={slot.selectedProduct.offer.retailPriceMinorUnits}
                                    currency={slot.selectedProduct.offer.currency as Currency}
                                    taxMode={slot.selectedProduct.offer.taxMode}
                                    size="sm"
                                  />
                                ) : (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#ff8800' }}>
                                    NOT AVAILABLE IN {market}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComponent(slot.role)}
                                  style={{
                                    padding: '2px 8px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--colour-steel)',
                                    color: 'var(--colour-smoke)',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.625rem',
                                  }}
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Conflict / Validation Error Notice */}
                          {slot.validationError && (
                            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: '#ff6666' }}>
                              <strong>Conflict Detected:</strong> {slot.validationError}
                            </div>
                          )}

                          {/* Candidate Selection Options */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                            {slot.compatibleProducts.map((cand) => {
                              const isCurrent = slot.selectedProduct?.id === cand.id
                              return (
                                <div
                                  key={cand.id}
                                  style={{
                                    padding: 'var(--space-4)',
                                    backgroundColor: isCurrent ? 'var(--colour-graphite)' : 'var(--colour-void)',
                                    border: `1px solid ${isCurrent ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: cand.isRecommended ? 'var(--colour-halo)' : 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                                        {cand.isRecommended ? '★ Recommended' : 'Alternative Option'}
                                      </span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--colour-smoke)' }}>
                                        {cand.sku}
                                      </span>
                                    </div>
                                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', margin: '0 0 var(--space-1)' }}>
                                      {cand.name}
                                    </h4>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--colour-ash)', marginBottom: 'var(--space-3)' }}>
                                      {cand.compatibilityReason}
                                    </p>
                                  </div>

                                  <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      {cand.offer ? (
                                        <MarketAwarePrice
                                          amountMinorUnits={cand.offer.retailPriceMinorUnits}
                                          currency={cand.offer.currency as Currency}
                                          taxMode={cand.offer.taxMode}
                                          size="sm"
                                        />
                                      ) : (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#ff8800' }}>
                                          Not available in {market}
                                        </span>
                                      )}
                                    </div>

                                    {cand.lifecycle === 'REPLACED' ? (
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--colour-smoke)' }}>
                                        SUPERSEDED
                                      </span>
                                    ) : isCurrent ? (
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)' }}>
                                        ✓ Selected
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectComponent(slot.role, cand.id)}
                                        style={{
                                          padding: '3px 10px',
                                          backgroundColor: 'var(--colour-carbon)',
                                          color: 'var(--colour-off-white)',
                                          border: '1px solid var(--colour-steel)',
                                          borderRadius: '2px',
                                          cursor: 'pointer',
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: '0.625rem',
                                        }}
                                      >
                                        Select
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(2)}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      backgroundColor: 'transparent',
                      color: 'var(--colour-smoke)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    ← Back to Architecture
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStage(4)}
                    style={{
                      padding: 'var(--space-3) var(--space-6)',
                      backgroundColor: 'var(--colour-halo)',
                      color: 'var(--colour-void)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Options &amp; Upgrades →
                  </button>
                </div>
              </section>
            )}

            {/* STAGE 04: Select Optional / Upgrade Components */}
            {activeStage === 4 && (
              <section aria-labelledby="stage-4-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-4-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    04. Recommended Hardware, Options &amp; Tuning Upgrades
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    Enhance your build with factory team options, aerodynamic bodies, and high-performance chargers. None of these are mandatory.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                  {optionalSlots.map((slot) => (
                    <div
                      key={slot.role}
                      style={{
                        backgroundColor: 'var(--colour-carbon)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-6)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.5625rem',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              backgroundColor: slot.requirement === 'RECOMMENDED' ? 'rgba(232, 197, 71, 0.15)' : 'rgba(150, 150, 150, 0.15)',
                              color: slot.requirement === 'RECOMMENDED' ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                            }}
                          >
                            {slot.requirement}
                          </span>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-off-white)' }}>
                            {slot.name}
                          </h3>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                          {slot.compatibleProducts.length} option{slot.compatibleProducts.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
                        {slot.description}
                      </p>

                      {slot.selectedProduct && (
                        <div
                          style={{
                            padding: 'var(--space-4)',
                            backgroundColor: 'var(--colour-graphite)',
                            border: '1px solid var(--colour-steel)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--space-4)',
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-verified)', display: 'block' }}>
                              ✓ SELECTED OPTION
                            </span>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                              {slot.selectedProduct.name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            {slot.selectedProduct.offer && (
                              <MarketAwarePrice
                                amountMinorUnits={slot.selectedProduct.offer.retailPriceMinorUnits}
                                currency={slot.selectedProduct.offer.currency as Currency}
                                taxMode={slot.selectedProduct.offer.taxMode}
                                size="sm"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(slot.role)}
                              style={{
                                padding: '2px 8px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--colour-steel)',
                                color: 'var(--colour-smoke)',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.625rem',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                        {slot.compatibleProducts.map((cand) => {
                          const isCurrent = slot.selectedProduct?.id === cand.id
                          return (
                            <div
                              key={cand.id}
                              style={{
                                padding: 'var(--space-4)',
                                backgroundColor: isCurrent ? 'var(--colour-graphite)' : 'var(--colour-void)',
                                border: `1px solid ${isCurrent ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-1)' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: cand.isRecommended ? 'var(--colour-halo)' : 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                                    {cand.isRecommended ? '★ Recommended' : 'Upgrade Option'}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--colour-smoke)' }}>
                                    {cand.sku}
                                  </span>
                                </div>
                                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', margin: '0 0 var(--space-1)' }}>
                                  {cand.name}
                                </h4>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--colour-ash)', marginBottom: 'var(--space-3)' }}>
                                  {cand.compatibilityReason}
                                </p>
                              </div>

                              <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  {cand.offer ? (
                                    <MarketAwarePrice
                                      amountMinorUnits={cand.offer.retailPriceMinorUnits}
                                      currency={cand.offer.currency as Currency}
                                      taxMode={cand.offer.taxMode}
                                      size="sm"
                                    />
                                  ) : (
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#ff8800' }}>
                                      Not available in {market}
                                    </span>
                                  )}
                                </div>

                                {isCurrent ? (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)' }}>
                                    ✓ Selected
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectComponent(slot.role, cand.id)}
                                    style={{
                                      padding: '3px 10px',
                                      backgroundColor: 'var(--colour-carbon)',
                                      color: 'var(--colour-off-white)',
                                      border: '1px solid var(--colour-steel)',
                                      borderRadius: '2px',
                                      cursor: 'pointer',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.625rem',
                                    }}
                                  >
                                    Select
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(3)}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      backgroundColor: 'transparent',
                      color: 'var(--colour-smoke)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    ← Back to Required
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStage(5)}
                    style={{
                      padding: 'var(--space-3) var(--space-6)',
                      backgroundColor: 'var(--colour-halo)',
                      color: 'var(--colour-void)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Review Compatibility &amp; Summary →
                  </button>
                </div>
              </section>
            )}

            {/* STAGE 05: Review Compatibility Matrix */}
            {activeStage === 5 && build && (
              <section aria-labelledby="stage-5-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-5-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    05. Compatibility Verification &amp; Engineering Rules
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    All component matches are governed by structured database compatibility rules. No AI guessing or heuristic inference.
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-8)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>SLOT</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>STATUS</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>COMPONENT</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>AUTHORITY REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {build.slots.map((s) => (
                        <tr key={s.role} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                          <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-off-white)' }}>
                            {s.role}
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.625rem',
                                color:
                                  s.slotState === 'SELECTED'
                                    ? 'var(--colour-verified)'
                                    : s.slotState === 'INVALID'
                                    ? '#ff4444'
                                    : s.requirement === 'REQUIRED'
                                    ? '#ff8800'
                                    : 'var(--colour-smoke)',
                              }}
                            >
                              {s.slotState === 'SELECTED' ? '✓ VALID' : s.slotState === 'INVALID' ? '✗ CONFLICT' : s.requirement === 'REQUIRED' ? '! MISSING' : '— OPTIONAL'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)', color: s.selectedProduct ? 'var(--colour-white)' : 'var(--colour-smoke)' }}>
                            {s.selectedProduct ? s.selectedProduct.name : 'None selected'}
                          </td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>
                            {s.validationError ? (
                              <span style={{ color: '#ff6666' }}>{s.validationError}</span>
                            ) : s.selectedProduct ? (
                              s.selectedProduct.compatibilityReason
                            ) : (
                              `${s.compatibleProducts.length} verified candidate products in database`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(4)}
                    style={{
                      padding: 'var(--space-3) var(--space-5)',
                      backgroundColor: 'transparent',
                      color: 'var(--colour-smoke)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    ← Back to Upgrades
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStage(6)}
                    style={{
                      padding: 'var(--space-3) var(--space-6)',
                      backgroundColor: 'var(--colour-halo)',
                      color: 'var(--colour-void)',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                    }}
                  >
                    View Final Build Summary →
                  </button>
                </div>
              </section>
            )}

            {/* STAGE 06: Final Build Summary & Commercial Breakdown */}
            {activeStage === 6 && build?.machine && (
              <section aria-labelledby="stage-6-heading">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 id="stage-6-heading" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-2)' }}>
                    06. Build Review &amp; Quotation Breakdown
                  </h2>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)' }}>
                    Detailed breakdown of base chassis, selected electronics, and verified upgrades for {market} delivery.
                  </p>
                </div>

                {/* Build Status Card */}
                <div
                  style={{
                    padding: 'var(--space-6)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: `1px solid ${
                      build.status === 'COMPLETE'
                        ? 'var(--colour-verified)'
                        : build.status === 'INVALID'
                        ? '#ff4444'
                        : 'var(--colour-halo)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                        BUILD STATE
                      </span>
                      <h3
                        style={{
                          fontSize: 'var(--text-xl)',
                          fontWeight: 700,
                          color:
                            build.status === 'COMPLETE'
                              ? 'var(--colour-verified)'
                              : build.status === 'INVALID'
                              ? '#ff4444'
                              : 'var(--colour-halo)',
                          margin: 'var(--space-1) 0 0',
                        }}
                      >
                        {build.status === 'COMPLETE' && '✓ BUILD READY & CERTIFIED'}
                        {build.status === 'INCOMPLETE' && '! INCOMPLETE BUILD CONFIGURATION'}
                        {build.status === 'INVALID' && '✗ CONFLICT IN BUILD CONFIGURATION'}
                        {build.status === 'DRAFT' && 'DRAFT SPECIFICATION'}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--colour-graphite)',
                        color: 'var(--colour-off-white)',
                      }}
                    >
                      {build.completeness.completedRequiredSlots} of {build.completeness.totalRequiredSlots} Required Slots Satisfied
                    </span>
                  </div>

                  {build.completeness.missingRequiredSlots.length > 0 && (
                    <p style={{ fontSize: 'var(--text-xs)', color: '#ffaa00', margin: 0 }}>
                      Missing mandatory components: {build.completeness.missingRequiredSlots.join(', ')}
                    </p>
                  )}
                </div>

                {/* Line Item Table */}
                <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-6)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>ITEM / ROLE</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>COMPONENT</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>SKU</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>PRICE ({market})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Base Machine */}
                      <tr style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 600, color: 'var(--colour-halo)' }}>
                          BASE VEHICLE
                        </td>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--colour-white)', fontWeight: 500 }}>
                          {build.machine.name}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                          {build.machine.sku}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          {build.machine.offer ? (
                            <MarketAwarePrice
                              amountMinorUnits={build.machine.offer.retailPriceMinorUnits}
                              currency={build.machine.offer.currency as Currency}
                              taxMode={build.machine.offer.taxMode}
                              size="sm"
                            />
                          ) : (
                            <span style={{ color: 'var(--colour-smoke)' }}>Not available</span>
                          )}
                        </td>
                      </tr>

                      {/* Selected Slots */}
                      {build.slots
                        .filter((s) => s.selectedProduct !== null)
                        .map((s) => (
                          <tr key={s.role} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                            <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                              {s.name}
                            </td>
                            <td style={{ padding: 'var(--space-4)', color: 'var(--colour-off-white)' }}>
                              {s.selectedProduct!.name}
                            </td>
                            <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                              {s.selectedProduct!.sku}
                            </td>
                            <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                              {s.selectedProduct!.offer ? (
                                <MarketAwarePrice
                                  amountMinorUnits={s.selectedProduct!.offer.retailPriceMinorUnits}
                                  currency={s.selectedProduct!.offer.currency as Currency}
                                  taxMode={s.selectedProduct!.offer.taxMode}
                                  size="sm"
                                />
                              ) : (
                                <span style={{ color: '#ff8800' }}>Price unavailable</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Commercial Total Footer */}
                <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block' }}>
                      TAX POLICY · {market}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                      {market === 'UK'
                        ? 'All prices include 20% United Kingdom VAT. Free insured dispatch.'
                        : 'Prices displayed in USD excluding state & local sales taxes.'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block' }}>
                      TOTAL BUILD ESTIMATE
                    </span>
                    {build.priceState === 'KNOWN_PRICE' && build.totalMinorUnits !== null ? (
                      <MarketAwarePrice
                        amountMinorUnits={build.totalMinorUnits}
                        currency={build.currency}
                        taxMode={build.taxMode}
                        size="xl"
                      />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-smoke)' }}>
                        Price Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* Desktop Persistent Summary Sidebar */}
          <aside
            style={{
              position: 'sticky',
              top: 'var(--space-6)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 'var(--space-2)' }}>
              LIVE BUILD SUMMARY
            </span>

            {build?.machine ? (
              <>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--colour-white)', margin: '0 0 var(--space-1)' }}>
                  {build.machine.name}
                </h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)', display: 'block', marginBottom: 'var(--space-4)' }}>
                  {build.machine.productType === 'RTR_MACHINE' ? 'Ready-To-Run' : 'Competition Kit'} · {market}
                </span>

                <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--colour-ash)' }}>Base Vehicle</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-off-white)' }}>
                      {build.machine.offer ? `£${(build.machine.offer.retailPriceMinorUnits / 100).toFixed(2)}` : '—'}
                    </span>
                  </div>

                  {build.slots
                    .filter((s) => s.selectedProduct)
                    .map((s) => (
                      <div key={s.role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>
                        <span style={{ color: 'var(--colour-smoke)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {s.selectedProduct!.shortName || s.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                          {s.selectedProduct!.offer ? `£${(s.selectedProduct!.offer.retailPriceMinorUnits / 100).toFixed(2)}` : '—'}
                        </span>
                      </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                      BUILD TOTAL
                    </span>
                    {build.priceState === 'KNOWN_PRICE' && build.totalMinorUnits !== null ? (
                      <MarketAwarePrice
                        amountMinorUnits={build.totalMinorUnits}
                        currency={build.currency}
                        taxMode={build.taxMode}
                        size="base"
                      />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
                        Price Unavailable
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor:
                      build.status === 'COMPLETE'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : build.status === 'INVALID'
                        ? 'rgba(255, 68, 68, 0.1)'
                        : 'var(--colour-graphite)',
                    border: `1px solid ${
                      build.status === 'COMPLETE'
                        ? 'var(--colour-verified)'
                        : build.status === 'INVALID'
                        ? '#ff4444'
                        : 'var(--colour-steel)'
                    }`,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color:
                        build.status === 'COMPLETE'
                          ? 'var(--colour-verified)'
                          : build.status === 'INVALID'
                          ? '#ff4444'
                          : 'var(--colour-smoke)',
                      textTransform: 'uppercase',
                    }}
                  >
                    STATUS: {build.status}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', margin: 0 }}>
                Select a vehicle in Stage 01 to initialize live build total and slot requirements.
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Summary Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--colour-graphite)',
          borderTop: '1px solid var(--colour-steel)',
          padding: 'var(--space-3) var(--gutter-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
        }}
      >
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', display: 'block', textTransform: 'uppercase' }}>
            {build?.status === 'COMPLETE' ? '✓ BUILD READY' : 'BUILD IN PROGRESS'} ({market})
          </span>
          {build?.priceState === 'KNOWN_PRICE' && build.totalMinorUnits !== null ? (
            <MarketAwarePrice
              amountMinorUnits={build.totalMinorUnits}
              currency={build.currency}
              taxMode={build.taxMode}
              size="base"
            />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-smoke)' }}>
              Price Unavailable
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => setActiveStage(6)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-halo)',
              color: 'var(--colour-void)',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
            }}
          >
            Review Build
          </button>
        </div>
      </div>
    </div>
  )
}
