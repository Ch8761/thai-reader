import re, sys, os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:80])
    s = s.replace(old, new)

# ---------- CSS ----------
CSS = r'''
#pdfpages { position: absolute; left: 0; top: 0; width: 640px; }
.pdfpage { position: absolute; left: 0; width: 640px; background: #ffffff; box-shadow: 0 0 0 1px var(--line); overflow: hidden; }
.pdfpage canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.pdfpage canvas.pi { pointer-events: none; }
.pdfpage .pnum { position: absolute; right: 6px; bottom: 4px; font-size: 10px; color: #8a96a3; font-family: var(--ui); pointer-events: none; }
#wrap.haspdf { background: var(--bg); }
#text.pdf { position: absolute; left: 0; top: 0; width: 640px; height: 100%; padding: 0; white-space: pre; color: transparent; line-height: 1; font-family: Thonburi, "Sukhumvit Set", "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
#text.pdf .tl { position: absolute; transform-origin: 0 0; white-space: pre; line-height: 1; }
#text.pdf .sep { font-size: 0; }
#text.pdf mark.hl { background: rgba(255, 205, 0, 0.42); color: transparent; mix-blend-mode: multiply; }
#text.pdf mark.pv { background: rgba(255, 140, 60, 0.4); color: transparent; mix-blend-mode: multiply; }
#text.pdf mark.tapsel { background: rgba(13, 107, 134, 0.12); color: transparent; }
#text.pdf mark.anno { text-underline-offset: 0.18em; text-decoration-thickness: max(1.5px, 0.12em); }
body.showtl #text.pdf { color: rgba(220, 0, 0, 0.55); }
#wrap.haspdf #ink { display: none; }
.filebtn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 8px; background: var(--accent); color: var(--accent-fg); font-weight: 600; cursor: pointer; }
.filebtn:focus-within { outline: 3px solid var(--accent); outline-offset: 2px; }
.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.pq { margin: 0; padding-left: 1.2em; font-size: 14px; color: var(--muted); display: flex; flex-direction: column; gap: 4px; }
.modal { position: fixed; inset: 0; z-index: 30; background: rgba(8, 18, 28, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
.mcard { background: var(--card); color: var(--fg); border: 1px solid var(--line); border-radius: 16px; width: 100%; max-width: 520px; max-height: calc(100vh - 32px); overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.3); }
.mcard h2 { font-size: 20px; }
.mcard .wnote { font-size: 14px; color: var(--muted); margin: 0; }
.mcard .btns { justify-content: flex-end; padding-top: 6px; }
'''
rep('</style>', CSS + '</style>')

# ---------- HTML ----------
rep('<p class="lead">在貼上的泰文上試三種筆記：螢光筆、手寫、文字框。筆記會存在這台裝置上，關掉再打開還會在。</p>',
    '<p class="lead">開啟泰文 PDF，直接在頁面上點字查詞、畫螢光筆、手寫、加文字框。PDF 和筆記會存在這台裝置上，關掉再打開還會在。</p>')
DOC = '''
  <section id="docsec" aria-labelledby="h-doc">
    <h2 id="h-doc">文件</h2>
    <div class="btns">
      <label class="filebtn">開啟 PDF 檔<input type="file" id="pdffile" class="vh" accept="application/pdf,.pdf"></label>
      <button type="button" id="toText" hidden>改回範例文字</button>
    </div>
    <div id="docstatus" class="label" aria-live="polite">目前顯示：範例或貼上的文字</div>
    <ul id="docpages" class="pq" hidden></ul>
    <div id="dochelp" class="label" hidden></div>
  </section>
'''
rep('  <div class="toolbar" role="toolbar" aria-label="筆記工具">', DOC + '\n  <div class="toolbar" role="toolbar" aria-label="筆記工具">')
rep('''    <div id="page">
      <div id="text" lang="th"></div>''', '''    <div id="page">
      <div id="pdfpages" hidden></div>
      <div id="text" lang="th"></div>''')
