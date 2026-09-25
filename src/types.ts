export type Channel = 'push' | 'email' | 'sms'

export type NotificationPayload = {
  title: string
  body: string
  /** Where a click on the notification should navigate. */
  url?: string
  /** OS-level dedupe/replace key — a second push with the same tag replaces the first. */
  tag?: string
  data?: Record<string, unknown>
}

export interface ChannelAdapter {
  send(destination: unknown, payload: NotificationPayload): Promise<void>
}

export type StoredSubscription = {
  channel: Channel
  destination: unknown
}

export interface SubscriptionStore {
  getSubscriptions(userId: string): Promise<StoredSubscription[]>
}
