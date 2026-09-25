import { pgTable, serial, text, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'

/**
 * One row per subscribed destination (a device's push endpoint, an email
 * address, a phone number, ...). `channel` + `destinationKey` are separated
 * from day one so a second channel (email/sms) is a new adapter and new
 * rows here, not a new table — `destinationKey` is a plain string used only
 * for de-duplication (the push endpoint URL, the email address, the E.164
 * phone number); `destination` is the full payload the matching adapter
 * needs to actually send.
 *
 * Copy this table into your own site's schema/migrations — each site owns
 * its own subscriber data, there is no shared database.
 */
export const notificationSubscriptions = pgTable('notification_subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  channel: text('channel').notNull(),
  destinationKey: text('destination_key').notNull(),
  destination: jsonb('destination').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
}, (t) => ({
  // Multiple devices/destinations per user are fine; the same device
  // subscribing twice updates in place instead of duplicating.
  uniqueDestination: unique().on(t.channel, t.destinationKey),
}))
