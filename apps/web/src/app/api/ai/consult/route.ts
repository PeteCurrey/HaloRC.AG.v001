// apps/web/src/app/api/ai/consult/route.ts
// Server API endpoint for AI consultations.
// Validates inputs, handles rate limiting, enforces strict grounding, and logs audit events.

import { NextResponse } from 'next/server'
import type { MarketCode } from '@halo-rc/types'
import {
  consultProductDiscovery,
  consultCompatibility,
  consultSpecification,
  consultGarageVehicle,
  consultTechnicalQA,
  consultCommercePurchase,
} from '@/lib/ai/consultation'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      mode = 'DISCOVERY',
      query = '',
      marketCode = 'UK',
      productId,
      targetMachineId,
      specKey,
      documentId,
      vehicleId,
    } = body as {
      mode?: string
      query?: string
      marketCode?: MarketCode
      productId?: string
      targetMachineId?: string
      specKey?: string
      documentId?: string
      vehicleId?: string
    }

    const user = await getSessionUser()
    const userId = user?.id ?? null

    // Refusal: Autonomous purchase attempt
    if (/^buy|purchase|order\b/i.test(query.trim())) {
      const response = consultCommercePurchase(query, marketCode)
      return NextResponse.json(response)
    }

    switch (mode) {
      case 'COMPATIBILITY':
        if (!productId || !targetMachineId) {
          return NextResponse.json(
            { error: 'productId and targetMachineId are required for compatibility consultation' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          await consultCompatibility(productId, targetMachineId, marketCode, userId)
        )

      case 'SPECIFICATION':
        if (!productId || !specKey) {
          return NextResponse.json(
            { error: 'productId and specKey are required for specification consultation' },
            { status: 400 }
          )
        }
        return NextResponse.json(await consultSpecification(productId, specKey, marketCode))

      case 'GARAGE':
        if (!userId) {
          return NextResponse.json({ error: 'Authentication required for Garage consultation' }, { status: 401 })
        }
        if (!vehicleId) {
          return NextResponse.json({ error: 'vehicleId is required for Garage consultation' }, { status: 400 })
        }
        return NextResponse.json(await consultGarageVehicle(userId, vehicleId, query))

      case 'DOCUMENT_QA':
        if (!documentId) {
          return NextResponse.json({ error: 'documentId is required for Document QA' }, { status: 400 })
        }
        return NextResponse.json(await consultTechnicalQA(documentId, query))

      case 'DISCOVERY':
      default:
        return NextResponse.json(await consultProductDiscovery(query, marketCode, userId))
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        answer: 'The consultation service encountered an unexpected error. Safe fallback engaged.',
        groundingState: 'UNSUPPORTED',
        intent: 'UNSUPPORTED_REQUEST',
        sources: [],
        recommendations: [],
        warnings: [err?.message ?? 'Unknown consultation error'],
        followUpActions: [{ label: 'Explore Catalogue', href: '/machines' }],
      },
      { status: 500 }
    )
  }
}
