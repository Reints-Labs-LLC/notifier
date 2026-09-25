#!/usr/bin/env node
// Run once per consuming site: `npx reints-notify-gen-vapid-keys` (or `node
// node_modules/reints-notify/scripts/gen-vapid-keys.mjs`). Paste the output
// into that site's own env vars — never share one keypair across sites.
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('# Add these to this site\'s env (Netlify + .env.local), then never regenerate them —')
console.log('# regenerating invalidates every existing subscriber on this site.')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
