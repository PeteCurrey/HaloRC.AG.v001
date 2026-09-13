// apps/web/src/app/(storefront)/cart/page.tsx
// Authoritative shopping basket page with live market pricing and stale-price detection.

import Link from 'next/link'
import {
  getActiveBasket,
  updateCartQuantityAction,
  removeFromCartAction,
  clearCartAction,
  initiateCheckoutAction,
} from '@/actions/commerce'
import { detectBasketPriceChanges } from '@halo-rc/db'

interface CartPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const params = await searchParams
  const errorMsg = typeof params['error'] === 'string' ? params['error'] : null

  const basket = await getActiveBasket()
  const priceCheck = await detectBasketPriceChanges(basket.id)

  const isUk = basket.marketCode === 'UK'
  const currencySymbol = isUk ? '£' : '$'
  const taxNote = isUk ? 'Inclusive of 20% VAT' : 'Sales tax calculated at checkout'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
            Commercial Transaction
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
          Your Basket ({basket.items.length} {basket.items.length === 1 ? 'item' : 'items'})
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-6)' }}>
          Market: <strong style={{ color: 'var(--colour-off-white)' }}>{basket.marketCode}</strong> ({basket.currency}). Strictly isolated commercial pricing.
        </p>

        {errorMsg && (
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: '#ff6666', margin: 0 }}>⚠️ {errorMsg}</p>
          </div>
        )}

        {priceCheck.hasChanges && (
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(255, 180, 0, 0.1)', border: '1px solid var(--colour-caution)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-caution)', margin: 0 }}>
              ⚠️ Catalogue Price Notice: One or more item prices have changed since being added to your basket. Your totals have been refreshed authoritatively.
            </p>
          </div>
        )}

        {basket.items.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
              Your basket is currently empty.
            </p>
            <Link
              href="/machines"
              style={{
                display: 'inline-block',
                padding: 'var(--space-3) var(--space-6)',
                backgroundColor: 'var(--colour-halo)',
                color: 'var(--colour-void)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Explore The Machines →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-8)' }}>
            {/* Basket Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {basket.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 'var(--space-5)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                      SKU: {item.sku}
                    </span>
                    <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', margin: 'var(--space-1) 0' }}>
                      {item.productName}
                    </h2>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                      Unit: {currencySymbol}{(item.unitPriceMinorUnits / 100).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    {/* Quantity Selector */}
                    <form action={updateCartQuantityAction} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input
                        type="number"
                        name="quantity"
                        defaultValue={item.quantity}
                        min="1"
                        max="20"
                        style={{
                          width: '50px',
                          padding: 'var(--space-1) var(--space-2)',
                          backgroundColor: 'var(--colour-graphite)',
                          border: '1px solid var(--colour-mist)',
                          color: 'var(--colour-white)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-xs)',
                          textAlign: 'center',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--colour-steel)',
                          color: 'var(--colour-ash)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.6875rem',
                          cursor: 'pointer',
                        }}
                      >
                        Update
                      </button>
                    </form>

                    {/* Line Total */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', minWidth: '80px', textAlign: 'right' }}>
                      {currencySymbol}{((item.unitPriceMinorUnits * item.quantity) / 100).toFixed(2)}
                    </span>

                    {/* Remove Item */}
                    <form action={removeFromCartAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--colour-smoke)',
                          cursor: 'pointer',
                          fontSize: 'var(--text-xs)',
                        }}
                        aria-label={`Remove ${item.productName}`}
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)' }}>
                <form action={clearCartAction}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--colour-smoke)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear Entire Basket
                  </button>
                </form>
                <Link href="/machines" style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', textDecoration: 'none' }}>
                  ← Continue Exploring
                </Link>
              </div>
            </div>

            {/* Order Summary Card */}
            <div
              style={{
                padding: 'var(--space-6)',
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                height: 'fit-content',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--colour-smoke)', letterSpacing: '0.1em', marginBottom: 'var(--space-4)' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-2)' }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-off-white)' }}>
                  {currencySymbol}{(basket.subtotalMinorUnits / 100).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
                <span>Shipping</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-verified)' }}>
                  Free Insured Dispatch
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                  Total
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--colour-halo)' }}>
                  {currencySymbol}{(basket.totalMinorUnits / 100).toFixed(2)}
                </span>
              </div>

              <p style={{ fontSize: '0.6875rem', color: 'var(--colour-smoke)', marginBottom: 'var(--space-6)' }}>
                {taxNote}
              </p>

              <form action={initiateCheckoutAction}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--colour-halo)',
                    color: 'var(--colour-void)',
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Proceed to Checkout →
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
