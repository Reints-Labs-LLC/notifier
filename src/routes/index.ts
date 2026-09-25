// Next-dependent entry point -- import from 'notifier/routes', not the
// package root, so consumers that don't need Route Handlers (e.g. a
// schema.ts loaded outside Next's bundler) never resolve 'next/server'.
export { createSubscribeHandler } from './subscribe.js'
export type { SubscribeDeps } from './subscribe.js'
export { createUnsubscribeHandler } from './unsubscribe.js'
export type { UnsubscribeDeps } from './unsubscribe.js'
export { createTestHandler } from './test.js'
export type { TestDeps } from './test.js'
