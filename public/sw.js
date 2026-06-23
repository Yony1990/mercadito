// public/sw.js
// Service Worker — corre en segundo plano, incluso con la app cerrada.
// Su única tarea acá: recibir el evento "push" y mostrar la notificación nativa.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'Mercadito', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || '🛒 Mercadito'
  const options = {
    body: data.body || 'Hay una actualización en tu lista',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    tag: 'mercadito-update', // evita apilar notificaciones repetidas
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Al hacer click en la notificación, abre/enfoca la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        return existing.navigate(targetUrl)
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
