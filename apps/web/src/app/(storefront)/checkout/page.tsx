// apps/web/src/app/(storefront)/checkout/page.tsx
// Checkout initiation page. Requires authentication before Stripe redirection.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getActiveBasket, initiateCheckoutAction } from '@/actions/commerce'

export default async function CheckoutPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/auth/sign-in?next=/checkout')
  }

  const basket = await getActiveBasket()
  if (basket.items.length === 0) {
    redirect('/cart?error=' + encodeURIComponent('Basket is empty'))
  }

  const isUk = basket.marketCode === 'UK'
  const currencySymbol = isUk ? '£' : '$'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
            Authoritative Checkout
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-4)' }}>
          Review Your Order
        </h1>

        <div
          style={{
            padding: 'var(--space-6)',
            backgroundColor: 'var(--colour-carbon)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Authenticated Customer
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-off-white)', marginBottom: 'var(--space-5)' }}>
            {user.email}
          </p>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Items in Snapshot
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-6) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {basket.items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--colour-ash)',
                }}
              >
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-off-white)' }}>
                  {currencySymbol}{((item.unitPriceMinorUnits * item.quantity) / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-6)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
              Order Total ({basket.currency})
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-halo)' }}>
              {currencySymbol}{(basket.totalMinorUnits / 100).toFixed(2)}
            </span>
          </div>

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
              Transfer to Stripe Secure Checkout →
            </button>
          </form>
        </div>

        <Link href="/cart" style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', textDecoration: 'none' }}>
          ← Back to Basket
        </Link>
      </div>
    </div>
  )
}
