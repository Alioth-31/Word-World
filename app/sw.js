/* Network-first for app-packaged localhost resources. Updated APK assets replace old SW cache. */
const CACHE = 'wordworld-0.6.0-beta.1';
const ASSETS = ['./', './index.html', './style.css', './styles/word-lesson.css', './styles/exam-ui.css', './styles/presentation.css', './styles/study-analysis.css', './styles/football.css', './data/vocabulary.js', './data/exam1.js', './js/content.js', './data/abilities.js', './js/abilities.js', './data/exam-senses.js', './js/learning-policy.js', './js/adaptive-learning.js', './js/word-lesson.js', './js/word-lesson-ui.js', './js/word-lesson-bridge.js', './js/exam-priority.js', './js/study-analysis.js', './js/study-analysis-ui.js', './js/football-season.js', './js/football-ui.js', './js/app.js', './js/srs-fallback.js', './js/fsrs-engine.js', './assets/icon.svg', './manifest.webmanifest'];
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