rep('''    <div class="btns"><button type="button" id="closeSettings" class="primary">完成</button></div>''',
'''    <div class="setrow">
      <div class="setlabel">歡迎視窗<span class="sethelp">第一次開啟時出現的設定視窗，可以再看一次。</span></div>
      <button type="button" id="reWelcome">再顯示一次</button>
    </div>
    <div class="setrow">
      <div class="setlabel">顯示 PDF 的文字層<span class="sethelp">測試用：用紅字顯示點字時比對的位置，看是否對準 PDF 上的字。</span></div>
      <button type="button" class="toggle" id="showTl" aria-pressed="false">顯示</button>
    </div>
    <div class="btns"><button type="button" id="closeSettings" class="primary">完成</button></div>''')
WEL = '''
  <div id="welcome" class="modal" role="dialog" aria-modal="true" aria-labelledby="h-welcome" hidden>
    <div class="mcard">
      <h2 id="h-welcome">歡迎！先設定兩件事</h2>
      <p class="wnote">選好就能開始。之後隨時可以按工具列的「設定」修改。</p>
      <div class="setrow">
        <div class="setlabel">我的泰文程度<span class="sethelp" id="wLevelHelp"></span></div>
        <div class="seg" role="radiogroup" aria-label="我的泰文程度" id="wLevel"></div>
      </div>
      <div class="setrow">
        <div class="setlabel">顯示拼音<span class="sethelp">查詞和例句旁是否顯示羅馬拼音，例如 sà-wàt-dii。</span></div>
        <div class="seg" role="radiogroup" aria-label="顯示拼音" id="wRom"></div>
      </div>
      <div class="btns"><button type="button" class="primary" id="wDone">開始使用</button></div>
    </div>
  </div>
'''
rep('</main>\n', WEL + '</main>\n')

# ---------- libraries (plain text, injected only when a PDF is opened) ----------
P = os.path.join(D, 'pdfjs', 'node_modules')
pdfjs = open(os.path.join(P, 'pdfjs-dist/build/pdf.min.mjs'), encoding='utf-8').read()
worker = open(os.path.join(P, 'pdfjs-dist/build/pdf.worker.min.mjs'), encoding='utf-8').read()
pdflib = open(os.path.join(P, 'pdf-lib/dist/pdf-lib.min.js'), encoding='utf-8').read()
fix = open(os.path.join(D, 'pdffix.js'), encoding='utf-8').read()
assert pdfjs.count('import.meta.url') == 1
pdfjs = pdfjs.replace('import.meta.url', '""')
m = re.search(r'export\{([^}]*)\};?\s*$', pdfjs)
assert m
pairs = []
for part in m.group(1).split(','):
    a, b = [x.strip() for x in part.split(' as ')]
    pairs.append(b + ':' + a)
pdfjs = pdfjs[:m.start()] + 'globalThis.pdfjsLib={' + ','.join(pairs) + '};'
m2 = re.search(r'export\{(\w+) as WorkerMessageHandler\};?\s*$', worker)
assert m2
worker = worker[:m2.start()] + 'globalThis.pdfjsWorker={WorkerMessageHandler:' + m2.group(1) + '};'
pdfjs, worker, pdflib, fix = [c.replace('\ufffd', '\\uFFFD') for c in (pdfjs, worker, pdflib, fix)]
for name, code in (('pdfjs', pdfjs), ('worker', worker), ('pdflib', pdflib), ('fix', fix)):
    assert '</script' not in code.lower() and '<!--' not in code, name
LIBS = ('<script type="text/plain" id="lib-pdflib">' + pdflib + '</script>\n'
        '<script type="text/plain" id="lib-pdffix">' + fix + '</script>\n'
        '<script type="text/plain" id="lib-pdfjs">' + pdfjs + '</script>\n'
        '<script type="text/plain" id="lib-pdfworker">' + worker + '</script>\n')
rep('<script>\n(function () {', LIBS + '<script>\n(function () {')

# ---------- main script ----------
rep("var state = { text: SAMPLE, hl: [], strokes: [], boxes: [], nextId: 1, style: Object.assign({}, DEFAULT_STYLE) };",
    "var state = { text: SAMPLE, src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: Object.assign({}, DEFAULT_STYLE) };")
