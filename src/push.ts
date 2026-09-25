import webpush from 'web-push'
import type { ChannelAdapter, NotificationPayload } from './types.js'

export type VapidConfig = {
  /** mailto: or https: URL identifying the sender, required by the push spec. */
  subject: string
  publicKey: string
  privateKey: string
}

export type WebPushSubscriptionJSON = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime?: number | null
}

/**
 * The only real per-site setup: generate a VAPID keypair once
 * (`npm run gen-vapid-keys`) and pass it in here. Everything else is
 * standard Web Push — no third-party account, no cost, no rate limit.
 */
export function createPushAdapter(vapid: VapidConfig): ChannelAdapter {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

  return {
    async send(destination, payload: NotificationPayload) {
      await webpush.sendNotification(
        destination as WebPushSubscriptionJSON,
        JSON.stringify(payload),
      )
    },
  }
}
