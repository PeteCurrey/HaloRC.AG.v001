// tests/ai-audit-log.test.ts
// Phase 7 — AI audit trail integrity.
// Every AI consultation must produce an auditable event. No consultation is silent.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  logAIAuditEvent,
  logAIFeedback,
  getAIAuditSummary,
  __resetAIAuditStoreForTesting,
} from '@/lib/ai/audit'

// ── Minimal valid event factory ──────────────────────────────────────────────

function makeEvent(overrides: Partial<Parameters<typeof logAIAuditEvent>[0]> = {}) {
  return {
    requestId: `req-${Math.random().toString(36).slice(2, 10)}`,
    userId: null,
    marketCode: 'UK' as const,
    intent: 'PRODUCT_DISCOVERY' as const,
    retrievedSourceIds: [],
    modelProvider: 'deterministic-grounded',
    modelId: 'halo-discovery-v1',
    latencyMs: 100,
    groundingState: 'GROUNDED' as const,
    toolCalls: [],
    ...overrides,
  }
}

function makeFeedback(overrides: Partial<Parameters<typeof logAIFeedback>[0]> = {}) {
  return {
    requestId: `req-${Math.random().toString(36).slice(2, 10)}`,
    feedbackType: 'HELPFUL' as const,
    userId: null,
    ...overrides,
  }
}

beforeEach(() => {
  __resetAIAuditStoreForTesting()
})

describe('AI audit event logging', () => {
  it('logs an audit event and totalRequests increments', () => {
    logAIAuditEvent(makeEvent())
    const summary = getAIAuditSummary()
    expect(summary.totalRequests).toBe(1)
    expect(summary.groundedCount).toBe(1)
  })

  it('increments totalRequests for each logged event', () => {
    logAIAuditEvent(makeEvent())
    logAIAuditEvent(makeEvent({ groundingState: 'PARTIALLY_GROUNDED', intent: 'COMPATIBILITY_EXPLANATION' }))
    const summary = getAIAuditSummary()
    expect(summary.totalRequests).toBe(2)
  })

  it('tracks grounded vs partially-grounded vs insufficient-evidence counts', () => {
    logAIAuditEvent(makeEvent({ groundingState: 'GROUNDED' }))
    logAIAuditEvent(makeEvent({ groundingState: 'GROUNDED' }))
    logAIAuditEvent(makeEvent({ groundingState: 'INSUFFICIENT_EVIDENCE', intent: 'SPECIFICATION_EXPLANATION' }))
    const summary = getAIAuditSummary()
    expect(summary.groundedCount).toBe(2)
    expect(summary.insufficientEvidenceCount).toBe(1)
  })

  it('tracks unsupported count for blocked requests', () => {
    logAIAuditEvent(makeEvent({ groundingState: 'UNSUPPORTED', intent: 'UNSUPPORTED_REQUEST' }))
    const summary = getAIAuditSummary()
    expect(summary.unsupportedCount).toBe(1)
  })

  it('audit events are enumerable — none are silently dropped', () => {
    const n = 10
    for (let i = 0; i < n; i++) {
      logAIAuditEvent(makeEvent({ requestId: `req-${i}`, latencyMs: 100 + i }))
    }
    const summary = getAIAuditSummary()
    expect(summary.totalRequests).toBe(n)
  })

  it('calculates average latency across events', () => {
    logAIAuditEvent(makeEvent({ latencyMs: 100 }))
    logAIAuditEvent(makeEvent({ latencyMs: 200 }))
    const summary = getAIAuditSummary()
    expect(summary.avgLatencyMs).toBe(150)
  })

  it('recentEvents is populated and ordered newest-first', () => {
    logAIAuditEvent(makeEvent({ requestId: 'req-first' }))
    logAIAuditEvent(makeEvent({ requestId: 'req-second' }))
    const summary = getAIAuditSummary()
    expect(summary.recentEvents.length).toBe(2)
    // Reversed, so most recent is first
    expect(summary.recentEvents[0]!.requestId).toBe('req-second')
  })

  it('resets cleanly for testing isolation', () => {
    logAIAuditEvent(makeEvent())
    __resetAIAuditStoreForTesting()
    const summary = getAIAuditSummary()
    expect(summary.totalRequests).toBe(0)
    expect(summary.recentEvents).toHaveLength(0)
  })
})

describe('AI feedback logging', () => {
  it('logs helpful feedback and it appears in recentFeedback', () => {
    logAIFeedback(makeFeedback({ feedbackType: 'HELPFUL' }))
    const summary = getAIAuditSummary()
    expect(summary.recentFeedback).toHaveLength(1)
    expect(summary.recentFeedback[0]!.feedbackType).toBe('HELPFUL')
  })

  it('logs not-helpful feedback', () => {
    logAIFeedback(makeFeedback({ feedbackType: 'NOT_HELPFUL' }))
    const summary = getAIAuditSummary()
    expect(summary.recentFeedback[0]!.feedbackType).toBe('NOT_HELPFUL')
  })

  it('logs incorrect-report feedback', () => {
    logAIFeedback(makeFeedback({ feedbackType: 'REPORTED_INCORRECT' }))
    const summary = getAIAuditSummary()
    expect(summary.recentFeedback[0]!.feedbackType).toBe('REPORTED_INCORRECT')
  })

  it('feedback without userId is still recorded (anonymous)', () => {
    logAIFeedback(makeFeedback({ userId: null }))
    const summary = getAIAuditSummary()
    expect(summary.recentFeedback).toHaveLength(1)
    expect(summary.recentFeedback[0]!.userId).toBeNull()
  })

  it('multiple feedback records accumulate', () => {
    logAIFeedback(makeFeedback({ feedbackType: 'HELPFUL' }))
    logAIFeedback(makeFeedback({ feedbackType: 'NOT_HELPFUL' }))
    const summary = getAIAuditSummary()
    expect(summary.recentFeedback.length).toBe(2)
  })
})

describe('Injection attempt tracking', () => {
  it('counts UNSUPPORTED_REQUEST events as injection-related in summary', () => {
    logAIAuditEvent(makeEvent({
      groundingState: 'UNSUPPORTED',
      intent: 'UNSUPPORTED_REQUEST',
      errorState: 'Prompt injection attempt blocked',
    }))
    const summary = getAIAuditSummary()
    expect(summary.injectionAttemptsBlocked).toBeGreaterThan(0)
  })

  it('normal DISCOVERY requests are not counted as injection attempts', () => {
    logAIAuditEvent(makeEvent({ groundingState: 'GROUNDED', intent: 'PRODUCT_DISCOVERY' }))
    logAIAuditEvent(makeEvent({ groundingState: 'GROUNDED', intent: 'PRODUCT_DISCOVERY' }))
    const summary = getAIAuditSummary()
    expect(summary.injectionAttemptsBlocked).toBe(0)
  })
})
