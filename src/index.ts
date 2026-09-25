// Deliberately Next-free and Drizzle-free: anything that imports 'next/server'
// (the route handler factories) lives under the separate './routes' entry
// point, and the optional Drizzle table shape lives under './schema', so a
// consumer with no database at all (e.g. one storing subscriptions in
// something other than Postgres/Drizzle) never has to resolve 'drizzle-orm',
// and a consumer outside Next's own bundler (e.g. a file loaded by vitest or
// plain Node) never has to resolve 'next/server'.
export type { Channel, NotificationPayload, ChannelAdapter, StoredSubscription, SubscriptionStore } from './types.js'
export { createPushAdapter } from './push.js'
export type { VapidConfig, WebPushSubscriptionJSON } from './push.js'
export { createNotifier } from './notify.js'
export type { NotifyResult } from './notify.js'
