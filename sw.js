// Service Worker: speichert alle App-Dateien, damit die App auch ohne Internet startet.
// Er lädt nur Dateien dieser App, nie fremde Adressen.
//
// WICHTIG: Bei jeder Änderung an der App die VERSION erhöhen.
// Nur dann lädt das iPhone die neuen Dateien.

const VERSION = '1';
const CACHE = `tagesplaner-${VERSION}`;

const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/storage.js',
  './js/dates.js',
  './js/ui.js',
  './js/today.js',
  './js/week.js',
  './js/month.js',
  './js/notes.js',
  './js/backup.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' holt frische Dateien statt alter Kopien aus dem Browser-Zwischenspeicher
      .then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('tagesplaner-') && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => (request.mode === 'navigate'
        ? caches.match('./index.html')
        : Response.error()));
    }),
  );
});
