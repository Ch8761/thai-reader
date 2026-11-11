/* 泰文閱讀的離線程式。改版時把 VERSION 加一，iPad 會自動換成新版。 */
const VERSION = 'thai-reader-v1.26.0';
const OCR_CACHE = 'thai-reader-ocr-5.1.1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== OCR_CACHE).map((k) => caches.delete(k))))
    /* 舊的辨識模型（ocr/lang/）不再使用，從快取刪掉 */
    .then(() => caches.open(OCR_CACHE)).then((c) => c.keys().then((ks) => Promise.all(ks.filter((r) => r.url.indexOf('/ocr/lang/') >= 0).map((r) => c.delete(r)))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') { return; }
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')));
  if (isPage) {
    /* 頁面：先上網拿最新版，沒網路就用存著的 */
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  /* 讀取文章的小程式：每次都上網，不存起來 */
  if (url.origin === location.origin && url.pathname.indexOf('/api/') >= 0) { return; }
  if (url.origin === location.origin && url.pathname.indexOf('/ocr/') >= 0) {
    /* 文字辨識工具（約 8 MB）：存在另一個快取，改版時不用重新下載 */
    e.respondWith(caches.open(OCR_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res && res.ok) { c.put(req, res.clone()); } return res; }))));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    /* 圖示、字型：先用存著的，沒有才上網 */
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
