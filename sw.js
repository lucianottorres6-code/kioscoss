// Kiosco Fácil - service worker: la app abre sin internet.
// Con internet siempre trae la versión nueva; sin internet usa la guardada.
const C = 'kf-v1';
const A = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(A)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  // Solo archivos propios de la app. Google (login y Drive) no se toca.
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    try {
      const n = await Promise.race([
        fetch(r),
        new Promise((_, no) => setTimeout(no, 5000))
      ]);
      if (n && n.ok) c.put(r, n.clone());
      return n;
    } catch (err) {
      const m = (await c.match(r, { ignoreSearch: true })) ||
                (r.mode === 'navigate' ? await c.match('index.html') : null);
      return m || fetch(r);
    }
  })());
});
