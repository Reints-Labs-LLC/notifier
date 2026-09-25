import { NextRequest, NextResponse } from 'next/server'
import type { WebPushSubscriptionJSON } from '../push.js'

export type SubscribeDeps = {
  /** Call your own same-origin check here (e.g. assertSameOrigin() from src/lib/security.ts). */
  assertSameOrigin: () => Promise<void>
  /** Resolve the caller's own user/guest id from whatever auth this site uses. */
  getUserId: (req: NextRequest) => Promise<string | null>
  /** Upsert the subscription — key it on (channel: 'push', destinationKey: body.endpoint). */
  saveSubscription: (userId: string, subscription: WebPushSubscriptionJSON) => Promise<void>
}

/**
 * Wire this into `app/api/push/subscribe/route.ts` as `export const POST = createSubscribeHandler({...})`.
 */
export function createSubscribeHandler(deps: SubscribeDeps) {
  return async function POST(req: NextRequest) {
    try {
      await deps.assertSameOrigin()
    } catch {
      return NextResponse.json({ error: 'invalid origin' }, { status: 403 })
    }

    const userId = await deps.getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const subscription = (await req.json()) as WebPushSubscriptionJSON
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'invalid subscription' }, { status: 400 })
    }

    await deps.saveSubscription(userId, subscription)
    return NextResponse.json({ ok: true })
  }
}
