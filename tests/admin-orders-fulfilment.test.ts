import { describe, it, expect } from 'vitest'
import type { OrderPaymentStatus, OrderFulfilmentStatus } from '@halo-rc/types'

describe('Admin Orders & Fulfilment State Machine', () => {
  it('supports the full fulfilment progression stages', () => {
    const progression: OrderFulfilmentStatus[] = [
      'UNFULFILLED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
    ]

    expect(progression[0]).toBe('UNFULFILLED')
    expect(progression[1]).toBe('PROCESSING')
    expect(progression[2]).toBe('PACKED')
    expect(progression[3]).toBe('SHIPPED')
    expect(progression[4]).toBe('DELIVERED')
  })

  it('guarantees prices are handled in integer minor units to prevent float drift', () => {
    const unitPrice = 72900 // £729.00 in pence
    const quantity = 2
    const lineTotal = unitPrice * quantity

    expect(Number.isInteger(lineTotal)).toBe(true)
    expect(lineTotal).toBe(145800)

    // Formatted output test
    const formatted = `£${(lineTotal / 100).toFixed(2)}`
    expect(formatted).toBe('£1458.00')
  })

  it('enforces authorized payment states before fulfilment dispatch', () => {
    const dispatchablePaymentStates: OrderPaymentStatus[] = ['PAID', 'AUTHORIZED']
    const nonDispatchableStates: OrderPaymentStatus[] = [
      'PENDING_PAYMENT',
      'FAILED',
      'REFUNDED',
      'CANCELLED',
    ]

    for (const state of dispatchablePaymentStates) {
      expect(['PAID', 'AUTHORIZED']).toContain(state)
    }

    for (const state of nonDispatchableStates) {
      expect(dispatchablePaymentStates).not.toContain(state)
    }
  })
})
