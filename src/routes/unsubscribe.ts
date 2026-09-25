import { NextRequest, NextResponse } from 'next/server'

export type UnsubscribeDeps = {
  assertSameOrigin: () => Promise<void>
  getUserId: (req: NextRequest) => Promise<string | null>
  /** Remove the subscription row for (userId, channel: 'push', destinationKey: endpoint). */
  removeSubscription: (userId: string, endpoint: string) => Promise<void>
}

/**
 * Wire this into `app/api/push/unsubscribe/route.ts` as `export const POST = createUnsubscribeHandler({...})`.
 */
export function createUnsubscribeHandler(deps: UnsubscribeDeps) {
  return async function POST(req: NextRequest) {
    await deps.assertSameOrigin()

    const userId = await deps.getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { endpoint } = (await req.json()) as { endpoint?: string }
    if (!endpoint) {
      return NextResponse.json({ error: 'missing endpoint' }, { status: 400 })
    }

    await deps.removeSubscription(userId, endpoint)
    return NextResponse.json({ ok: true })
  }
}
