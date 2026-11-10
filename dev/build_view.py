import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 樣式 ----------
CSS = r'''
/* ---- v1.7 工具區：黏在上方的工具列＋選項列 ---- */
.toolhead { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 7; background: var(--card); border-bottom: 1px solid var(--line); border-radius: 14px 14px 0 0; }
.toolhead .toolbar { position: static; border: 0; border-radius: 0; background: transparent; }
.workbox > .toolhead .toolbar { border: 0; }
.toolbar button:disabled { opacity: .38; cursor: default; }
.subbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; padding: 0 10px 8px; }
.subbar:empty { display: none; }
.subbar .stylebar { flex: 1 1 auto; flex-basis: auto; padding-top: 0; border-top: 0; }
.subbar .stylebar .sb, .subbar .stylebar .sw { min-height: 36px; }
.subbar .stylebar .sb { min-height: 36px; padding: 0 10px; font-size: 15px; }
.subbar .stylebar .sw { width: 30px; height: 30px; min-height: 30px; }
.toolopts { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.toolopts[hidden], .stylebar[hidden], .viewbar[hidden] { display: none !important; }
.toolopts .ol, .stylebar .sl { font-size: 13px; color: var(--muted); margin: 0 2px 0 6px; }
.toolopts .ol:first-child { margin-left: 0; }
.sw2 { position: relative; width: 30px; height: 30px; min-height: 30px; padding: 0; border-radius: 50%; background: var(--sw); border: 3px solid var(--card); box-shadow: 0 0 0 1px var(--line); flex: 0 0 auto; cursor: pointer; }
.sw2[aria-pressed="true"], .sw2.on, .stylebar .sw.custom.on { box-shadow: 0 0 0 3px var(--accent); }
.sw2.custom, .stylebar .sw.custom { background: conic-gradient(from 0deg, #ff5f5f, #ffd400, #4fd18b, #4fb3ff, #b07bff, #ff5fb0, #ff5f5f); display: inline-flex; align-items: center; justify-content: center; }
.sw2.custom::after, .stylebar .sw.custom::after { content: ""; width: 14px; height: 14px; border-radius: 50%; background: var(--sw); border: 2px solid var(--card); }
.sw2.custom input, .stylebar .sw.custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }
.stylebar .sw.custom { position: relative; width: 30px; height: 30px; min-height: 30px; padding: 0; border-radius: 50%; border: 3px solid var(--card); box-shadow: 0 0 0 1px var(--line); }
.toolopts .ob { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }
.toolopts .ob[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); font-weight: 600; box-shadow: inset 0 0 0 1px var(--accent); }
.toolopts .ob-full::before { content: ""; width: 16px; height: 12px; border-radius: 3px; background: var(--sw); opacity: .75; }
.toolopts .ob-under::before { content: ""; width: 16px; height: 12px; border-bottom: 4px solid var(--sw); }
.toolopts .odot { display: inline-block; border-radius: 50%; flex: 0 0 auto; }

/* 自訂顏色的螢光筆、底線樣式 */
#text mark.hl.hlc { background: var(--hlc); color: inherit; }
#text mark.hl.hlu { background: linear-gradient(transparent 70%, var(--hlu, rgba(255, 200, 0, .85)) 70%); color: inherit; }
#text.pdf mark.hl.hlc { background: var(--hlc); color: transparent; }
#text.pdf mark.hl.hlu { background: linear-gradient(transparent 72%, var(--hlu, rgba(255, 200, 0, .85)) 72%); color: transparent; }
#text mark.anno-custom { text-decoration-color: var(--ac); }

/* ---- 顯示比例、翻頁 ---- */
.viewbar { position: relative; margin-left: auto; display: flex; align-items: center; gap: 4px; }
.viewbar button { min-height: 34px; font-size: 14px; border-radius: 999px; padding: 0 12px; }
.viewbar .vb-zoom { font-variant-numeric: tabular-nums; }
.viewbar .vb-arrow { width: 34px; padding: 0; font-size: 20px; line-height: 1; }
.viewbar .vb-page { min-width: 74px; font-variant-numeric: tabular-nums; border-color: transparent; background: transparent; }
.viewbar .vb-sep { width: 1px; height: 22px; background: var(--line); margin: 0 4px; }
.viewbar .vb-input { width: 74px; min-height: 34px; font-size: 16px; text-align: center; border-radius: 999px; border: 1px solid var(--accent); background: var(--bg); color: var(--fg); }
.vb-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 20; min-width: 200px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 6px; box-shadow: 0 12px 32px rgba(0, 0, 0, .18); display: flex; flex-direction: column; }
.vb-menu .vm-h { font-size: 12px; color: var(--muted); padding: 8px 10px 4px; }
.vb-menu button { min-height: 40px; border: 0; background: transparent; text-align: left; border-radius: 10px; padding: 0 10px 0 32px; position: relative; font-size: 15px; }
.vb-menu button[aria-checked="true"] { color: var(--accent); font-weight: 600; }
.vb-menu button[aria-checked="true"]::before { content: "✓"; position: absolute; left: 10px; }
.vb-menu button:hover { background: var(--bg); }

/* ---- 選取一段直接翻譯 ---- */
.selpop { position: fixed; left: 50%; bottom: calc(80px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 40; width: min(560px, calc(100% - 24px)); max-height: 60vh; overflow: auto; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 16px 14px; box-shadow: 0 16px 40px rgba(0, 0, 0, .22); display: flex; flex-direction: column; gap: 8px; }
.selpop[hidden] { display: none; }
.selpop .sp-head { display: flex; align-items: center; justify-content: space-between; }
.selpop .sp-k { font-size: 13px; color: var(--muted); }
.selpop .sp-x { min-height: 36px; width: 36px; padding: 0; border-radius: 50%; font-size: 20px; }
.selpop .sp-th { font-family: var(--thai); font-size: 19px; line-height: 1.6; }
.selpop .sp-tr { font-size: 17px; line-height: 1.6; padding: 8px 12px; border-radius: 10px; background: var(--bg); }
.selpop .sp-tr.loading { color: var(--muted); }
.selpop .sp-tr.err { color: var(--muted); font-size: 15px; }
.selpop .sp-btns { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.selpop .sp-btns button { min-height: 38px; font-size: 15px; border-radius: 999px; }
.selpop .sp-btns .ext { margin-left: auto; font-size: 14px; }
#text mark.tapsel.pv, #text mark.pv { border-radius: 2px; }
#wrap { -webkit-user-select: none; user-select: none; }
#wrap .note-text { -webkit-user-select: text; user-select: text; }

.workbox > #wrap { width: auto; align-self: stretch; }
/* ---- 文件資訊：不要外框，只留一行字＋圓形按鈕 ---- */
#docsec { background: transparent; border: 0; box-shadow: none; padding: 0 4px; gap: 4px 12px; }
#docsec #docpages { color: var(--muted); }
#docsec #docpages li { border: 0; background: transparent; padding: 0; }
#docsec .ocrbox { background: transparent; border: 0; padding: 0; }
'''
rep('</style>', CSS + '</style>')

