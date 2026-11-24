/* Network-first for app-packaged localhost resources. Updated APK assets replace old SW cache. */
const CACHE = 'wordworld-v7-abilities';
const ASSETS = ['./', './index.html', './style.css', './data/vocabulary.js', './data/exam1.js', './js/content.js', './data/abilities.js', './js/abilities.js', './js/app.js', './js/srs-fallback.js', './js/fsrs-engine.js', './assets/icon.svg', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
