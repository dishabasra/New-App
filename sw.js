// Offline support: cache the app shell, serve it cache-first, refresh in the background.
const CACHE = "talktown-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/scenes.js",
  "./js/match.js",
  "./js/speech.js",
  "./js/content.js",
  "./js/art.js",
  "./js/lang/es.js",
  "./js/lang/fr.js",
  "./img/welcome.webp",
  "./img/welcome-thumb.webp",
  "./img/cafe.webp",
  "./img/cafe-thumb.webp",
  "./img/market.webp",
  "./img/market-thumb.webp",
  "./img/taxi.webp",
  "./img/taxi-thumb.webp",
  "./img/restaurant.webp",
  "./img/restaurant-thumb.webp",
  "./img/hotel.webp",
  "./img/hotel-thumb.webp",
  "./img/doctor.webp",
  "./img/doctor-thumb.webp",
  "./img/airport.webp",
  "./img/airport-thumb.webp",
  "./img/office.webp",
  "./img/office-thumb.webp",
  "./img/party.webp",
  "./img/party-thumb.webp",
  "./img/city-en.webp",
  "./img/city-es.webp",
  "./img/city-fr.webp",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
