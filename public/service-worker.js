self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("noralie-cache").then((cache) => {
      return cache.addAll(["/", "/index.html", "/manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => {
      return resp || fetch(e.request);
    })
  );
});
