// Service worker : tout le site est mis en cache à l'installation, puis servi
// depuis le cache (l'application marche hors ligne). Chaque visite en ligne
// rafraîchit le cache en arrière-plan : une modification apparaît au chargement suivant.
const CACHE = "worldwise-v2";
importScripts("data.js");

const FICHIERS = [
  "./", "style.css", "app.js", "data.js", "info.js", "decoupes.js", "world.js",
  "vendor/d3.min.js", "vendor/topojson-client.min.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  ...PAYS.map((p) => `flags/${p.code}.svg`),
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const enCache = await cache.match(e.request, { ignoreSearch: true });
      const reseau = fetch(e.request)
        .then((rep) => { if (rep.ok) cache.put(e.request, rep.clone()); return rep; })
        .catch(() => enCache);
      return enCache || reseau;
    })
  );
});
