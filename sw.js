/* خدمة بسيطة: الشبكة أولًا، ولو مفيش نت يرجّع آخر نسخة محفوظة من الصفحة، ولو الصفحة عمرها ما اتحمّلت يعرض offline.html */
const CACHE = 'hakim-pages-v2';
const IMG_CACHE = 'hakim-img-v1', IMG_MAX = 220;   /* صور من نفس الدومين (أو CDN بنفس الدومين) كاش أولًا + تنظيف تلقائي */
const OFFLINE_URL = 'offline.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(OFFLINE_URL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.destination === 'image') {   /* صور: من الكاش فورًا، وتتحدّث في الخلفية (stale-while-revalidate) */
    e.respondWith(caches.open(IMG_CACHE).then(async ca => {
      const hit = await ca.match(r);
      const net = fetch(r).then(res => { if (res.ok) { ca.put(r, res.clone()); ca.keys().then(ks => { if (ks.length > IMG_MAX) ks.slice(0, ks.length - IMG_MAX).forEach(k => ca.delete(k)); }); } return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res.ok && r.mode === 'navigate') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match(OFFLINE_URL) : undefined)).then(m => m || new Response('', { status: 504, statusText: 'offline' }))));
});
