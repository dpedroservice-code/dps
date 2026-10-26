'use strict';

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `dpedro-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dpedro-dynamic-${CACHE_VERSION}`;

const PRECACHE = [
    './', './index.html', './loja.html', './erp.html', './contactos.html',
    './admin.html', './offline.html', './manifest.webmanifest',
    './assets/css/style.css',
    './assets/js/products.js', './assets/js/cart.js', './assets/js/admin.js', './assets/js/pwa.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(STATIC_CACHE).then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('dpedro-') && !k.endsWith(CACHE_VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
    const { request } = e;
    const url = new URL(request.url);
    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:') return;
    if (request.mode === 'navigate') {
        e.respondWith(fetch(request).then(res => { const clone = res.clone(); caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone)); return res; }).catch(() => caches.match(request).then(cached => cached || caches.match('./offline.html'))));
        return;
    }
    e.respondWith(caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => { if (res && res.status === 200) caches.open(DYNAMIC_CACHE).then(c => c.put(request, res.clone())); return res; }).catch(() => cached);
        return cached || fetchPromise;
    }));
});