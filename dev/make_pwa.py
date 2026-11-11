# 由測試頁產生正式版 PWA 檔案，輸出到 /home/claude/thai-reader
import os, json, shutil
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
OUT = '/home/claude/thai-reader'
VER = '1.26.0'
s = open(os.path.join(D, 'thai-notes-test.html'), encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:90]); s = s.replace(old, new)

# 雲端同步：Google 用戶端 ID（使用者 2026-11-10 申請，專案 Thai Reader）
rep("  var SYNC_CLIENT_ID = '';", "  var SYNC_CLIENT_ID = '268036065948-eonf124to1ccbpg76ibvur6bjcoqit00.apps.googleusercontent.com';")
# 文字辨識工具放在同一個網站的 ocr/ 資料夾
rep("var OCR_BASE = 'https://ch8761.github.io/thai-reader/ocr/';", "var OCR_BASE = 'ocr/';")
# 使用說明的截圖放在同一個網站的 help/ 資料夾
rep("var HELP_IMG = 'https://ch8761.github.io/thai-reader/help/';", "var HELP_IMG = 'help/';")
os.makedirs(os.path.join(OUT, 'help'), exist_ok=True)
rep("EX_URL = 'https://ch8761.github.io/thai-reader/examples.json';", "EX_URL = 'examples.json';")
shutil.copyfile(os.path.join(D, 'examples.json'), os.path.join(OUT, 'examples.json'))
# 「貼上網址就匯入」：Cloudflare Pages 的小程式，放在 functions/api/fetch.js（網址 /api/fetch）
os.makedirs(os.path.join(OUT, 'functions', 'api'), exist_ok=True)
shutil.copyfile(os.path.join(D, 'cf_fetch.js'), os.path.join(OUT, 'functions', 'api', 'fetch.js'))
# 雲端同步的自動續登入（網址 /api/auth；需要 Cloudflare 環境變數 GOOGLE_CLIENT_SECRET）
shutil.copyfile(os.path.join(D, 'cf_auth.js'), os.path.join(OUT, 'functions', 'api', 'auth.js'))
# 隱私權政策（Google 登入的同意畫面要用）
shutil.copyfile(os.path.join(D, 'privacy.html'), os.path.join(OUT, 'privacy.html'))
rep("TONE_URL = 'https://ch8761.github.io/thai-reader/tones.json';", "TONE_URL = 'tones.json';")
shutil.copyfile(os.path.join(D, 'tones.json'), os.path.join(OUT, 'tones.json'))
shutil.copyfile(os.path.join(D, 'reader.json'), os.path.join(OUT, 'reader.json'))
for fn in os.listdir(os.path.join(D, 'helpimg', 'webp')):
    shutil.copyfile(os.path.join(D, 'helpimg', 'webp', fn), os.path.join(OUT, 'help', fn))
