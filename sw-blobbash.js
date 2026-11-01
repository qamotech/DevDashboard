// Blob Bash Royale service worker — ONLY handles Blob Bash assets.
// Lives at dashboard root scope, so every other page/request passes straight through.
const CACHE='blobbash-v1';
const ASSETS=['blob-bash-royale.html','blobbash.webmanifest','icon-blobbash-192.png','icon-blobbash-512.png'];
function mine(u){return u.indexOf('blob-bash')>-1||u.indexOf('blobbash')>-1||u.indexOf('icon-blobbash')>-1;}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!mine(e.request.url))return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;
  }).catch(()=>caches.match('blob-bash-royale.html'))));
});
