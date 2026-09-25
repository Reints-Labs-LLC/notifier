# notifier

Shared Web Push notification package for Reints Labs sites. No third-party
service, no cost, no shared infrastructure between sites — each consuming
site owns its own VAPID keypair and its own `notification_subscriptions`
table. This package just provides the adapter, the dispatcher, three route
handler factories, and a client hook so that logic isn't rewritten per site.

Designed so email/SMS can be added later as new adapters without changing
the schema or the dispatcher — see `src/types.ts` (`Channel`, `ChannelAdapter`)
and `src/schema.ts` (`channel` + `destinationKey` columns exist today even
though only `push` has an adapter).

The package root (types, the push adapter, the dispatcher) is free of both
Next and Drizzle, so it works from any consumer regardless of framework or
storage choice. Two optional pieces live under their own entry points instead
of the root, so a consumer that doesn't need them never has to resolve their
dependency:

- The route handler factories (`createSubscribeHandler`, `createUnsubscribeHandler`,
  `createTestHandler`) import `next/server` — they live under `notifier/routes`.
  A non-Next consumer (e.g. Netlify Functions) writes its own thin handlers
  against the root's `createPushAdapter`/`createNotifier` instead.
- The example Drizzle/Postgres table (`notificationSubscriptions`) imports
  `drizzle-orm/pg-core` — it lives under `notifier/schema`. A consumer with no
  database, or one not using Drizzle/Postgres, implements `SubscriptionStore`
  (see `src/types.ts`) against whatever storage it already has (e.g. Netlify
  Blobs) instead of importing this schema at all.

## Install

From a consuming site:

```bash
npm install github:Reints-Labs-LLC/notifier
```

Only `web-push` is a hard dependency. If the consuming site uses the
`notifier/routes` handlers it needs its own `next` (>=14) and `react` (>=18);
if it uses the `notifier/schema` table it needs its own `drizzle-orm`. Neither
is declared as a peerDependency here on purpose, since npm's peer resolution
gets confused by a prerelease version (e.g. a `1.0.0-beta.x` drizzle-orm) and
by the same package appearing in both `devDependencies` (needed to build this
package) and `peerDependencies`. Module resolution finds the consumer's own
copies at runtime regardless — and a consumer that imports neither
`notifier/routes` nor `notifier/schema` needs neither installed at all.

## One-time setup per site

1. Generate a VAPID keypair for **this site** (never reuse one across sites):
   ```bash
   node node_modules/notifier/scripts/gen-vapid-keys.mjs
   ```
   Add the two printed values to this site's env (Netlify + `.env.local`).

2. If storing subscriptions in Postgres via Drizzle, add
   `notificationSubscriptions` (from `notifier/schema`) to this site's own
   schema/migrations. Each site keeps its own subscriber data — there is no
   shared database. A site with no database (or a different storage choice)
   skips this step and implements `SubscriptionStore` (see step 4) against
   whatever it already has instead.

3. Wire the three route handlers, e.g. under `src/app/api/push/`:

   ```ts
   // src/app/api/push/subscribe/route.ts
   import { createSubscribeHandler } from 'notifier/routes'
   import { db } from '@/db'
   import { notificationSubscriptions } from 'notifier/schema'
   import { getGuestIdFromSession } from '@/lib/guestToken' // this site's own auth
   import { assertSameOrigin } from '@/lib/security'        // this site's own check

   export const POST = createSubscribeHandler({
     assertSameOrigin,
     getUserId: async () => getGuestIdFromSession(),
     saveSubscription: async (userId, subscription) => {
       await db.insert(notificationSubscriptions)
         .values({
           userId,
           channel: 'push',
           destinationKey: subscription.endpoint,
           destination: subscription,
         })
         .onConflictDoUpdate({
           target: [notificationSubscriptions.channel, notificationSubscriptions.destinationKey],
           set: { destination: subscription, lastSeenAt: new Date() },
         })
     },
   })
   ```

   Repeat the pattern for `unsubscribe/route.ts` (`createUnsubscribeHandler`)
   and `test/route.ts` (`createTestHandler`, `sendTest` should just call
   `notify(userId, { title: '...', body: '...' })`).

4. Build the notifier once per site (e.g. `src/lib/notify.ts`) and call it
   from wherever this site wants to trigger a push:

   ```ts
   import { createNotifier, createPushAdapter } from 'notifier'
   import { db } from '@/db'
   import { notificationSubscriptions } from 'notifier/schema'
   import { eq } from 'drizzle-orm'

   const pushAdapter = createPushAdapter({
     subject: 'mailto:you@example.com',
     publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
     privateKey: process.env.VAPID_PRIVATE_KEY!,
   })

   export const notify = createNotifier({
     adapters: { push: pushAdapter },
     store: {
       getSubscriptions: async (userId) =>
         db.select().from(notificationSubscriptions).where(eq(notificationSubscriptions.userId, userId)),
     },
   })
   ```

5. Copy `client/service-worker.js` (from this package) to this site's own
   `public/sw.js`.

6. Drop `usePushSubscription` into an opt-in UI:

   ```tsx
   import { usePushSubscription } from 'notifier/client/usePushSubscription'

   const { state, subscribe } = usePushSubscription({
     vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
   })
   ```

## Adding email or SMS later

Write a new `ChannelAdapter` (see `src/push.ts` for the shape), pass it into
`createNotifier({ adapters: { push, email } })`, and start inserting rows
with `channel: 'email'`. Nothing else changes.
