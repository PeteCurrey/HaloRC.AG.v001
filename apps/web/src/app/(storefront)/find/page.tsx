// apps/web/src/app/(storefront)/find/page.tsx
// Find My Machine — Grounded AI Consultation Engine.
// Strictly maps customer requirements to verified catalogue specifications and explicit compatibility rules.

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AIResponse, MarketCode } from '@halo-rc/types'

const PRESET_QUERIES = [
  '1/10 touring car for high-grip carpet club racing',
  '1/8 competition off-road buggy kit',
  'Brushless ESC and motor for Xray X4',
  'Heavyweight 1/5 large scale petrol beast',
]

export default function FindMyMachinePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [marketCode, setMarketCode] = useState<MarketCode>('UK')

  async function handleConsult(e?: React.FormEvent, customQuery?: string) {
    if (e) e.preventDefault()
    const activeQuery = customQuery || query
    if (!activeQuery.trim()) return

    setLoading(true)
    setFeedbackGiven(false)

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'DISCOVERY',
          query: activeQuery,
          marketCode,
        }),
      })
      const data = await res.json()
      setResponse(data)
    } catch {
      setResponse({
        answer: 'Consultation service unavailable. Deterministic catalogue fallback engaged.',
        groundingState: 'UNSUPPORTED',
        intent: 'UNSUPPORTED_REQUEST',
        sources: [],
        recommendations: [],
        warnings: ['Unable to reach consultation endpoint.'],
        followUpActions: [{ label: 'Explore Catalogue', href: '/machines' }],
      })
    } finally {
      setLoading(false)
    }
  }

  async function sendFeedback(type: 'HELPFUL' | 'NOT_HELPFUL' | 'REPORTED_INCORRECT') {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: `find-req-${Date.now()}`,
          feedbackType: type,
        }),
      })
      setFeedbackGiven(true)
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
            Grounded Consultation Engine
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-4)' }}>
          Find My Machine
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-8)' }}>
          Not a generic AI chatbot. A deterministic engineering advisor that translates your natural requirements strictly into verified catalogue specifications, explicit compatibility rules, and live market offers.
        </p>

        {/* Input Form */}
        <form onSubmit={handleConsult} style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: '720px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I need a 1/10 touring car for carpet club racing..."
              style={{
                flex: 1,
                padding: 'var(--space-4) var(--space-5)',
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-off-white)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 'var(--space-4) var(--space-6)',
                backgroundColor: 'var(--colour-halo)',
                color: 'var(--colour-void)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Consulting...' : 'Consult'}
            </button>
          </div>
        </form>

        {/* Quick Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-9)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', alignSelf: 'center', marginRight: 'var(--space-2)' }}>
            Suggested:
          </span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setQuery(preset)
                handleConsult(undefined, preset)
              }}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-mist)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-ash)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Results Container */}
        {response && (
          <div
            style={{
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-7)',
              maxWidth: '840px',
              marginBottom: 'var(--space-9)',
            }}
          >
            {/* Grounding Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: response.groundingState === 'GROUNDED' ? 'var(--colour-verified)' : 'var(--colour-caution)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-off-white)', textTransform: 'uppercase' }}>
                  {response.groundingState}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)' }}>
                INTENT: {response.intent}
              </span>
            </div>

            {/* Answer */}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-off-white)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-6)' }}>
              {response.answer}
            </p>

            {/* Warnings */}
            {response.warnings.length > 0 && (
              <div style={{ backgroundColor: 'rgba(255, 180, 0, 0.1)', border: '1px solid var(--colour-caution)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                {response.warnings.map((w, idx) => (
                  <p key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-caution)', margin: 0 }}>
                    ⚠️ {w}
                  </p>
                ))}
              </div>
            )}

            {/* Recommendations Grid */}
            {response.recommendations.length > 0 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-3)' }}>
                  Authoritative Catalogue Matches
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
                  {response.recommendations.map((rec) => (
                    <div
                      key={rec.productId}
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--colour-graphite)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                          {rec.sku}
                        </span>
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', margin: 'var(--space-1) 0' }}>
                          {rec.productName}
                        </h3>
                        {rec.priceMinorUnits && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)' }}>
                            {rec.currency === 'GBP' ? '£' : '$'}
                            {(rec.priceMinorUnits / 100).toFixed(2)}
                          </span>
                        )}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-3) 0 0 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          {rec.reasons.map((r, rIdx) => (
                            <li key={rIdx} style={{ fontSize: '0.6875rem', color: 'var(--colour-ash)' }}>
                              ✓ {r.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        href={`/machines/${rec.productId}`}
                        style={{
                          marginTop: 'var(--space-4)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--colour-off-white)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Inspect Specification →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Citations */}
            {response.sources.length > 0 && (
              <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--colour-smoke)', display: 'block', marginBottom: 'var(--space-2)' }}>
                  Authoritative Source Citations
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {response.sources.map((src) => (
                    <span
                      key={src.id}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        backgroundColor: 'var(--colour-graphite)',
                        border: '1px solid var(--colour-mist)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--colour-ash)',
                      }}
                    >
                      {src.sourceType}: {src.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Widget */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                Was this authoritative consultation accurate?
              </span>
              {feedbackGiven ? (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-verified)' }}>
                  ✓ Thank you for your feedback
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={() => sendFeedback('HELPFUL')}
                    style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'transparent', border: '1px solid var(--colour-steel)', color: 'var(--colour-off-white)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                  >
                    Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback('NOT_HELPFUL')}
                    style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'transparent', border: '1px solid var(--colour-steel)', color: 'var(--colour-off-white)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                  >
                    Not Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback('REPORTED_INCORRECT')}
                    style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'transparent', border: '1px solid var(--colour-caution)', color: 'var(--colour-caution)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                  >
                    Report Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
