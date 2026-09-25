import { NextRequest, NextResponse } from 'next/server'

export type TestDeps = {
  assertSameOrigin: () => Promise<void>
  getUserId: (req: NextRequest) => Promise<string | null>
  /** Typically `() => notify(userId, { title: '...', body: '...' })` using this package's notifier. */
  sendTest: (userId: string) => Promise<void>
}

/**
 * Wire this into `app/api/push/test/route.ts` as `export const POST = createTestHandler({...})`.
 * Call it right after a successful subscribe so the guest/user gets immediate confirmation
 * that push actually works on their device.
 */
export function createTestHandler(deps: TestDeps) {
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

    try {
      await deps.sendTest(userId)
    } catch {
      return NextResponse.json({ error: 'failed to send test notification' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  }
}
