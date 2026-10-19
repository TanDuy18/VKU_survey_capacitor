/// Service Worker: Cache-First cho App Shell (precache) + Background Sync
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST); // HTML, CSS, JS, font, icon -> Cache-First

// Mọi điều hướng trả về index.html đã cache (khởi động offline dưới 1 giây)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Background Sync: khi có mạng trở lại, nhờ các tab/app đang mở chạy hàng đợi
self.addEventListener('sync', (event) => {
  if (event.tag === 'vku-sync') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((cs) => cs.forEach((c) => c.postMessage({ type: 'SYNC' })))
    );
  }
});
