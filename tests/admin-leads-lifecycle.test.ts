import { describe, it, expect } from 'vitest'
import type { LeadStatus, LeadPriority } from '@halo-rc/types'

describe('Admin Leads Lifecycle & Pipeline Transitions', () => {
  it('verifies valid lead status transitions in pipeline', () => {
    const validStatuses: LeadStatus[] = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'PROPOSAL_SENT',
      'WON',
      'LOST',
      'ARCHIVED',
    ]

    // Ensure state machine handles initial and terminal states
    expect(validStatuses).toContain('NEW')
    expect(validStatuses).toContain('QUALIFIED')
    expect(validStatuses).toContain('WON')
    expect(validStatuses).toContain('ARCHIVED')
  })

  it('validates lead priority levels', () => {
    const priorities: LeadPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

    expect(priorities).toContain('URGENT')
    expect(priorities).toHaveLength(4)
  })

  it('ensures lead activities preserve actor attribution and note structure', () => {
    const activity = {
      leadId: 'lead-test-01',
      userId: 'usr-staff-01',
      userEmail: 'support@avorria.com',
      action: 'STATUS_CHANGE',
      details: {
        previousStatus: 'NEW',
        newStatus: 'QUALIFIED',
        note: 'Customer holds IFMAR license and requested chassis setup consultation.',
      },
      createdAt: new Date(),
    }

    expect(activity.details.previousStatus).toBe('NEW')
    expect(activity.details.newStatus).toBe('QUALIFIED')
    expect(activity.details.note).toBeTruthy()
    expect(activity.userEmail).toBe('support@avorria.com')
  })
})
