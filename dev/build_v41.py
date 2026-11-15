import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'
JS = open(os.path.join(D, 'v41_ui.js'), encoding='utf-8').read()
assert s.count(ANCHOR) == 1
s = s.replace(ANCHOR, JS + ANCHOR, 1)

# ===== 1. 啟動失敗時的提示（放在最前面，主程式壞了也看得到）=====
HEAD = r"""<script>
(function () {
  var KEY = 'thai-errlog', shown = false;
  function en() { try { return localStorage.getItem('thai-ui-lang') === 'en'; } catch (e) { return false; } }
  function log(kind, msg, src, line) {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      a.push({ t: Date.now(), k: kind, m: String(msg).slice(0, 300), s: String(src || '').split('/').pop().slice(0, 60), l: line || 0 });
      localStorage.setItem(KEY, JSON.stringify(a.slice(-10)));
    } catch (e) {}
  }
  function banner() {
    if (shown || !document.body) { return; } shown = true;
    var b = document.createElement('div'); b.id = 'bootFail'; b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:99999;padding:12px 14px;border-radius:14px;background:#2b2b2b;color:#fff;font:15px/1.5 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3)';
    var t = document.createElement('div'); t.textContent = en() ? 'The app did not start properly.' : 'App 沒有順利啟動。'; b.appendChild(t);
    var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
    function btn(label, fn) { var x = document.createElement('button'); x.type = 'button'; x.textContent = label; x.style.cssText = 'min-height:44px;padding:0 14px;border-radius:12px;border:1px solid #fff;background:transparent;color:#fff;font:inherit'; x.addEventListener('click', fn); row.appendChild(x); return x; }
    btn(en() ? 'Reload' : '重新載入', function () { location.reload(); });
    var cp = btn(en() ? 'Copy error details' : '複製錯誤訊息', function () {
      var txt = ''; try { txt = localStorage.getItem(KEY) || ''; } catch (e) {}
      try { navigator.clipboard.writeText(txt).then(function () { cp.textContent = en() ? 'Copied' : '已複製'; }); } catch (e) { t.textContent = txt.slice(0, 400); }
    });
    b.appendChild(row); document.body.appendChild(b);
  }
  window.addEventListener('error', function (e) {
    if (!e || (e.target && e.target !== window)) { return; }
    log('error', e.message, e.filename, e.lineno);
    if (!window.__thaiBoot) { if (document.body) { banner(); } else { document.addEventListener('DOMContentLoaded', banner); } }
  });
  window.addEventListener('unhandledrejection', function (e) { log('promise', e && e.reason && (e.reason.message || e.reason)); });
  window.addEventListener('load', function () { setTimeout(function () { if (!window.__thaiBoot) { log('boot', 'boot did not finish'); banner(); } }, 6000); });
})();
</script>
"""
a = s.index('<style>'); assert a < 3000; s = s[:a] + HEAD + s[a:]
rep("  renderToolOpts(); syncUndoButtons();\n", "  renderToolOpts(); syncUndoButtons();\n  window.__thaiBoot = 1;\n")

# ===== 2. 同步改了設定：讀文件時不重新載入 =====
rep("    if (ch.settings) { sync.status = '已同步，套用另一台裝置的設定…'; renderSync(); setTimeout(function () { location.reload(); }, 600); return; }",
    "    if (ch.settings && !syncApplyLater()) { sync.status = '已同步，套用另一台裝置的設定…'; renderSync(); setTimeout(function () { location.reload(); }, 600); return; }")

# ===== 3. 同步狀態燈 =====
rep('<header class="vhead"><h1 id="h-home">我的文件</h1></header>',
    '<header class="vhead"><h1 id="h-home">我的文件</h1><button type="button" id="syncDot" class="syncdot" hidden><span class="sd" aria-hidden="true"></span></button></header>')

