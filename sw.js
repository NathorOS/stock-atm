/* Service worker: la app abre al instante y los datos siempre se piden al servidor. */
const VERSION = 'atm-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'config.js', 'icon-192.png', 'icon-512.png', 'favicon-32.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/(^|\.)script\.google\.com$|googleusercontent\.com$/.test(url.hostname)) return;   // datos: siempre en vivo
  if (url.origin === location.origin) {
    // propios: primero la red (así llegan las actualizaciones), si no hay internet, la copia guardada
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then((m) => m || caches.match('index.html'))));
  } else {
    // librerías externas (Bootstrap, gráficos, PDF, tipografía): copia guardada y se refresca por detrás
    e.respondWith(caches.match(req).then((m) => {
      const red = fetch(req).then((r) => { if (r && (r.status === 200 || r.type === 'opaque')) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return r; }).catch(() => m);
      return m || red;
    }));
  }
});
