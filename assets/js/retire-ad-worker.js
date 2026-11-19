/* Update only the former Free Tools Online advertising worker.
   Other applications on this GitHub Pages origin have separate workers. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  var ownPath = '/free-tools-online/sw.js';
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach(function (registration) {
      var worker = registration.active || registration.waiting || registration.installing;
      if (!worker) return;
      var url;
      try { url = new URL(worker.scriptURL); } catch (_) { return; }
      if (url.origin !== location.origin || url.pathname !== ownPath) return;
      // The replacement activates immediately and unregisters itself. If an
      // update is unavailable, remove the obsolete registration directly.
      registration.update().catch(function () { return registration.unregister(); });
    });
  }).catch(function () { /* Restricted browser storage must not break a tool. */ });
}());
