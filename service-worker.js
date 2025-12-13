const CACHE_NAME = "dfl-site-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest"
  // Nota: CSS e JS existentes não foram forçados aqui para evitar quebras se nomes mudarem.
  // O SW vai cachear o que o usuário acessar organicamente (estratégia passiva).
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // Ignora métodos que não sejam GET (POST, PUT, DELETE passam direto pra rede)
  if (event.request.method !== "GET") return;

  // Ignora requisições para o Firestore/Google APIs (dados dinâmicos)
  const url = new URL(event.request.url);
  if (url.hostname.includes("firebase") || url.hostname.includes("google")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => {
      // Retorna do cache se existir, senão busca na rede
      return res || fetch(event.request);
    })
  );
});
