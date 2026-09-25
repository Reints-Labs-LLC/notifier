import type { Channel, ChannelAdapter, NotificationPayload, SubscriptionStore } from './types.js'

export type NotifyResult = {
  channel: Channel
  ok: boolean
  error?: unknown
}

export function createNotifier(deps: {
  store: SubscriptionStore
  adapters: Partial<Record<Channel, ChannelAdapter>>
}) {
  return async function notify(userId: string, payload: NotificationPayload): Promise<NotifyResult[]> {
    const subscriptions = await deps.store.getSubscriptions(userId)

    const attempts = subscriptions
      .filter((s) => deps.adapters[s.channel])
      .map(async (s): Promise<NotifyResult> => {
        try {
          await deps.adapters[s.channel]!.send(s.destination, payload)
          return { channel: s.channel, ok: true }
        } catch (error) {
          return { channel: s.channel, ok: false, error }
        }
      })

    return Promise.all(attempts)
  }
}
