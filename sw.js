const CACHE = "photomap-v0.7";

const FILES = [
  "./",
  "./index.html",
  "./Style/index.css",
  "./Script/index.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./icons/Search.png",
  "./icons/AddPhoto2.png",
  "./icons/Accaunt.png",
  "./icons/icon-500x500.png",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});