# ===== 4. 查詞視窗：資料來源改成一個小連結；設定頁加「資料來源與授權」=====
a = s.index("    var cr = document.createElement('div'); cr.className = 'credit'; cr.textContent = '詞義：Wiktionary"); b = s.index("\n", a)
s = s[:a] + "    var cr = document.createElement('button'); cr.type = 'button'; cr.className = 'credit crlink'; cr.textContent = '資料來源'; cr.addEventListener('click', function () { openCredits(cr); });" + s[b:]
rep("      lifeBody.appendChild(el('div', 'credit one', '例句：scb-mt-en-th-2020（CC BY-SA 4.0）・中文為機器翻譯'));\n", "")
rep("""      <button type="button" id="openHelp">打開使用說明</button>
    </div>
""", """      <button type="button" id="openHelp">打開使用說明</button>
    </div>
    <div class="setrow">
      <div class="setlabel">資料來源與授權<span class="sethelp">字典、例句、詞頻表和各種工具的來源與授權條款。</span></div>
      <button type="button" id="openCredits">查看資料來源</button>
    </div>
""")
rep("['help', '說明與回饋', ['openHelp', 'reWelcome', 'fbCat']]", "['help', '說明與回饋', ['openHelp', 'openCredits', 'reWelcome', 'fbCat']]")

# ===== 5. 斷詞 =====
rep("    out = dictMerge(out);\n    if (typeof userSplit === 'function') { out = userSplit(out); }", "    out = dictMerge(out);\n    out = repairSeg(out);\n    if (typeof userSplit === 'function') { out = userSplit(out); }")
# 「บริษัททัวร์」這種字典裡本來就有的一般詞，不當成機構名
rep("        add(g.i, e1, type);\n        while (a + 1 < r.segs.length && segs[r.segs[a + 1]].i < e1) { a++; }",
    "        if (type === 'org' && zhOfEntry(t.slice(g.i, e1))) { a = k2; continue; }\n        add(g.i, e1, type);\n        while (a + 1 < r.segs.length && segs[r.segs[a + 1]].i < e1) { a++; }")
# 清邁瓦洛洛市場
rep("ไฮไลต์|org|Highlight|樂團|Highlight</script>", "ไฮไลต์|org|Highlight|樂團|Highlight\nตลาดวโรรส|place|瓦洛洛市場（清邁）|市場|Warorot Market\nกาดหลวง|place|瓦洛洛市場（清邁，當地人的叫法）|市場|Kad Luang</script>")

# ===== 5b. 貼網址匯入：失敗自動再試一次（換路線）；閱讀服務交回純文字時也能用 =====
rep("    var a = await urlFetchOnce(u, false);\n", """    var a;
    try { a = await urlFetchOnce(u, false); }
    catch (err1) {
      /* 第一次失敗：等兩秒，自動換一條路線再試一次 */
      if (navigator.onLine === false) { throw err1; }
      var m41 = $('homeMsg'); if (m41) { m41.textContent = '第一次沒有成功，正在換一種方式再試一次…'; }
      await new Promise(function (ok) { setTimeout(ok, 2000); });
      a = await urlFetchOnce(u, true);
    }
""")
rep("    var a = urlArticle(html, fin);\n    if (/^https?:\\/\\/r\\.jina\\.ai\\//.test(fin)) { fin = u; }", """    var a = /markdown/i.test(r.headers.get('x-source-type') || '') ? urlFromMarkdown(html) : urlArticle(html, fin);
    if (/^https?:\\/\\/r\\.jina\\.ai\\//.test(fin)) { fin = u; }""")
