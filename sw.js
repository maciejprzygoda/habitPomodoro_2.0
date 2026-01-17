const CACHE_NAME = 'habit-pomodoro-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/router.js',
  './js/state.js',
  './js/store.js',
  './js/notifications.js',
  './js/views/habits.js',
  './js/views/pomodoro.js',
  './js/views/stats.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys
      .filter(k=>k!==CACHE_NAME)
      .map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if(req.method !== 'GET') return;

  // 🔑 KLUCZ: obsługa nawigacji SPA
  if(req.mode === 'navigate'){
    event.respondWith(
      caches.match('./index.html').then(cached => {
        return cached || fetch('./index.html');
      })
    );
    return;
  }

  // App shell: cache-first
  if(APP_SHELL.some(p => req.url.endsWith(p.replace('./','')))){
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c=>c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Everything else: network-first, fallback to cache
  event.respondWith(
    fetch(req).then(res=>{
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c=>c.put(req, copy));
      return res;
    }).catch(()=>caches.match(req))
  );
});

