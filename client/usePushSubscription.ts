'use client'

import { useCallback, useEffect, useState } from 'react'

export type PushSubscriptionState = 'unsupported' | 'unsubscribed' | 'subscribed' | 'pending' | 'denied'

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type Options = {
  vapidPublicKey: string
  /** Defaults to '/sw.js' — copy client/service-worker.js from this package there. */
  serviceWorkerUrl?: string
  /** Defaults to '/api/push'. */
  apiBase?: string
}

/**
 * Drop this into an opt-in button. It registers the service worker, asks for
 * permission, subscribes with PushManager, and POSTs the subscription to
 * this site's own `/api/push/subscribe` route (wired with createSubscribeHandler).
 */
export function usePushSubscription({ vapidPublicKey, serviceWorkerUrl = '/sw.js', apiBase = '/api/push' }: Options) {
  const [state, setState] = useState<PushSubscriptionState>('pending')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription()
      setState(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  const subscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setState('denied')
      return
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })

    await fetch(`${apiBase}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    })
    await fetch(`${apiBase}/test`, { method: 'POST' })

    setState('subscribed')
  }, [apiBase, serviceWorkerUrl, vapidPublicKey])

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) {
      setState('unsubscribed')
      return
    }

    await fetch(`${apiBase}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
    await subscription.unsubscribe()
    setState('unsubscribed')
  }, [apiBase])

  return { state, subscribe, unsubscribe }
}