old_checks = s[s.index('  var CHECKS = ['):s.index('  var HINTS = {')]
rep(old_checks, '''  var CHECKS = [
    ['p1', '開啟 PDF：按「開啟 PDF 檔」選 B 或 C，頁面看起來和原檔一樣'],
    ['p2', 'PDF 點字：點 PDF 上的泰文詞，藍框框住你點的詞，查得到意思'],
    ['p3', 'PDF 文字正確：查詞視窗裡的泰文沒有亂碼、沒有缺聲調'],
    ['p4', 'PDF 筆記：螢光筆、手寫、文字框都落在正確位置'],
    ['p5', '轉向：把 iPad 轉橫再轉直，PDF 和筆記都還在原位'],
    ['p6', '重開：關掉測試頁再打開，PDF 和筆記都還在'],
    ['w1', '歡迎視窗：第一次開啟有跳出，選的程度和拼音有生效']
  ];
''')
rep('''  function segAt(i) {
    for (var k = 0; k < segs.length; k++) { if (i >= segs[k].i && i < segs[k].i + segs[k].n) { return segs[k]; } }
    return null;
  }''', '''  function segAt(i) {
    var lo = 0, hi = segs.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1, x = segs[mid];
      if (i < x.i) { hi = mid - 1; } else if (i >= x.i + x.n) { lo = mid + 1; } else { return x; }
    }
    return null;
  }''')
old_rt = s[s.index('  function renderText(preview) {'):s.index('  function addRange(r) {')]
rep(old_rt, '''  function collectMarks(preview) {
    var marks = state.hl.map(function (r) { return { s: r[0], e: r[1], c: 'hl' }; });
    if (preview) { marks.push({ s: preview[0], e: preview[1], c: 'pv' }); }
    if (tapSel) { marks.push({ s: tapSel[0], e: tapSel[1], c: 'tapsel' }); }
    state.boxes.forEach(function (b) { if (b.a) { marks.push({ s: b.a[0], e: b.a[1], c: 'anno anno-' + ((b.s && b.s.color) || 'red') }); } });
    return marks;
  }
  /* 把 t（在全文中從 base 開始）畫進 el，套上標記 */
  function fillMarks(el, t, base, marks) {
    var pts = [0, t.length];
    marks.forEach(function (m) { pts.push(m.s - base, m.e - base); });
    pts = pts.filter(function (v, i, a) { return v >= 0 && v <= t.length && a.indexOf(v) === i; }).sort(function (x, y) { return x - y; });
    el.replaceChildren();
    for (var k = 0; k < pts.length - 1; k++) {
      var a = pts[k], b = pts[k + 1];
      if (b <= a) { continue; }
      var cls = [];
      marks.forEach(function (m) { if (m.s - base <= a && m.e - base >= b && cls.indexOf(m.c) === -1) { cls.push(m.c); } });
      if (!cls.length) { el.appendChild(document.createTextNode(t.slice(a, b))); continue; }
      var mk = document.createElement('mark');
      mk.className = cls.join(' ');
      mk.textContent = t.slice(a, b);
      el.appendChild(mk);
    }
  }
  function renderText(preview) {
    var marks = collectMarks(preview);
    if (pdf) {
      pdf.tl.forEach(function (sp) {
        if (sp.sep) { return; }
        var a = sp.o, b = sp.o + sp.t.length, mine = [];
        marks.forEach(function (m) { if (m.s < b && m.e > a) { mine.push(m); } });
        var key = mine.map(function (m) { return m.s + ':' + m.e + ':' + m.c; }).join('|');
        if (key === sp.k) { return; }
        sp.k = key;
        fillMarks(sp.el, sp.t, a, mine);
      });
      return;
    }
    fillMarks($('text'), state.text, 0, marks);
  }
''')
rep('''  function indexByGeometry(x, y) {
    var w = document.createTreeWalker($('text'), NodeFilter.SHOW_TEXT);''', '''  function indexByGeometry(x, y) {
    if (pdf) { return indexByGeometryPdf(x, y); }
    var w = document.createTreeWalker($('text'), NodeFilter.SHOW_TEXT);''')
