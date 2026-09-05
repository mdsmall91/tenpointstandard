'use strict';

/* Offline shell. Stale-while-revalidate rather than cache-first: the app
   keeps working on a plane, but a deploy is picked up on the next load
   instead of needing the cache name bumped by hand. */

var CACHE = 'weight-v1';
var SHELL = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './styles/app.css', './js/core.js', './js/store.js', './js/chart.js', './js/ui.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req).then(function (hit) {
    var live = fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return hit; });
    return hit || live;
  }));
});
