'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import s from './GlobalNav.module.css'
import { setMarketPreference, handleMarketSwitchWithBasketAction } from '@/actions/market'
import type { MarketCode } from '@halo-rc/types'

export function MarketSelector() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [market, setMarket] = useState<MarketCode>('UK')
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<MarketCode | null>(null)
  const [hasBasket, setHasBasket] = useState(false)

  useEffect(() => {
    // Read cookies on mount if present
    const marketMatch = document.cookie.match(/halo_market=(UK|US)/)
    if (marketMatch && (marketMatch[1] === 'UK' || marketMatch[1] === 'US')) {
      setMarket(marketMatch[1])
    }
    const basketMatch = document.cookie.match(/halo_basket_id=([^;]+)/)
    if (basketMatch && basketMatch[1]) {
      setHasBasket(true)
    }
  }, [])

  const handleMarketClick = (nextMarket: MarketCode) => {
    if (nextMarket === market) return

    // If customer has an active basket, present explicit conflict resolution
    if (hasBasket) {
      setPendingSwitchTarget(nextMarket)
      return
    }

    executeSwitch(nextMarket)
  }

  const executeSwitch = (nextMarket: MarketCode) => {
    setMarket(nextMarket)
    setPendingSwitchTarget(null)
    startTransition(async () => {
      await setMarketPreference(nextMarket)
      router.refresh()
    })
  }

  const handleConflictResolve = (action: 'KEEP_CURRENT' | 'START_NEW') => {
    if (!pendingSwitchTarget) return
    const target = pendingSwitchTarget
    setPendingSwitchTarget(null)
    setMarket(target)

    startTransition(async () => {
      await handleMarketSwitchWithBasketAction(target, action)
      router.refresh()
    })
  }

  return (
    <>
      <div
        className={s.marketSelector}
        role="group"
        aria-label="Select market"
        style={{ opacity: isPending ? 0.7 : 1 }}
      >
        <button
          type="button"
          className={`${s.marketButton} ${s.marketButtonUk}`}
          aria-pressed={market === 'UK'}
          onClick={() => handleMarketClick('UK')}
          title="United Kingdom — GBP £ (VAT inc.)"
        >
          <span className={s.marketFlagBg} aria-hidden="true">
            {/* UK Flag (Union Jack) */}
            <svg viewBox="0 0 60 30" width="100%" height="100%" preserveAspectRatio="none">
              <clipPath id="uk-clip">
                <rect width="60" height="30" />
              </clipPath>
              <g clipPath="url(#uk-clip)">
                <rect width="60" height="30" fill="#012169" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                <path d="M0,0 L60,30" stroke="#C8102E" strokeWidth="2" />
                <path d="M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
                <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
              </g>
            </svg>
          </span>
          <span className={s.marketButtonText}>UK</span>
        </button>
        <div className={s.marketDivider} aria-hidden="true" />
        <button
          type="button"
          className={`${s.marketButton} ${s.marketButtonUs}`}
          aria-pressed={market === 'US'}
          onClick={() => handleMarketClick('US')}
          title="United States — USD $ (Excl. tax)"
        >
          <span className={s.marketFlagBg} aria-hidden="true">
            {/* USA Flag (Stars and Stripes simplified for compact icon badge) */}
            <svg viewBox="0 0 60 30" width="100%" height="100%" preserveAspectRatio="none">
              <rect width="60" height="30" fill="#B22234" />
              {/* 7 white stripes */}
              <rect y="2.3" width="60" height="2.3" fill="#fff" />
              <rect y="6.9" width="60" height="2.3" fill="#fff" />
              <rect y="11.5" width="60" height="2.3" fill="#fff" />
              <rect y="16.1" width="60" height="2.3" fill="#fff" />
              <rect y="20.7" width="60" height="2.3" fill="#fff" />
              <rect y="25.3" width="60" height="2.3" fill="#fff" />
              {/* Canton */}
              <rect width="25" height="16.1" fill="#3C3B6E" />
              {/* Stars pattern grid */}
              <circle cx="5" cy="4" r="1.1" fill="#fff" />
              <circle cx="12.5" cy="4" r="1.1" fill="#fff" />
              <circle cx="20" cy="4" r="1.1" fill="#fff" />
              <circle cx="8.7" cy="8" r="1.1" fill="#fff" />
              <circle cx="16.2" cy="8" r="1.1" fill="#fff" />
              <circle cx="5" cy="12" r="1.1" fill="#fff" />
              <circle cx="12.5" cy="12" r="1.1" fill="#fff" />
              <circle cx="20" cy="12" r="1.1" fill="#fff" />
            </svg>
          </span>
          <span className={s.marketButtonText}>USA</span>
        </button>
      </div>

      {pendingSwitchTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="market-switch-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#0c0e12',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              color: '#f3f4f6',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ color: '#00f0ff', fontSize: '1.25rem' }}>🌐</span>
              <h3
                id="market-switch-title"
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Switch Commercial Market
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              You currently have an active basket in the <strong>{market}</strong> market (
              {market === 'UK' ? 'GBP £ inc. VAT' : 'USD $ excl. tax'}). Cross-market basket mixing is prohibited.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleConflictResolve('START_NEW')}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#00f0ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ✓ Start New {pendingSwitchTarget} Basket
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85, marginTop: '2px' }}>
                  Preserves your existing {market} items for later retrieval
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConflictResolve('KEEP_CURRENT')}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#f3f4f6',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Keep Current {market} Basket
                <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af', marginTop: '2px' }}>
                  Browse {pendingSwitchTarget} storefront while retaining {market} cart
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPendingSwitchTarget(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
