import { describe, it, expect } from 'vitest'
import { getMachineConfiguratorSlots } from '@halo-rc/db'

describe('Configurator Foundation Engine (getMachineConfiguratorSlots)', () => {
  it('resolves required competition electronics slots for rolling chassis / kit machines', async () => {
    // XRAY X4 '26 Kit
    const slots = await getMachineConfiguratorSlots('prod-xray-x4-2026', 'UK')
    expect(slots.length).toBeGreaterThan(0)

    const roles = slots.map((s) => s.role)
    expect(roles).toContain('ESC')
    expect(roles).toContain('SERVO_STEERING')
    expect(roles).toContain('RADIO')

    // Check slot requirements
    const escSlot = slots.find((s) => s.role === 'ESC')
    expect(escSlot).toBeDefined()
    expect(escSlot?.requirement).toBe('REQUIRED')
    expect(escSlot?.compatibleProducts.length).toBeGreaterThan(0)

    const servoSlot = slots.find((s) => s.role === 'SERVO_STEERING')
    expect(servoSlot).toBeDefined()
    expect(servoSlot?.requirement).toBe('REQUIRED')
    expect(servoSlot?.compatibleProducts.length).toBeGreaterThan(0)
  })

  it('populates slots with verified compatible options carrying market offers', async () => {
    const slots = await getMachineConfiguratorSlots('prod-xray-x4-2026', 'UK')
    const escSlot = slots.find((s) => s.role === 'ESC')
    expect(escSlot).toBeDefined()

    for (const prod of escSlot!.compatibleProducts) {
      expect(prod.id).toBeDefined()
      expect(prod.name).toBeTruthy()
      expect(prod.sku).toBeTruthy()
      expect(prod.offer).toBeDefined()
      expect(prod.offer?.currency).toBe('GBP')
    }
  })

  it('returns empty slot list for RTR (Ready-To-Run) machines', async () => {
    // Traxxas X-Maxx 8S is an RTR monster truck — complete out of the box
    const slots = await getMachineConfiguratorSlots('prod-traxxas-xmaxx-8s', 'UK')
    expect(slots).toEqual([])
  })

  it('returns empty slot list for non-existent product ID', async () => {
    const slots = await getMachineConfiguratorSlots('non-existent-id', 'UK')
    expect(slots).toEqual([])
  })
})
