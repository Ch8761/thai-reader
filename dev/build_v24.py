import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

URL = open(os.path.join(D, 'url_ui.js'), encoding='utf-8').read()
PH = open(os.path.join(D, 'photo_ui.js'), encoding='utf-8').read()
rep('  function armed(btn, label, confirmLabel, action) {\n', URL + PH + '  function armed(btn, label, confirmLabel, action) {\n')

# ---------- 貼上網址 ----------
rep('<button type="button" id="openPaste" aria-expanded="false" aria-controls="pastebox">＋ 貼上文字</button>',
    '<button type="button" id="openPaste" aria-expanded="false" aria-controls="pastebox">＋ 網址／文字</button>')
rep('''    <div id="pastebox" class="pastebox" hidden>
      <label class="label" for="textTitle">標題（可不填，會用開頭幾個字）</label>''', '''    <div id="pastebox" class="pastebox" hidden>
      <label class="label" for="urlInput">新聞、文章的網址：自動抓下內文</label>
      <div class="urlrow"><input type="url" id="urlInput" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://www.bbc.com/thai/…"><button type="button" class="primary" id="addUrl">讀取文章</button></div>
      <div class="urlfail" id="urlFail" hidden><button type="button" id="urlReport">回報這個網址</button><span>讓我們知道哪些網站讀不到</span></div>
      <div class="pasteor"><span>或者直接貼上泰文</span></div>
      <label class="label" for="textTitle">標題（可不填，會用開頭幾個字）</label>''')
rep("    if (open) { setTimeout(function () { $('textTitle').focus(); }, 20); }", "    if (open) { setTimeout(function () { $('urlInput').focus(); }, 20); }")
rep("    var t = $('input').value.replace(/\\r/g, ''), name = $('textTitle').value.trim();\n",
    "    var t = $('input').value.replace(/\\r/g, ''), name = $('textTitle').value.trim();\n    if (urlLooksLike(t)) { libAddUrl(t.trim()); return; }\n")
# 文件頁：從網址匯入的文件，標題下面有「原文」連結
rep('<div id="docempty" class="docempty" hidden>', '<a id="docSrc" class="docsrc" target="_blank" rel="noopener noreferrer" hidden></a>\n    <div id="docempty" class="docempty" hidden>')
rep("    $('h-docv').textContent = has ? state.src.name : '文件';\n",
    "    $('h-docv').textContent = has ? state.src.name : '文件';\n    var srcD = has ? docById(state.src.id) : null, srcU = srcD && srcD.url;\n    $('docSrc').hidden = !srcU;\n    if (srcU) { var host = srcU; try { host = new URL(srcU).hostname.replace(/^www\\./, ''); } catch (err) {} $('docSrc').href = srcU; $('docSrc').textContent = '原文：' + (srcD.site || host) + ' ↗'; }\n")

# ---------- 照片：匯入前先裁切、拉正 ----------
rep("""    imagesToPdf(list, function (i) { $('homeMsg').textContent = '把圖片做成文件…（' + (i + 1) + ' / ' + list.length + '）'; }).then(function (bytes) {""",
"""    photoEdit(list).then(function (edited) {
      if (!edited) { throw { cancel: true }; }
      list = edited;
      return imagesToPdf(list, function (i) { $('homeMsg').textContent = '把圖片做成文件…（' + (i + 1) + ' / ' + list.length + '）'; });
    }).then(function (bytes) {""")
rep("""    }).catch(function (err) { $('homeMsg').textContent = '加入圖片失敗：' + String(err && err.message || err); });
  }
  $('imgfile').addEventListener('change',""", """    }).catch(function (err) { $('homeMsg').textContent = err && err.cancel ? '已取消加入圖片。' : '加入圖片失敗：' + String(err && err.message || err); });
  }
  $('imgfile').addEventListener('change',""")

CSS = r'''
/* ---- v1.14 貼上網址、照片調整 ---- */
.urlrow { display: flex; gap: 8px; align-items: stretch; }
.urlrow input { flex: 1 1 auto; min-width: 0; font-size: 16px; }
.urlrow button { flex: 0 0 auto; white-space: nowrap; }
.pasteor { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; margin: 14px 0 4px; }
.pasteor::before, .pasteor::after { content: ''; flex: 1; border-top: 1px solid var(--line); }
.docsrc { display: inline-block; margin: -2px 0 8px; font-size: 14px; color: var(--accent); text-decoration: none; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.docsrc[hidden] { display: none; }
.urlfail { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; margin-top: 8px; font-size: 13px; color: var(--muted); }
.urlfail[hidden] { display: none; }
.urlfail button { min-height: 36px; padding: 0 14px; border-radius: 999px; font-size: 14px; }
.phsheet .cdscroll { display: flex; flex-direction: column; gap: 10px; }
.phbox { padding: 18px; margin: 0 -8px; touch-action: none; background: color-mix(in srgb, var(--fg) 6%, transparent); border-radius: 14px; }
.phstage { position: relative; width: 100%; max-height: 52vh; margin: 0 auto; touch-action: none; }
.phstage canvas { display: block; width: 100%; height: 100%; border-radius: 6px; }
.phsvg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.phsvg polygon { fill: rgba(255, 212, 0, .12); stroke: #ffd400; stroke-width: 3; stroke-linejoin: round; }
.phsvg .phh { fill: #ffd400; stroke: #1c2622; stroke-width: 2; }
.phsvg .phh.on { fill: #fff; r: 16; }
.phtools { display: flex; flex-wrap: wrap; gap: 8px; }
.phtools button { min-height: 40px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
.phtools svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.phact { flex-wrap: wrap; }
@media (max-width: 360px) { .homeadd > * { padding-left: 8px; padding-right: 8px; font-size: 14px; } }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v24 ok')
