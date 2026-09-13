// apps/web/src/app/api/ai/feedback/route.ts
// Server endpoint for capturing customer feedback on AI consultation answers.

import { NextResponse } from 'next/server'
import { logAIFeedback } from '@/lib/ai/audit'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { requestId, feedbackType, notes } = body as {
      requestId: string
      feedbackType: 'HELPFUL' | 'NOT_HELPFUL' | 'REPORTED_INCORRECT'
      notes?: string
    }

    if (!requestId || !feedbackType) {
      return NextResponse.json({ error: 'requestId and feedbackType are required' }, { status: 400 })
    }

    const user = await getSessionUser()

    const feedback = logAIFeedback({
      requestId,
      userId: user?.id ?? null,
      feedbackType,
      notes: notes ?? null,
    })

    return NextResponse.json({ success: true, feedbackId: feedback.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to record feedback' }, { status: 500 })
  }
}
