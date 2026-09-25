// Deliberately Next-free: anything that imports 'next/server' (the route
// handler factories) lives under the separate './routes' entry point so
// consumers of just the schema/types/adapter (e.g. a schema.ts loaded by
// vitest or plain Node, outside Next's own bundler) never have to resolve
// 'next/server' at all.
export type { Channel, NotificationPayload, ChannelAdapter, StoredSubscription, SubscriptionStore } from './types.js'
export { notificationSubscriptions } from './schema.js'
export { createPushAdapter } from './push.js'
export type { VapidConfig, WebPushSubscriptionJSON } from './push.js'
export { createNotifier } from './notify.js'
export type { NotifyResult } from './notify.js'
