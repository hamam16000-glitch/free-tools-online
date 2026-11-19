/* Retire the previous advertising worker at this exact URL.
   No fetch, push, notification or remote import handlers are installed. */
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.registration.unregister());
});
