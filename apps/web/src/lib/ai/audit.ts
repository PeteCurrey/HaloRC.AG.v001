// apps/web/src/lib/ai/audit.ts
// AI Audit Logging & Monitoring Repository.
// Tracks request volume, grounding telemetry, and prompt injection attempts.

import type { AIAuditEvent, AIFeedbackRecord, AIIntentCategory, AIGroundingState, MarketCode } from '@halo-rc/types'

let AI_AUDIT_LOGS: AIAuditEvent[] = []
let AI_FEEDBACK_LOGS: AIFeedbackRecord[] = []

export function __resetAIAuditStoreForTesting(): void {
  AI_AUDIT_LOGS = []
  AI_FEEDBACK_LOGS = []
}

export function logAIAuditEvent(event: Omit<AIAuditEvent, 'id' | 'createdAt'>): AIAuditEvent {
  const record: AIAuditEvent = {
    id: `ai-log-${crypto.randomUUID().slice(0, 8)}`,
    ...event,
    createdAt: new Date().toISOString(),
  }

  AI_AUDIT_LOGS.push(record)
  return record
}

export function logAIFeedback(feedback: Omit<AIFeedbackRecord, 'id' | 'createdAt'>): AIFeedbackRecord {
  const record: AIFeedbackRecord = {
    id: `ai-fb-${crypto.randomUUID().slice(0, 8)}`,
    ...feedback,
    createdAt: new Date().toISOString(),
  }

  AI_FEEDBACK_LOGS.push(record)
  return record
}

export function getAIAuditSummary() {
  const totalRequests = AI_AUDIT_LOGS.length
  const groundedCount = AI_AUDIT_LOGS.filter((l) => l.groundingState === 'GROUNDED').length
  const partiallyGroundedCount = AI_AUDIT_LOGS.filter((l) => l.groundingState === 'PARTIALLY_GROUNDED').length
  const insufficientEvidenceCount = AI_AUDIT_LOGS.filter((l) => l.groundingState === 'INSUFFICIENT_EVIDENCE').length
  const unsupportedCount = AI_AUDIT_LOGS.filter((l) => l.groundingState === 'UNSUPPORTED').length

  const avgLatencyMs = totalRequests > 0
    ? Math.round(AI_AUDIT_LOGS.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalRequests)
    : 0

  const injectionAttemptsBlocked = AI_AUDIT_LOGS.filter((l) =>
    l.errorState?.includes('injection') || l.intent === 'UNSUPPORTED_REQUEST'
  ).length

  return {
    totalRequests,
    groundedCount,
    partiallyGroundedCount,
    insufficientEvidenceCount,
    unsupportedCount,
    avgLatencyMs,
    injectionAttemptsBlocked,
    recentEvents: AI_AUDIT_LOGS.slice(-20).reverse(),
    recentFeedback: AI_FEEDBACK_LOGS.slice(-20).reverse(),
  }
}
