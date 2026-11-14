// Service worker : tout le site est mis en cache à l'installation, pour que
// l'application marche hors ligne.
const CACHE = "worldwise-v24";
importScripts("data.js");

// Les photos des repères de panneaux (dossier photos/) ne sont pas
// préchargées : chacune est gardée en cache la première fois qu'elle est vue.
const FICHIERS = [
  "./", "style.css", "app.js", "data.js", "info.js", "decoupes.js", "world.js",
  "ecritures.js", "langues.js", "photos.js", "panneaux_notes.js",
  "vendor/d3.min.js", "vendor/topojson-client.min.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  ...PAYS.map((p) => `flags/${p.code}.svg`),
];

self.addEventListener("install", (e) => {
  // cache: "reload" : on prend les fichiers sur le serveur, jamais une vieille copie du navigateur.
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Drapeaux, icônes et photos ne changent jamais : servis depuis le cache. Le reste (page,
// code, données) vient du réseau d'abord, revérifié auprès du serveur, pour qu'une
// mise à jour se voie dès le premier chargement ; le cache ne sert que hors ligne
// ou si le réseau ne répond pas en 3 s.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const fixe = /\/(flags|icons|vendor|photos)\//.test(url.pathname);
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const enCache = await cache.match(e.request, { ignoreSearch: true });
      if (fixe && enCache) return enCache;
      const reseau = fetch(e.request, { cache: "no-cache" })
        .then((rep) => { if (rep.ok) cache.put(e.request, rep.clone()); return rep; });
      if (!enCache) return reseau;
      const delai = new Promise((ok) => setTimeout(() => ok(enCache), 3000));
      return Promise.race([reseau.catch(() => enCache), delai]);
    })
  );
});
