self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Mi Centro', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const url = e.notification.data?.url ?? '/'
      const existing = cs.find(c => c.url.includes(url) && 'focus' in c)
      return existing ? existing.focus() : clients.openWindow(url)
    })
  )
})