NM = os.path.join(D, 'ocrpkg', 'node_modules')
for sub in ('ocr/core', 'ocr/lang', 'ocr/lang2'):
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
for a, b in (('tesseract.js/dist/tesseract.min.js', 'ocr/tesseract.min.js'), ('tesseract.js/dist/worker.min.js', 'ocr/worker.min.js'),
             ('tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'ocr/core/tesseract-core-simd-lstm.wasm.js'),
             ('tesseract.js-core/tesseract-core-lstm.wasm.js', 'ocr/core/tesseract-core-lstm.wasm.js'),
             ('@tesseract.js-data/tha/4.0.0_best_int/tha.traineddata.gz', 'ocr/lang/tha.traineddata.gz'),
             ('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'ocr/lang/eng.traineddata.gz'),
             ('tesseract.js/LICENSE.md', 'ocr/LICENSE-tesseract.js.txt'), ('tesseract.js-core/LICENSE', 'ocr/LICENSE-tesseract-core.txt')):
    shutil.copyfile(os.path.join(NM, a), os.path.join(OUT, b))
# 1.18：新的泰文辨識模型（ocrtrain 訓練、ocrmodel/），英文模型照舊
if os.path.exists(os.path.join(D, 'ocrmodel', 'tha.traineddata.gz')):
    shutil.copyfile(os.path.join(D, 'ocrmodel', 'tha.traineddata.gz'), os.path.join(OUT, 'ocr/lang2/tha.traineddata.gz'))
    shutil.copyfile(os.path.join(NM, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), os.path.join(OUT, 'ocr/lang2/eng.traineddata.gz'))
# 1.20：中文（繁體、簡體）辨識資料
for z in ('chi_tra', 'chi_sim'):
    shutil.copyfile(os.path.join(D, 'chi', 'x_tesseract.js-data-%s-1.0.0' % z, 'package', '4.0.0_best_int', '%s.traineddata.gz' % z), os.path.join(OUT, 'ocr/lang2/%s.traineddata.gz' % z))

rep("var APP_VER = '測試頁 v26';", "var APP_VER = '正式版 v" + VER + "';")
# 回饋：正式版沒有 Claude 的資料庫，送到 Google 表單成功就算送出；沒網路就先存著，下次補送
rep("""    var gf = inClaude ? false : await sendToGForm(item);""", """    var gf = inClaude ? false : (navigator.onLine === false ? false : await sendToGForm(item));""")
rep("""    try {
      if (!fbDb || !fbUid) { throw { code: 'no_db' }; }
      await fbDb.collection('feedback/' + fbUid + '/items').add(item);""", """    if (!inClaude && gf === 'fetch') {
      fbItems.unshift(item);
      try { localStorage.setItem('thai-feedback-sent', JSON.stringify(fbItems.slice(0, 30))); } catch (e) {}
      $('fbText').value = ''; $('fbManual').hidden = true;
      $('fbStatus').textContent = '謝謝！已送出。';
      $('fbSend').disabled = false; renderFeedback(); renderReport();
      return;
    }
    try {
      if (!fbDb || !fbUid) { throw { code: 'no_db' }; }
      await fbDb.collection('feedback/' + fbUid + '/items').add(item);""")
rep("""    } catch (err) { fbMode = '連不上（只存在裝置）'; }
    clearTimeout(timer);""", """    } catch (err) {
      fbMode = 'Google 表單';
      try { fbItems = JSON.parse(localStorage.getItem('thai-feedback-sent') || '[]'); } catch (e) { fbItems = []; }
      if (navigator.onLine !== false && fbLocal.length) {
        var keep = [];
        for (var i = 0; i < fbLocal.length; i++) {
          var x = Object.assign({}, fbLocal[i]); delete x.local;
          var r = await sendToGForm(x);
          if (r === 'fetch') { x.form = 'fetch'; fbItems.unshift(x); } else { keep.push(fbLocal[i]); }
        }
        fbLocal = keep;
        try { localStorage.setItem('thai-feedback-local', JSON.stringify(fbLocal)); localStorage.setItem('thai-feedback-sent', JSON.stringify(fbItems.slice(0, 30))); } catch (e) {}
      }
      renderFeedback();
    }
    clearTimeout(timer);""")
rep("""      $('fbStatus').textContent = gf ? '已送到 Google 表單；App 的回饋資料庫暫時連不上""", """      if (!inClaude) { $('fbStatus').textContent = '現在沒有網路，回饋先存在這台裝置，下次打開 App 時會自動送出。'; renderFeedback(); return; }
      $('fbStatus').textContent = gf ? '已送到 Google 表單；App 的回饋資料庫暫時連不上""")

# 正式版：藏起測試工具，改顯示版本號
rep('    <details class="testtools">', '    <div class="appverrow"><p class="label appver">ไทย Reader 正式版 v' + VER + '</p><button type="button" id="checkUpd">檢查更新</button><span class="updmsg" id="updMsg" aria-live="polite"></span></div>\n    <details class="testtools" hidden>')
rep('</style>', '.appverrow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; } .appverrow .appver { margin: 0; } .appverrow #checkUpd { min-height: 36px; font-size: 14px; border-radius: 999px; } .appverrow .updmsg { font-size: 14px; color: var(--muted); flex-basis: 100%; } .appverrow .updmsg:empty { display: none; }\n</style>')

rep('''    <div class="setrow">
      <div class="setlabel">顯示 PDF 的文字層''', '''    <div class="setrow" hidden>
      <div class="setlabel">顯示 PDF 的文字層''')

# 拆成 <head> 與 <body>
cut = s.index('</style>') + len('</style>')
head, body = s[:cut], s[cut:]
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
PWA_HEAD = '''<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="泰文閱讀：開 PDF 點字查詞、中文詞義、句型說明、筆記與生字卡。">
<meta name="theme-color" content="#f5eedf" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1e2125" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="ไทย Reader">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
'''
SW_REG = '''
<script>
/* 離線用的背景程式（Service Worker）：把 App 存在 iPad 上，沒網路也能打開 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { reg.update().catch(function () {}); } });
    }).catch(function () {});
  });
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    if (document.getElementById('updbar')) { return; }
    var bar = document.createElement('div');
    bar.id = 'updbar'; bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;gap:10px;align-items:center;width:max-content;white-space:nowrap;padding:10px 14px;border-radius:12px;background:var(--card);color:var(--fg);border:1px solid var(--line);box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:15px;max-width:calc(100% - 32px)';
    bar.textContent = '有新版本了。';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'primary'; b.textContent = '重新整理';
    b.addEventListener('click', function () { location.reload(); });
    bar.appendChild(b); document.body.appendChild(bar);
  });
}
/* 設定頁的「檢查更新」 */
(function () {
  var btn = document.getElementById('checkUpd'), msg = document.getElementById('updMsg');
  if (!btn) { return; }
  if (!('serviceWorker' in navigator)) { btn.hidden = true; return; }
  var checking = false;
  btn.addEventListener('click', function () {
    if (checking) { return; }
    if (navigator.onLine === false) { msg.textContent = '現在沒有網路，連上網路後再按一次。'; return; }
    checking = true; btn.disabled = true; msg.textContent = '檢查中…';
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) { throw new Error('noreg'); }
      return reg.update().then(function () { return reg; });
    }).then(function (reg) {
      var nw = reg.installing || reg.waiting;
      if (!nw) { msg.textContent = '已經是最新版了。'; return; }
      msg.textContent = '找到新版，下載中…下載好會自動重新整理。';
      navigator.serviceWorker.addEventListener('controllerchange', function () { location.reload(); });
      if (reg.waiting) { reg.waiting.postMessage && reg.waiting.postMessage('skip'); }
    }).catch(function () { msg.textContent = '現在連不到更新伺服器，等一下再試。'; })
      .then(function () { checking = false; btn.disabled = false; });
  });
})();
/* 請瀏覽器不要自動清掉這個 App 的資料（PDF、筆記、生字卡） */
if (navigator.storage && navigator.storage.persist) { navigator.storage.persisted().then(function (p) { if (!p) { navigator.storage.persist(); } }).catch(function () {}); }
</script>
'''
head = head.replace('<title>泰文閱讀</title>', '<title>ไทย Reader</title>')
html = PWA_HEAD + head + '\n</head>\n<body>\n' + body + SW_REG + '</body>\n</html>\n'
assert '�' not in html

os.makedirs(OUT + '/icons', exist_ok=True)
open(OUT + '/index.html', 'w', encoding='utf-8').write(html)

manifest = {
    "name": "ไทย Reader", "short_name": "ไทย Reader", "lang": "zh-Hant",
    "description": "開 PDF 點字查詞、中文詞義、句型說明、筆記與生字卡。",
    "start_url": "./", "scope": "./", "display": "standalone", "orientation": "any",
    "background_color": "#f5eedf", "theme_color": "#739488",
    "icons": [
        {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
    ]
}
json.dump(manifest, open(OUT + '/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

SW = '''/* 泰文閱讀的離線程式。改版時把 VERSION 加一，iPad 會自動換成新版。 */
const VERSION = 'thai-reader-v%s';
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
''' % VER
open(OUT + '/sw.js', 'w', encoding='utf-8').write(SW)

# 圖示：綠色圓角方塊；上面奶油色「ไทย」，中間一條線，線下寫「Reader」
def icon(size, pad=0.0, rounded=True):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=(115, 148, 136, 255))
    else:
        d.rectangle([0, 0, size, size], fill=(115, 148, 136, 255))
    k = 1 - 2 * pad
    cream = (255, 250, 240, 255)
    th = ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf', int(size * 0.34 * k))
    en = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(size * 0.13 * k))
    def center(t, f, cy):
        bb = d.textbbox((0, 0), t, font=f)
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        d.text(((size - w) / 2 - bb[0], cy - h / 2 - bb[1]), t, font=f, fill=cream)
    center('ไทย', th, size * (0.5 - 0.11 * k))
    lw = size * 0.5 * k
    d.rounded_rectangle([(size - lw) / 2, size * (0.5 + 0.075 * k), (size + lw) / 2, size * (0.5 + 0.075 * k) + max(2, size * 0.022)], radius=int(size * 0.011), fill=cream)
    center('Reader', en, size * (0.5 + 0.2 * k))
    return im
icon(192).save(OUT + '/icons/icon-192.png')
icon(512).save(OUT + '/icons/icon-512.png')
icon(512, pad=0.1, rounded=False).save(OUT + '/icons/icon-maskable-512.png')
ap = Image.new('RGB', (180, 180), (115, 148, 136)); ap.paste(icon(180, rounded=False).convert('RGB')); ap.save(OUT + '/icons/apple-touch-icon.png')

open(OUT + '/.nojekyll', 'w').write('')
open(OUT + '/README.md', 'w', encoding='utf-8').write('''# ไทย Reader（泰文閱讀）

在 iPad 上讀泰文的 App（PWA）：開 PDF、照片或貼上文字（掃描的頁面會用文字辨識讀出來），點一下就查詞，有中文詞義、句型說明、朗讀、整篇翻譯，還能畫螢光筆、手寫、加文字框，並把生字存成生字卡複習。

## 怎麼安裝到 iPad

1. 用 Safari 打開這個 App 的網址。
2. 點分享按鈕，選「加入主畫面」。
3. 主畫面會出現「ไทย Reader」的圖示，之後點它打開，沒網路也能用。

## 資料存在哪裡

PDF、筆記、生字卡都只存在你自己的裝置上，不會上傳。換裝置時請用「設定 → 備份與還原」。

## 資料來源與授權

見 [NOTICES.md](NOTICES.md)。
''')
open(OUT + '/NOTICES.md', 'w', encoding='utf-8').write('''# 資料來源與授權

| 內容 | 來源 | 授權 |
|---|---|---|
| 泰英字典（17,676 詞） | Wiktionary，經 kaikki.org / wiktextract 整理 | CC BY-SA 3.0／4.0 |
| 中文詞義（自動對照部分） | ECDICT 英漢詞典 | MIT |
| 中文詞義（自動對照部分） | Thai WordNet（NICT）、Chinese Open WordNet | 依各自授權，需標示來源 |
| 泰國人名、姓氏清單 | PyThaiNLP corpus | CC BY-SA 4.0 |
| 國名、府名清單 | PyThaiNLP corpus | CC0 |
| PDF 顯示 | PDF.js（Mozilla） | Apache-2.0 |
| PDF 產生 | pdf-lib | MIT |
| 文字辨識（OCR） | Tesseract.js、tesseract.js-core（Tesseract OCR） | Apache-2.0 |
| 泰文、英文、中文（繁體、簡體）辨識資料 | tessdata_best（Google／Tesseract） | Apache-2.0 |
| 泰文辨識模型（1.18 起） | 以 tessdata_best 泰文模型為基礎，用 Google Fonts 的開放泰文字型（SIL Open Font License）產生訓練圖片繼續訓練；字型本身沒有隨 App 散布 | Apache-2.0 |
| 讀物庫短文 | ไทย Reader 原創（由 Claude 撰寫） | 隨 App 提供 |
| 辨識錯字修正用詞頻 | PyThaiNLP corpus（Thai National Corpus 詞頻） | CC0 |
| 明星、政治人物、劇集、電影、樂團、品牌、國家、地名、泰國政府機關與大學名單 | Wikidata | CC0 |
| 生字卡的生活化例句（泰文＋英文） | scb-mt-en-th-2020（VISTEC 與 SCB） | CC BY-SA 4.0 |
| 聲調學習資料（音節、聲調） | 由 Wiktionary 拼音（CC BY-SA）推算，音節切分用 PyThaiNLP（Apache-2.0） | CC BY-SA |
| 簡轉繁 | OpenCC（只在製作字典時使用） | Apache-2.0 |
| 常用 1,000 詞中文詞義、網路用語詞表、句型庫說明 | 本專案自行撰寫 | 與本專案相同 |

依 CC BY-SA，本專案整理後的字典資料以相同授權（CC BY-SA 4.0）提供。
Longdo Dict 與 thai2english 只提供開啟其網站的連結，沒有複製任何內容。
''')
print('ok', len(html))