rep('''  /* 把第 s 到第 e 個字的第一行位置換算成頁面座標 */''', '''  /* PDF：先找手指附近的文字行，再逐字比對 */
  function indexByGeometryPdf(x, y) {
    var pr = $('page').getBoundingClientRect(), py = (y - pr.top) / scale, R = 40;
    var best = -1, bestD = 1e12, bestC = 1e12, rg = document.createRange();
    var pages = {};
    pdf.pages.forEach(function (pg) { if (py >= pg.top - 60 && py <= pg.top + pg.h + 60) { pages[pg.n] = true; } });
    pdf.tl.forEach(function (sp) {
      if (sp.sep || !pages[sp.page]) { return; }
      var r = sp.el.getBoundingClientRect();
      var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
      if (dx * dx + dy * dy > R * R) { return; }
      var w = document.createTreeWalker(sp.el, NodeFilter.SHOW_TEXT), node, acc = sp.o;
      while ((node = w.nextNode())) {
        var len = node.nodeValue.length;
        for (var k = 0; k < len; k++) {
          rg.setStart(node, k); rg.setEnd(node, k + 1);
          var list = rg.getClientRects();
          for (var j = 0; j < list.length; j++) {
            var q = list[j];
            if (q.width < 0.3 || q.height < 0.3) { continue; }
            var ddx = Math.max(q.left - x, 0, x - q.right), ddy = Math.max(q.top - y, 0, y - q.bottom);
            var d = ddx * ddx + ddy * ddy, c = Math.abs(x - (q.left + q.right) / 2);
            if (d < bestD - 0.01 || (Math.abs(d - bestD) <= 0.01 && c < bestC)) { bestD = d; bestC = c; best = acc + k; }
          }
        }
        acc += len;
      }
    });
    lastD = bestD;
    return bestD <= R * R ? best : -1;
  }

  /* 把第 s 到第 e 個字的第一行位置換算成頁面座標 */''')
rep('''    scale = avail / PAGE_W;
    $('page').style.transform = 'scale(' + scale + ')';
''', '''    scale = avail / PAGE_W;
    $('page').style.transform = 'scale(' + scale + ')';
    if (pdf) {
      pageH = pdf.totalH;
      $('page').style.height = pageH + 'px';
      $('wrap').style.height = Math.ceil(pageH * scale) + 'px';
      renderVisiblePages();
      renderReport();
      return;
    }
''')
rep('''  function redrawInk() {
    var g = ctx();''', '''  function redrawInk() {
    if (pdf) { pdf.pages.forEach(redrawPageInk); return; }
    var g = ctx();''')
rep('''      active = { id: e.pointerId, kind: 'ink', s: { w: 3, p: [toPage(e)] } };''',
    '''      active = { id: e.pointerId, kind: 'ink', s: { w: 3, p: [toPage(e)] } };
      if (pdf) { var ipg = pageAtY(active.s.p[0][1]); active.g = ipg && ipg.ink.width ? pageInkCtx(ipg) : null; }''')
rep('''      var g = ctx(), p = active.s.p;''', '''      var g = pdf ? active.g : ctx(), p = active.s.p;
      if (!g) { list.forEach(function (ev) { p.push(toPage(ev)); }); return; }''')
rep("  function data() { return { text: state.text, hl: state.hl, strokes: state.strokes, boxes: state.boxes, nextId: state.nextId, style: state.style }; }",
    "  function data() { return { text: state.text, src: state.src || null, hl: state.hl, strokes: state.strokes, boxes: state.boxes, nextId: state.nextId, style: state.style }; }")
rep('''    try { localStorage.setItem(STORE, JSON.stringify(data())); storeStatus = '已儲存'; }''',
    '''    try {
      var dd = JSON.stringify(data());
      localStorage.setItem(STORE, dd);
      if (state.src && state.src.id) { localStorage.setItem(PDF_DOC_PREFIX + state.src.id, dd); }
      storeStatus = '已儲存';
    }''')
rep("        state.text = d.text; state.hl = d.hl || [];", "        state.text = d.text; state.src = d.src || null; state.hl = d.hl || [];")
rep('''    state = { text: t, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style };''',
    '''    if (pdf && state.src) { try { localStorage.setItem(PDF_DOC_PREFIX + state.src.id, JSON.stringify(data())); } catch (e) {} }
    teardownPdf();
    state = { text: t, src: null, hl: [], strokes: [], boxes: [], nextId: 1, style: state.style };
    setDocStatus('目前顯示：你貼上的文字');''')