# 早一點套用字體，避免先閃一下系統字
rep("<script>try{var t0=localStorage.getItem('thai-theme');",
    "<script>try{var f0={notosans:'\"Noto Sans TC\", \"PingFang TC\", system-ui, sans-serif',notoserif:'\"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif',wenkai:'\"LXGW WenKai TC\", \"Kaiti TC\", \"BiauKai\", serif'}[localStorage.getItem('thai-font')];if(f0){document.documentElement.style.setProperty('--ui',f0);}}catch(e){}</script>\n<script>try{var t0=localStorage.getItem('thai-theme');")
# 文字框的「黑體」固定用系統黑體（不跟著介面字體變）
rep("  var FONTS = { sans: 'var(--ui)',", "  var FONTS = { sans: '\"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", system-ui, sans-serif',")

rep('淺色是奶油白配綠色；深色是黑、灰、藍。', '淺色是奶油白配綠色；深色是鐵灰配淺藍。')

rep("hl: '從一個詞劃到另一個詞，放開後變黃。點一下黃色的地方可以取消。'", "hl: '從一個詞劃到另一個詞，放開就畫好。點一下畫過的地方可以取消。'")

# ---------- 工具列按鈕 ----------
rep('<button type="button" id="undo">復原</button>',
    '<button type="button" id="undo" aria-label="上一步" disabled>↶ 上一步</button>\n    <button type="button" id="redo" aria-label="下一步" disabled>↷ 下一步</button>')

# ---------- 設定頁：中文字體 ----------
rep('''      <div class="seg" role="radiogroup" aria-label="外觀" id="themeGroup"></div>
    </div>''', '''      <div class="seg" role="radiogroup" aria-label="外觀" id="themeGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">中文字體<span class="sethelp">按鈕、說明和查詞視窗的中文字。泰文字不受影響。</span></div>
      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>''')
rep("'thai-theme', 'thai-my-names'];", "'thai-theme', 'thai-my-names', 'thai-font', 'thai-view', 'thai-tools', 'thai-progress'];")

# ---------- 螢光筆顏色 ----------
rep("    var marks = state.hl.map(function (r) { return { s: r[0], e: r[1], c: 'hl' }; });",
    "    var marks = state.hl.map(function (r) { return { s: r[0], e: r[1], c: 'hl' + (r[2] ? ' hlc' : '') + (r[3] === 'u' ? ' hlu' : ''), bg: r[2] || null }; });")
rep("    state.boxes.forEach(function (b) { if (b.a) { marks.push({ s: b.a[0], e: b.a[1], c: 'anno anno-' + ((b.s && b.s.color) || 'red') }); } });",
    "    state.boxes.forEach(function (b) { if (b.a) { var bc = (b.s && b.s.color) || 'red', cu = /^#/.test(bc); marks.push({ s: b.a[0], e: b.a[1], c: 'anno anno-' + (cu ? 'custom' : bc), ac: cu ? bc : null }); } });")
rep('''      var cls = [];
      marks.forEach(function (m) { if (m.s - base <= a && m.e - base >= b && cls.indexOf(m.c) === -1) { cls.push(m.c); } });
      if (!cls.length) { el.appendChild(document.createTextNode(t.slice(a, b))); continue; }
      var mk = document.createElement('mark');
      mk.className = cls.join(' ');''', '''      var cls = [], mbg = null, mac = null;
      marks.forEach(function (m) { if (m.s - base <= a && m.e - base >= b) { if (cls.indexOf(m.c) === -1) { cls.push(m.c); } if (m.bg) { mbg = m.bg; } if (m.ac) { mac = m.ac; } } });
      if (!cls.length) { el.appendChild(document.createTextNode(t.slice(a, b))); continue; }
      var mk = document.createElement('mark');
      mk.className = cls.join(' ');
      if (mbg) { mk.style.setProperty('--hlc', hexA(mbg, 0.42)); mk.style.setProperty('--hlu', hexA(mbg, 0.9)); mk.setAttribute('data-c', mbg); }
      if (mac) { mk.style.setProperty('--ac', mac); mk.setAttribute('data-ac', mac); }''')
rep("        var key = mine.map(function (m) { return m.s + ':' + m.e + ':' + m.c; }).join('|');",
    "        var key = mine.map(function (m) { return m.s + ':' + m.e + ':' + m.c + (m.bg || '') + (m.ac || ''); }).join('|');")
rep("      if (!a.moved && hit >= 0) { state.hl.splice(hit, 1); } else { addRange(snapRange(a.a, a.b)); }",
    "      if (!a.moved && hit >= 0) { state.hl.splice(hit, 1); } else { addRangeColored(snapRange(a.a, a.b), toolPrefs.hlColor, toolPrefs.hlStyle); }")
# 文字變了時搬移筆記：保留顏色
rep("if (!same[k]) { return null; } var d = np[k][0] - op[k][0]; return [r[0] + d, r[1] + d]; }",
    "if (!same[k]) { return null; } var d = np[k][0] - op[k][0]; return [r[0] + d, r[1] + d].concat(r.slice(2)); }")

# ---------- 手寫顏色、粗細 ----------
rep("      active = { id: e.pointerId, kind: 'ink', s: { w: 3, p: [toPage(e)] } };",
    "      active = { id: e.pointerId, kind: 'ink', s: { w: toolPrefs.inkW, p: [toPage(e)] } };\n      if (inkStrokeColor()) { active.s.c = inkStrokeColor(); }")
rep("      g.lineWidth = active.s.w;\n      list.forEach",
    "      g.lineWidth = active.s.w; g.strokeStyle = active.s.c || g._inkDef || g.strokeStyle;\n      list.forEach")
rep('''    g.strokeStyle = inkColor();
    g.fillStyle = inkColor();
    return g;''', '''    g.strokeStyle = inkColor();
    g.fillStyle = inkColor();
    g._inkDef = g.strokeStyle;
    return g;''')
rep("    g.strokeStyle = pc; g.fillStyle = pc;\n    return g;", "    g.strokeStyle = pc; g.fillStyle = pc; g._inkDef = pc;\n    return g;")
rep('''    var p = s.p;
    if (!p.length) { return; }''', '''    var p = s.p;
    if (!p.length) { return; }
    var col = s.c || g._inkDef;
    if (col) { g.strokeStyle = col; g.fillStyle = col; }''')

# ---------- 文字框自訂顏色 ----------
rep("    ed.style.color = 'var(--c-' + x.color + ')';", "    ed.style.color = /^#/.test(x.color || '') ? x.color : 'var(--c-' + x.color + ')';")
rep("    Array.prototype.forEach.call(document.querySelectorAll('#stylebar [data-font]'), function (el) { el.setAttribute('aria-pressed', String(el.getAttribute('data-font') === st.font)); });\n  }",
    "    Array.prototype.forEach.call(document.querySelectorAll('#stylebar [data-font]'), function (el) { el.setAttribute('aria-pressed', String(el.getAttribute('data-font') === st.font)); });\n    if (typeof syncBoxCustom === 'function') { syncBoxCustom(); }\n  }")

# ---------- 匯出：每段螢光筆、每一筆手寫用自己的顏色 ----------
rep("        out.push({ x: (r.left - pr.left) / scale, y: (r.top - pr.top) / scale, w: r.width / scale, h: r.height / scale, cls: m.className });",
    "        out.push({ x: (r.left - pr.left) / scale, y: (r.top - pr.top) / scale, w: r.width / scale, h: r.height / scale, cls: m.className, c: m.getAttribute('data-c'), ac: m.getAttribute('data-ac') });")
rep("          P.drawRectangle({ x: X(r.x), y: Y(r.y + r.h), width: r.w / s, height: r.h / s, color: hexRgb(LIGHT.hl), opacity: 0.35 });",
    "          if (/\\bhlu\\b/.test(r.cls)) { P.drawRectangle({ x: X(r.x), y: Y(r.y + r.h), width: r.w / s, height: r.h * 0.3 / s, color: hexRgb(r.c || '#ffc800'), opacity: 0.85 }); }\n          else { P.drawRectangle({ x: X(r.x), y: Y(r.y + r.h), width: r.w / s, height: r.h / s, color: hexRgb(r.c || LIGHT.hl), opacity: 0.35 }); }")
rep("          var m = /anno-(\\w+)/.exec(r.cls), col = hexRgb(LIGHT[m ? m[1] : 'red'] || LIGHT.red);",
    "          var m = /anno-(\\w+)/.exec(r.cls), col = hexRgb(r.ac || LIGHT[m ? m[1] : 'red'] || LIGHT.red);")
rep("borderColor: hexRgb(LIGHT.ink), borderWidth: st.w,", "borderColor: hexRgb(st.c || LIGHT.ink), borderWidth: st.w,")

# ---------- 縮放、翻頁：layout() 交給 view_ui ----------
rep('''    scale = avail / PAGE_W;
    $('page').style.transform = 'scale(' + scale + ')';
    if (pdf) {
      pageH = pdf.totalH;
      $('page').style.height = pageH + 'px';
      $('wrap').style.height = Math.ceil(pageH * scale) + 'px';
      renderVisiblePages();
      renderReport();
      return;
    }''', '''    scale = viewPrefs ? computeScale(avail) : avail / PAGE_W;
    $('page').style.transform = 'scale(' + scale + ')';
    if (pdf) {
      pageH = pdf.totalH;
      $('page').style.height = pageH + 'px';
      $('wrap').style.height = Math.ceil(pageH * scale) + 'px';
      if (viewPrefs) { viewAfterLayout(); }
      renderVisiblePages();
      renderReport();
      return;
    }''')
rep('''    redrawInk();
    renderReport();
  }
  function inkColor()''', '''    redrawInk();
    if (viewPrefs) { viewAfterLayout(); }
    renderReport();
  }
  function inkColor()''')

# ---------- 觸控：兩指縮放交給程式處理，瀏覽器只負責捲動 ----------
rep("    $('wrap').style.touchAction = drawingMode() ? (pencilOnly ? 'pan-x pan-y' : 'none') : 'manipulation';",
    "    $('wrap').style.touchAction = drawingMode() && !pencilOnly ? 'none' : 'pan-x pan-y';\n    if (typeof renderToolOpts === 'function') { renderToolOpts(); }")
# 長按選取時不要開查詞視窗
rep("      if (moved > 12) { return; }\n      if (a.kind === 'tap') {",
    "      if (moved > 12 || (typeof selGesture !== 'undefined' && selGesture)) { return; }\n      if (a.kind === 'tap') {")

# ---------- 上一步／下一步 ----------
rep('''  function snapshot() {
    history.push(JSON.stringify({ hl: state.hl, strokes: state.strokes, boxes: state.boxes }));
    if (history.length > 40) { history.shift(); }
  }''', '''  function snapshot() {
    history.push(JSON.stringify({ hl: state.hl, strokes: state.strokes, boxes: state.boxes }));
    if (history.length > 60) { history.shift(); }
    redoStack = [];
    if (typeof syncUndoButtons === 'function') { syncUndoButtons(); }
  }''')
s = s.replace('history = []; tapSel = null;', 'history = []; redoStack = []; tapSel = null;')
rep("            if (moved) { save(); } else { history.pop(); }", "            if (moved) { save(); } else { history.pop(); syncUndoButtons(); }")
TOOLS = open(os.path.join(D, 'tools_ui.js'), encoding='utf-8').read()
VIEW = open(os.path.join(D, 'view_ui.js'), encoding='utf-8').read()
rep('''  $('undo').addEventListener('click', function () {
    if (!history.length) { $('hint').textContent = '沒有可以復原的動作。'; return; }
    var d = JSON.parse(history.pop());
    state.hl = d.hl; state.strokes = d.strokes; state.boxes = d.boxes;
    renderText(); redrawInk(); renderBoxes(); save();
  });''', TOOLS + '''
  $('undo').addEventListener('click', function () {
    if (!history.length) { $('hint').textContent = '已經沒有上一步了。'; return; }
    redoStack.push(notesNow()); applyNotes(history.pop());
  });
  $('redo').addEventListener('click', function () {
    if (!redoStack.length) { $('hint').textContent = '已經沒有下一步了。'; return; }
    history.push(notesNow()); applyNotes(redoStack.pop());
  });
''' + VIEW + '''
  renderToolOpts(); syncUndoButtons();
''')
rep('''    state.hl = []; state.strokes = []; state.boxes = [];
    tapSel = null;''', '''    state.hl = []; state.strokes = []; state.boxes = [];
    tapSel = null; syncUndoButtons();''')

open(src, 'w', encoding='utf-8').write(s)
print('view ok')
