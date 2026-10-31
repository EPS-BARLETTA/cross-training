/* Cross Training v2 — mode hors-ligne (réseau d'abord, sinon cache).
 * Augmenter VERSION à chaque mise en ligne. */
const VERSION = "crosstraining-v2-2026-10-31i";
const PREFIX = "crosstraining-v2-";
const FILES = ["./", "index.html", "app.css", "app.js", "data.js", "lib/qrcode.js", "lib/jsQR.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "img/burpees.jpg", "img/crunch.jpg", "img/dips.jpg", "img/fentes.jpg", "img/jumping-jack.jpg", "img/mountain.jpg",
  "img/planche-touches-epaule.jpg", "img/pompe-diamant.jpg", "img/pompes.jpg", "img/pont-fessier.jpg", "img/rameur.jpg",
  "img/saut.jpg", "img/squat.jpg", "img/talons-fesses.jpg",
  "img/patineurs.jpg", "img/marche-ours.jpg", "img/pompes-spiderman.jpg", "img/pompes-piquees.jpg", "img/inchworms.jpg",
  "img/planche-dynamique.jpg", "img/fentes-laterales.jpg", "img/squats-sumo.jpg", "img/fire-hydrants.jpg", "img/mollets.jpg",
  "img/v-ups.jpg", "img/superman.jpg", "img/bicyclette.jpg", "img/planche-twist.jpg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: "reload" })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord. Si le réseau est lent, on n'utilise la copie locale que si elle existe :
// sans copie, on attend le réseau (jamais de page d'erreur parce que le wifi est lent).
async function fromCache(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  if (req.mode === "navigate") return caches.match(new URL("index.html", self.registration.scope).href);
  return undefined;
}

const OFFLINE_PAGE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<body style="background:#0b1023;color:#eef1f7;font-family:system-ui;text-align:center;padding:40px">' +
  '<h1>🏋️ Cross Training</h1><p>Pas de connexion internet pour le moment.</p>' +
  '<p><button onclick="location.reload()" style="font-size:1.1rem;padding:12px 20px;border-radius:12px">Réessayer</button></p></body>';

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL("./", self.location).pathname;
  if (!url.pathname.startsWith(scope)) return;

  event.respondWith((async () => {
    const network = fetch(req, { cache: "no-cache" }).then(async (res) => {
      if (res && res.ok && !res.redirected) {
        const cache = await caches.open(VERSION);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    });
    network.catch(() => {}); // évite une erreur non gérée si la copie locale répond d'abord
    const cached = await fromCache(req);
    try {
      if (!cached) return await network; // pas de copie : on attend le réseau
      const timer = new Promise((resolve) => setTimeout(() => resolve(cached), 4000));
      return await Promise.race([network, timer]);
    } catch (err) {
      if (cached) return cached;
      if (req.mode === "navigate") {
        return new Response(OFFLINE_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return Response.error();
    }
  })());
});
