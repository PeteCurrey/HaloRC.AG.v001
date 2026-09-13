'use server'

import { cookies } from 'next/headers'
import type { MarketCode } from '@halo-rc/types'
import { handleMarketSwitchBasket } from '@halo-rc/db'

export async function setMarketPreference(market: MarketCode) {
  const cookieStore = await cookies()
  cookieStore.set('halo_market', market, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
  })
}

export async function getMarketPreference(): Promise<MarketCode> {
  const cookieStore = await cookies()
  const marketCookie = cookieStore.get('halo_market')
  if (marketCookie?.value === 'US' || marketCookie?.value === 'UK') {
    return marketCookie.value as MarketCode
  }
  return 'UK'
}

/**
 * Handle market switching when customer has an active basket.
 * Invariant: Never mix UK/US items, never silently convert currency, never delete baskets silently.
 */
export async function handleMarketSwitchWithBasketAction(
  targetMarket: MarketCode,
  action: 'KEEP_CURRENT' | 'START_NEW'
) {
  const cookieStore = await cookies()
  const basketId = cookieStore.get('halo_basket_id')?.value

  if (basketId) {
    const result = await handleMarketSwitchBasket({
      basketId,
      targetMarket,
      action,
    })

    if (action === 'START_NEW' && result.switched) {
      cookieStore.set('halo_basket_id', result.basket.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env['NODE_ENV'] === 'production',
      })
    }
  }

  cookieStore.set('halo_market', targetMarket, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
  })
}