rep('''        if (!s.w && !/[ๆฯ]/.test(s.t)) { hidePop(); $('info').textContent = '這裡是空白或標點，不是詞。'; return; }''',
    '''        if (!s.w && !/[ๆฯ]/.test(s.t)) { hidePop(); $('info').textContent = '這裡是空白或標點，不是詞。'; return; }
        if (!/[\\u0E00-\\u0E7F]/.test(s.t)) { hidePop(); if (tapSel) { tapSel = null; renderText(); } $('info').textContent = '你點到「' + s.t + '」，這不是泰文詞。'; return; }''')
rep('''    lines.push('朗讀：''', '''    lines.push('歡迎視窗：' + (typeof welcomeSeen === 'undefined' ? '檢查中' : (welcomeSeen ? '已看過' : '還沒按「開始使用」')));
    if (typeof pdf !== 'undefined') {
      lines.push('PDF：' + (pdf ? pdf.name + '（' + pdf.pages.length + ' 頁，載入 ' + (pdf.ms / 1000).toFixed(1) + ' 秒）' : '沒有開啟') + '；解析方式：' + workerMode + (pdfInfo.stored ? '；' + pdfInfo.stored : ''));
      if (pdf) {
        var fr = pdf.fix;
        lines.push('PDF 字型修復：' + fr.codes + ' 個（名稱 ' + fr.byName + '、組合 ' + fr.byComposite + '、外形 ' + fr.byShape + '；修不好 ' + fr.unresolved + '）' + (fr.fixedFonts.length ? '：' + fr.fixedFonts.join('、') : '') + (fr.error ? '；錯誤：' + fr.error : ''));
        lines.push('PDF 每頁：' + pdf.quality.map(function (q) { return q.n + (q.st === 'ok' ? '✓' : '✗' + Q_TEXT[q.st]) + '(泰' + q.thai + ' 典' + Math.round(q.cov * 100) + '%' + (q.garb ? ' 怪' + q.garb : '') + (q.nulls ? ' 缺' + q.nulls : '') + ')'; }).join(' '));
        lines.push('PDF 文字層：' + pdf.tl.filter(function (x) { return !x.sep; }).length + ' 行；基線比例 ' + baseRatio.toFixed(2) + '；已畫出 ' + pdf.pages.filter(function (p) { return p.rendered; }).length + ' 頁');
      }
      if (pdfInfo.lastError) { lines.push('PDF 錯誤：' + pdfInfo.lastError); }
    }
    lines.push('朗讀：''')
rep("          var lift = Math.round(state.style.size * 1.3) + 8;", "          var lift = Math.round(state.style.size * 1.3) + (pdf ? 3 : 8);")
rep("  /* ---------- 儲存與復原 ---------- */", open(os.path.join(D, 'pdf_ui.js'), encoding='utf-8').read() + "\n  /* ---------- 儲存與復原 ---------- */")
rep('''  /* ---------- 啟動 ---------- */
  load();
  segs = segment(state.text);
  $('input').value = state.text;
  renderText();
  renderBoxes();''', '''  /* ---------- 啟動 ---------- */
  load();
  var startPdf = !!(state.src && state.src.type === 'pdf');
  if (startPdf) { $('text').textContent = ''; } else {
    segs = segment(state.text);
    $('input').value = state.text;
    renderText();
    renderBoxes();
  }''')
rep('''  window.addEventListener('orientationchange', function () { setTimeout(layout, 300); });''',
    '''  window.addEventListener('orientationchange', function () { setTimeout(layout, 300); });
  if (startPdf) {
    restorePdf().catch(function (err) {
      var why = String(err && err.message || err).slice(0, 60);
      pdfInfo.lastError = why;
      state.src = null;
      segs = segment(state.text);
      renderText(); renderBoxes(); layout();
      setDocStatus('沒辦法打開上次的 PDF（' + why + '），請再按「開啟 PDF 檔」選一次；同一份檔案的筆記會接回來。');
    });
  }
  $('showTl').addEventListener('click', function () {
    var on = !document.body.classList.contains('showtl');
    document.body.classList.toggle('showtl', on);
    $('showTl').setAttribute('aria-pressed', String(on));
  });
  if (!welcomeSeen) { openWelcome(); }''')
open(src, 'w', encoding='utf-8').write(s)
print('ok', len(s))
