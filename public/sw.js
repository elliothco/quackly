// public/sw.js
// A “no-op” Service Worker that simply takes over scope
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
// (no fetch handler, so it won’t hijack any requests)
