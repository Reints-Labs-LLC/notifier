// Copy this file to your site's public/sw.js verbatim (or extend it —
// it's plain JS, not part of the package build). Registered by
// usePushSubscription() at the URL you pass as serviceWorkerUrl.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Notification', body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body,
      tag: data.tag,
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(clients.openWindow(url))
})