rep("  async function urlFetchOnce(u, viaReader) {", """  /* 閱讀服務交回的純文字（Markdown）：拿掉圖片、連結網址和標記，留下有泰文的段落 */
  function urlFromMarkdown(md) {
    var title = (/^Title:\\s*(.+)$/m.exec(md) || [])[1] || '';
    var k = md.indexOf('Markdown Content:'); if (k >= 0) { md = md.slice(k + 17); }
    var lines = md.replace(/!\\[[^\\]]*\\]\\([^)]*\\)/g, '').replace(/\\[([^\\]]*)\\]\\([^)]*\\)/g, '$1').split(/\\n+/).map(function (l) {
      return urlClean(l.replace(/^\\s{0,3}(#{1,6}|[-*+]|\\d+\\.|>)\\s+/, '').replace(/[*_`]{1,3}/g, ''));
    }).filter(function (l, i, a) { return l && urlThaiCount(l) >= 8 && a.indexOf(l) === i; });
    var text = lines.join('\\n');
    title = urlClean(title).replace(/\\s+[|\\-–—]\\s+[^|\\-–—]{2,30}$/, '');
    return { title: title, site: '', text: text, thai: urlThaiCount(text) };
  }
  async function urlFetchOnce(u, viaReader) {""")

# ===== 6. 樣式 =====
CSS = """
/* 1.33 */
.syncdot { flex: none; width: 44px; height: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; }
.syncdot .sd { width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; background: #2e9e5b; }
.syncdot.err .sd { background: #c8372d; }
.syncdot.busy .sd { width: 16px; height: 16px; background: transparent; border: 2px solid var(--line); border-top-color: var(--accent); animation: sdspin .9s linear infinite; }
@keyframes sdspin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .syncdot.busy .sd { animation: none; border-color: var(--accent); border-style: dotted; } }
.pop .credit.crlink { display: inline-block; min-height: 32px; padding: 4px 0; border: 0; background: transparent; color: var(--muted); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; }
.crlist { margin: 0; }
.crlist dt { margin-top: 12px; font-weight: 700; font-size: 14.5px; }
.crlist dd { margin: 2px 0 0; font-size: 14.5px; line-height: 1.6; color: var(--fg); }
.crerr { margin-top: 18px; }
"""
rep('</style>', CSS + '</style>')

# ===== 7. 英文 =====
EN = {
 '資料來源': 'Sources', '資料來源與授權': 'Sources and licences', '查看資料來源': 'View sources',
 '字典、例句、詞頻表和各種工具的來源與授權條款。': 'Where the dictionary, example sentences, frequency list and tools come from, and their licences.',
 '詞義': 'Definitions', '中文詞義': 'Chinese definitions', '常用字表': 'Frequency list', '例句': 'Example sentences', '真人發音': 'Real-voice pronunciation', '文字辨識': 'Text recognition',
 'Wiktionary（CC BY-SA），經 kaikki.org／wiktextract 整理。': 'Wiktionary (CC BY-SA), processed by kaikki.org / wiktextract.',
 '常用詞為人工翻譯，其餘由 ECDICT 與 WordNet 自動對照，僅供參考。': 'Common words are translated by hand; the rest are matched automatically with ECDICT and WordNet and are for reference only.',
 'PyThaiNLP 詞頻表（Thai National Corpus、Thai Textbook Corpus，CC0）。': 'PyThaiNLP frequency lists (Thai National Corpus, Thai Textbook Corpus, CC0).',
 'scb-mt-en-th-2020（CC BY-SA 4.0），中文為機器翻譯。': 'scb-mt-en-th-2020 (CC BY-SA 4.0); the Chinese is machine translated.',
 'YouGlish.com，影片來自 YouTube。': 'YouGlish.com; videos come from YouTube.',
 'Tesseract.js（Apache-2.0）。': 'Tesseract.js (Apache-2.0).',
 'PDF.js（Apache-2.0）、pdf-lib（MIT）。': 'PDF.js (Apache-2.0), pdf-lib (MIT).',
 '第一次沒有成功，正在換一種方式再試一次…': 'The first try did not work; trying another way…',
}
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data.setdefault(k, v)
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(src, 'w', encoding='utf-8').write(s)
print('v41 ok')
