import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 聲調分頁 ----------
T2 = open(os.path.join(D, 'tone2_ui.js'), encoding='utf-8').read()
rep('  function segment(str) {\n', T2 + '  function segment(str) {\n')


# ---------- 句型（原本就在主檔裡，從 grammar_ui.js 換掉這一段） ----------
G = open(os.path.join(D, 'grammar_ui.js'), encoding='utf-8').read()
A0 = '  /* 回傳兩部分：mine＝你點的詞的句型'; A1 = '  /* 自我檢查：每個句型都要能比對到自己的例句 */'
i0, i1 = s.index(A0), s.index(A1); assert s.count(A0) == 1 and s.count(A1) == 1
s = s[:i0] + G[G.index(A0):G.index(A1)] + s[i1:]
rep('  var LEVELS = [', '  var gramSel = null, gramFocus = null;\n  var LEVELS = [')

# ---------- 句型：圈選句型用到的詞 ----------
rep("    if (tapSel) { marks.push({ s: tapSel[0], e: tapSel[1], c: 'tapsel' }); }",
    "    if (tapSel) { marks.push({ s: tapSel[0], e: tapSel[1], c: 'tapsel' }); }\n    if (gramSel) { gramSel.forEach(function (r) { marks.push({ s: r[0], e: r[1], c: 'tapsel gsel' }); }); }")
rep("  function hidePop() { $('pop').hidden = true; }",
    "  function hidePop() { $('pop').hidden = true; if (gramSel) { gramSel = null; renderText(); } }")
rep("  function showPop(seg) {\n    lastPopSeg = seg;",
    "  function showPop(seg) {\n    lastPopSeg = seg;\n    if (gramSel && !gramFocus) { gramSel = null; renderText(); }")

# ---------- 手寫：筆點一下是寫字（i 的點），只有手指快速點一下才是查詞；線條平滑 ----------
rep("      active = { id: e.pointerId, kind: 'ink', t0: Date.now(), cx: e.clientX, cy: e.clientY, s: { w: toolPrefs.inkW, p: [toPage(e)] } };",
    "      active = { id: e.pointerId, kind: 'ink', pt: e.pointerType, t0: Date.now(), cx: e.clientX, cy: e.clientY, s: { w: toolPrefs.inkW, p: [toPage(e)] } };")
rep("      if (Date.now() - a.t0 < 350 && Math.abs(e.clientX - a.cx) + Math.abs(e.clientY - a.cy) < 8) {",
    "      if (a.pt === 'touch' && Date.now() - a.t0 < 350 && Math.abs(e.clientX - a.cx) + Math.abs(e.clientY - a.cy) < 8) {")
rep("""    if (p.length === 1) { g.beginPath(); g.arc(p[0][0], p[0][1], s.w / 2, 0, Math.PI * 2); g.fill(); return; }
    g.lineWidth = s.w;
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    for (var k = 1; k < p.length; k++) { g.lineTo(p[k][0], p[k][1]); }
    g.stroke();""", """    var dot = Math.max(s.w / 2, 1.3);
    if (p.length === 1 || (p.length <= 3 && Math.abs(p[p.length - 1][0] - p[0][0]) + Math.abs(p[p.length - 1][1] - p[0][1]) < 1)) { g.beginPath(); g.arc(p[0][0], p[0][1], dot, 0, Math.PI * 2); g.fill(); return; }
    g.lineWidth = s.w;
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    /* 經過相鄰兩點的中點畫曲線，筆跡比較圓滑（點很少時也不會一段一段折線） */
    if (p.length === 2) { g.lineTo(p[1][0], p[1][1]); }
    else {
      for (var k = 1; k < p.length - 1; k++) { g.quadraticCurveTo(p[k][0], p[k][1], (p[k][0] + p[k + 1][0]) / 2, (p[k][1] + p[k + 1][1]) / 2); }
      g.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    }
    g.stroke();""")
# 筆畫時就用小點標出起筆，避免太短的筆看不到
rep("""      if (inkStrokeColor()) { active.s.c = inkStrokeColor(); }
      if (pdf) { var ipg = pageAtY(active.s.p[0][1]); active.g = ipg && ipg.ink.width ? pageInkCtx(ipg) : null; }""",
    """      if (inkStrokeColor()) { active.s.c = inkStrokeColor(); }
      if (pdf) { var ipg = pageAtY(active.s.p[0][1]); active.g = ipg && ipg.ink.width ? pageInkCtx(ipg) : null; }
      var g0 = pdf ? active.g : ctx();
      if (g0) { g0.fillStyle = active.s.c || g0._inkDef || g0.fillStyle; g0.beginPath(); g0.arc(active.s.p[0][0], active.s.p[0][1], Math.max(active.s.w / 2, 1.3), 0, Math.PI * 2); g0.fill(); }""")

# ---------- 文字框模式也能查詞：點詞先查詞（查詞視窗裡按「加註解」加框）；點空白處加框；Apple Pencil 點詞直接加框 ----------
rep("      active = { id: e.pointerId, kind: mode, x: e.clientX, y: e.clientY };",
    "      active = { id: e.pointerId, kind: mode, pt: e.pointerType, x: e.clientX, y: e.clientY };")
rep("""        var ws = (bi >= 0 && lastD <= 9) ? segAt(bi) : null;
        snapshot();""", """        var ws = (bi >= 0 && lastD <= 9) ? segAt(bi) : null;
        if (ws && ws.w && a.pt !== 'pen' && /[\\u0E01-\\u0E2E]/.test(ws.t)) { tapSel = [ws.i, ws.i + ws.n]; renderText(); showPop(ws); return; }
        snapshot();""")
rep("    box: '點一個泰文詞：在它正上方加註解。點空白處：放一段自由文字。點一下已有的註解，可以改上方的文字樣式，旁邊會出現 ⠿（拖曳移動）和 ×（刪除）。'",
    "    box: '點一個泰文詞會先查詞，按「加註解」就在詞的正上方加框（用 Apple Pencil 點詞會直接加框）。點空白處：放一段自由文字。點一下已有的註解可以改樣式，旁邊有 ⠿（拖曳移動）和 ×（刪除）。'")

# 剛從「其他句型」換過來時，句型說明放在最上面（詞的下面）
rep('''    pop.appendChild(x); pop.appendChild(head);
    if (en0) { pop.appendChild(buildEntitySection(en0)); }''', '''    pop.appendChild(x); pop.appendChild(head);
    var gFirst = !!(gs.mine && gs.mine.classList.contains('gfocus'));
    if (gFirst) { pop.appendChild(gs.mine); }
    if (en0) { pop.appendChild(buildEntitySection(en0)); }''')
rep("    if (gs.mine) { pop.appendChild(gs.mine); }", "    if (gs.mine && !gFirst) { pop.appendChild(gs.mine); }")


# ---------- 影片文件的重新辨識、刪除時一起刪影片 ----------
rep("    if (!pdf) { box.hidden = true; $('ocrRedo').hidden = true; if (typeof syncDocSec === 'function') { syncDocSec(); } return; }",
    "    if (!pdf) { box.hidden = true; $('ocrRedo').hidden = !(typeof vidRedoable === 'function' && vidRedoable()); if (typeof syncDocSec === 'function') { syncDocSec(); } return; }")
rep("  $('ocrRedo').addEventListener('click', function () { runOcr(ocrHavePages()); });",
    "  $('ocrRedo').addEventListener('click', function () { if (!pdf && typeof vidRedoable === 'function' && vidRedoable()) { vidRedo(); return; } runOcr(ocrHavePages()); });")
rep("    idbDel(id); idbDel('ocr:' + id); idbDel('thumb2:' + id); idbDel('thumb:' + id);",
    "    idbDel(id); idbDel('ocr:' + id); idbDel('thumb2:' + id); idbDel('thumb:' + id); idbDel('vid:' + id);")
rep("    if (has && curTab === 'doc') { layout(); }\n  }", "    if (has && curTab === 'doc') { layout(); }\n    if (typeof renderOcrBox === 'function') { renderOcrBox(); }\n  }")


# ---------- 使用者調整斷詞 ----------
SG = open(os.path.join(D, 'seg_ui.js'), encoding='utf-8').read()
rep('  function segment(str) {\n', SG + '  function segment(str) {\n')
rep("    out = dictMerge(out);\n    return out;\n  }", "    out = dictMerge(out);\n    if (typeof userSplit === 'function') { out = userSplit(out); }\n    return out;\n  }")
rep("    myNames.forEach(function (n) { if (n && n.t && n.t.length >= 2) { gazAdd({ t: n.t, type: n.type || 'other', zh: n.zh || '', desc: '', mine: true }); } });",
    "    myNames.forEach(function (n) { if (n && n.t && n.t.length >= 2) { gazAdd({ t: n.t, type: n.type || 'other', zh: n.zh || '', desc: '', mine: true }); } });\n    if (typeof myWords !== 'undefined') { myWords.forEach(function (w) { if (w && w.t && w.t.length >= 2) { gazAdd({ t: w.t, type: 'other', zh: '', desc: '', mine: true, word: true }); } }); }")
rep("      if (list && (starts[i] || !isThaiCh(str.charAt(i - 1)))) {",
    "      if (list && (starts[i] || !isThaiCh(str.charAt(i - 1)) || list.some(function (o) { return o.word && o.t.length >= 4; }))) {")
rep("          if (o.weak) { if (!starts[i] || str.charAt(i - 1) === '-' || nx === '-') { continue; } }",
    "          if (o.word) { if (!starts[i] && isThaiCh(str.charAt(i - 1)) && o.t.length < 4) { continue; } }\n          else if (o.weak) { if (!starts[i] || str.charAt(i - 1) === '-' || nx === '-') { continue; } }")
rep("    segs.forEach(function (g) { if (g.gz && !g.gz.weak) { add(g.i, g.i + g.n, ENT_TYPES[g.gz.type] ? g.gz.type : 'other', g.gz); } });",
    "    segs.forEach(function (g) { if (g.gz && !g.gz.weak && !g.gz.word) { add(g.i, g.i + g.n, ENT_TYPES[g.gz.type] ? g.gz.type : 'other', g.gz); } });")
rep("""      nmb.addEventListener('click', function () { openNameEditor(seg.i, seg.i + seg.n, null); });
      links.appendChild(nmb);
    }""", """      nmb.addEventListener('click', function () { openNameEditor(seg.i, seg.i + seg.n, null); });
      links.appendChild(nmb);
    }
    /* 「這是名字？」「斷詞不對？」放在一行小字（跟外部字典一樣），按鈕區不會變成三排 */
    var adj = document.createElement('div'); adj.className = 'extlinks adjlinks';
    var adjLab = document.createElement('span'); adjLab.textContent = '調整'; adj.appendChild(adjLab);
    if (typeof nmb !== 'undefined' && nmb && nmb.parentNode === links) { links.removeChild(nmb); nmb.className = 'ext adjbtn'; adj.appendChild(nmb); }
    if (typeof openSegEditor === 'function' && /[\\u0E01-\\u0E2E]/.test(seg.t)) {
      var sgb = document.createElement('button'); sgb.type = 'button'; sgb.className = 'ext adjbtn'; sgb.textContent = '斷詞不對？'; sgb.setAttribute('aria-label', '這個詞切得不對：合起來或拆開');
      sgb.addEventListener('click', function () { openSegEditor(seg); });
      adj.appendChild(sgb);
    }""")
rep("    pop.appendChild(links); pop.appendChild(extl);", "    pop.appendChild(links); pop.appendChild(extl);\n    if (adj.childNodes.length > 1) { pop.appendChild(adj); }")
rep("""    <div class="setrow fbrow">
      <div class="setlabel">備份與還原""", """    <div class="setrow fbrow">
      <div class="setlabel">我的斷詞<span class="sethelp">查詞時按「斷詞不對？」，可以把切開的字合成一個詞，或把黏在一起的詞拆開；所有文件都會照這樣斷。<br><span id="mySegCount"></span></span></div>
      <ul class="mynames" id="mySegList" hidden></ul>
    </div>
    <div class="setrow fbrow">
      <div class="setlabel">備份與還原""")
rep("  function armed(btn, label, confirmLabel, action) {\n", open(os.path.join(D, "setui_ui.js"), encoding="utf-8").read() + open(os.path.join(D, "move_ui.js"), encoding="utf-8").read() + "  renderMySeg();\n  if (myWords.length || mySplits.length) { gazBuild(); if (state.text) { segs = segment(state.text); renderText(); } }\n  function armed(btn, label, confirmLabel, action) {\n")


# ---------- 歡迎視窗：可以選要不要打開聲調學習模式 ----------
rep("      <h2 id=\"h-welcome\">歡迎！先設定三件事</h2>", "      <h2 id=\"h-welcome\">歡迎來到 <span lang=\"th\">ไทย</span> Reader！<br>先設定四件事：</h2>")
rep("      <p class=\"wnote\">選好就能開始。之後隨時可以按下方的「設定」修改；各頁怎麼用，可以看「設定 → 使用說明」。</p>",
    "      <p class=\"wnote\"><span lang=\"th\">ไทย</span> Reader 是一款讓讀泰文變輕鬆的 App。<br>下面的選項之後隨時可以在「設定」修改。<br>使用說明可以到「設定 → 說明與回饋 → 使用說明」查看。</p>")
rep("""        <div class="seg" role="radiogroup" aria-label="詞義語言" id="wGloss"></div>
      </div>
      <div class="btns"><button type="button" class="primary" id="wDone">開始使用</button></div>""", """        <div class="seg" role="radiogroup" aria-label="詞義語言" id="wGloss"></div>
      </div>
      <div class="setrow">
        <div class="setlabel">聲調學習模式<span class="sethelp">查詞時顯示每個音節的聲調和子音分類，生字卡多一個「聲調」練習分頁。剛開始學泰文的人建議打開。</span></div>
        <div class="seg" role="radiogroup" aria-label="聲調學習模式" id="wTone"></div>
      </div>
      <div class="btns"><button type="button" class="primary" id="wDone">開始使用</button></div>""")
rep("    segButtons($('wGloss'), GLOSS_OPTS, glossLang, function (v) { setGlossLang(v); });\n  }",
    "    segButtons($('wGloss'), GLOSS_OPTS, glossLang, function (v) { setGlossLang(v); });\n    if ($('wTone')) {\n      segButtons($('wTone'), [['0', '關'], ['1', '開']], toneMode ? '1' : '0', function (v) {\n        toneMode = v === '1'; try { localStorage.setItem(TONE_KEY, toneMode ? '1' : '0'); } catch (err) {}\n        if (toneMode) { loadTones().catch(function () {}); }\n        if (typeof renderToneSetting === 'function') { renderToneSetting(); }\n        renderWelcome();\n      });\n    }\n  }")

rep("    setTimeout(function () { try { $('wDone').focus(); } catch (err) {} }, 30);\n  }\n  function closeWelcome() {",
    "    setTimeout(function () { try { $('wDone').focus({ preventScroll: true }); } catch (err) {} var mc = $('welcome').querySelector('.mcard'); if (mc) { mc.scrollTop = 0; } $('welcome').scrollTop = 0; }, 30);\n  }\n  function closeWelcome() {")

# ---------- 雲端同步 ----------
SY = open(os.path.join(D, 'sync_ui.js'), encoding='utf-8').read()
rep('  function armed(btn, label, confirmLabel, action) {\n', SY + '\n  function armed(btn, label, confirmLabel, action) {\n')
rep('''    <div class="setrow fbrow">
      <div class="setlabel">備份與還原''', '''    <div class="setrow fbrow" id="syncRow" hidden>
      <div class="setlabel">雲端同步（Google 雲端硬碟）<span class="sethelp">文件、PDF、筆記、生字卡和設定，存在你自己的 Google 雲端硬碟裡這個 App 專用的隱藏資料夾（不會出現在你的檔案清單，App 也看不到你其他的檔案）。在另一台平板、手機或電腦打開這個 App，連結同一個 Google 帳號，兩邊就會自動合併。<a href="privacy.html" target="_blank" rel="noopener">隱私權政策</a><br><span id="syncState"></span></span></div>
      <div class="btns" id="syncBtns"></div>
      <div id="syncMsg" class="label" aria-live="polite"></div>
    </div>
    <div class="setrow fbrow">
      <div class="setlabel">備份與還原''')

CSS = r'''
/* ---- v1.13 ---- */
.credit.one { font-size: 11px; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#text mark.gsel { background: rgba(13, 107, 134, 0.14); }
.pop .gfocus { scroll-margin-top: 8px; margin-top: 4px; }
.pop .gfocus .sl2:first-child::after { content: '（從這句的其他句型點進來）'; font-weight: 400; }
.pop .gfocus .gcard[open] { border-color: var(--accent); }
.ttwrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 6px 0; }
.ttable { width: auto; min-width: 100%; }
.ttable th, .ttable td { white-space: nowrap; }
.ttable thead th { font-weight: 600; }
.ttable .tmk { font-family: var(--thai); font-size: 18px; line-height: 1; }
.tcell { display: inline-flex; align-items: center; gap: 3px; color: var(--tc); }
.tcell b { font-weight: 700; }
.tcell .tcurve { width: 18px; height: 12px; }
.ttable td.tna { color: var(--muted); }
.ttable.tclick td { padding: 2px; }
.tcellbtn { min-height: 38px; width: 100%; padding: 4px 6px; border: 1.5px solid transparent; border-radius: 8px; background: none; justify-content: center; }
.tcellbtn[aria-pressed="true"] { border-color: var(--accent); background: var(--bg); }
.texhost { margin: 12px 0 4px; }
.texlab { font-weight: 600; margin-bottom: 8px; }
.texrow { display: flex; flex-wrap: wrap; gap: 8px; }
.texw { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; min-width: 76px; padding: 8px 10px; border-radius: 12px; border: 1.5px solid var(--tc); background: var(--card); min-height: 0; }
.texw .texth { font-family: var(--thai); font-size: 24px; line-height: 1.3; color: var(--fg); }
.texw .texr { font-size: 12px; color: var(--tc); }
.texw .texz { font-size: 12.5px; color: var(--muted); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tcls2 { margin: 12px 0; }
.tclsrow { display: flex; align-items: flex-start; gap: 10px; margin: 8px 0; }
.tclsrow .tclsl { position: static; flex: 0 0 auto; font-size: 12px; line-height: 22px; }
.tclsrow .tclst { font-size: 18px; line-height: 1.6; letter-spacing: .06em; }
.tgo { margin-top: 8px; }
.tpword { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.tpgloss { color: var(--muted); font-size: 14px; margin: 2px 0 8px; }
.tpsteps { margin: 6px 0 8px; padding-left: 22px; font-size: 14px; color: var(--muted); }
.tpsteps li.ok::marker { color: var(--accent); }
.tpwhy { margin: 8px 0 12px; }
.tqend { margin-top: 10px; }
.tphead { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 6px 0 4px; font-size: 14px; color: var(--muted); }
.tpwrap { padding: 14px 16px 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); }
.tpwrap > .primary { margin-top: 12px; }
.tpwrap .qwhy { margin-top: 10px; line-height: 1.6; }
.tpwrap .cword { font-size: 44px; }
.vhead .back { flex: 0 0 auto; white-space: nowrap; }
.vhead h1 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pop .adjlinks button.adjbtn { font-size: 13px; min-height: 28px; padding: 0; border: 0; background: none; color: var(--accent); font-weight: 600; }
/* 調整斷詞 */
.segedit { display: flex; flex-direction: column; gap: 8px; }
.segedit .segtitle { font-weight: 600; color: var(--fg); }
.segedit .segctx { color: var(--muted); opacity: .6; }
.segedit .nmprev { white-space: nowrap; overflow: hidden; text-overflow: clip; flex: 1 1 auto; min-width: 0; text-align: center; }
.segedit .segnew { background: color-mix(in srgb, var(--accent) 16%, transparent); border-radius: 6px; padding: 0 3px; }
.segstrip { display: flex; align-items: stretch; flex-wrap: wrap; font-family: var(--thai); font-size: 30px; line-height: 1.6; }
.segch { padding: 0 1px; }
.seggap { min-width: 22px; width: 22px; min-height: 48px; padding: 0; border: 0; background: none; position: relative; border-radius: 6px; }
.seggap::after { content: ''; position: absolute; left: 50%; top: 8px; bottom: 8px; border-left: 2px dashed var(--line); }
.seggap.on::after { border-left: 3px solid var(--accent); }
.seggap.on { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.segundo { align-self: flex-start; min-height: 36px; font-size: 14px; border-radius: 999px; }
.nmtag.segtag-w, .nmtag.segtag-s { background: var(--bg); color: var(--accent); border: 1px solid var(--line); }
/* 設定頁：分組、說明「?」、展開清單 */
.setgrp[hidden], .setmenu[hidden], .setaway { display: none !important; }
.setmenu { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 16px; background: var(--card); overflow: hidden; margin: 4px 0 18px; }
.setmi { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 12px 16px; border: 0; border-radius: 0; background: none; text-align: left; justify-content: space-between; }
.setmi + .setmi { border-top: 1px solid var(--line); }
.setmi .smtx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.setmi .smt { font-size: 17px; font-weight: 600; color: var(--fg); }
.setmi .sms { font-size: 13px; color: var(--muted); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.setmi .smchev { flex: 0 0 auto; width: 20px; height: 20px; fill: none; stroke: var(--muted); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.setgrp > .setrow:first-child { border-top: 0; }
.setlabel .setline { display: flex; align-items: center; flex-wrap: wrap; }
.setlabel .setname { font-weight: 600; }
.qhelp { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; min-height: 18px; min-width: 18px; padding: 0; margin-left: 6px; border-radius: 50%; font-size: 11px; font-weight: 700; line-height: 1; vertical-align: middle; color: var(--muted); background: none; border: 1px solid var(--line); }
.qhelp::before { content: ''; position: absolute; inset: -12px; }
.setstat { font-size: 13px; color: var(--muted); font-weight: 400; margin-top: 2px; line-height: 1.5; }
.setstat:empty { display: none; }
.setlist { width: 100%; }
.setlist > summary { cursor: pointer; color: var(--accent); font-weight: 600; font-size: 14px; min-height: 36px; display: flex; align-items: center; }
.setlist:has(> ul[hidden]) { display: none; }
.shelp .shcard { max-width: 460px; }
.shhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.shhead h2 { margin: 0; font-size: 19px; }
.shhead button { width: 40px; height: 40px; min-height: 40px; padding: 0; border-radius: 50%; font-size: 20px; }
.shbody { margin-top: 10px; font-size: 15px; line-height: 1.75; }
.shbody .entlegend { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
/* 搬家提示 */
.movebox { margin: 4px 0 14px; padding: 14px 16px; border-radius: 14px; border: 1.5px solid var(--accent); background: var(--card); display: flex; flex-direction: column; gap: 8px; }
.movebox .mvhead { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; font-size: 15px; }
.movebox .mvhead b { font-size: 17px; margin-right: 6px; }
.movebox .mvurl { font-weight: 600; word-break: break-all; color: var(--accent); }
.movebox .mvsteps { margin: 0; padding-left: 22px; font-size: 14px; line-height: 1.65; color: var(--fg); }
.movebox .mvbtns { display: flex; flex-wrap: wrap; gap: 10px; }
.movebox .mvbtns a, .movebox .mvbtns button { min-height: 40px; padding: 0 16px; border-radius: 999px; display: inline-flex; align-items: center; text-decoration: none; font-weight: 600; }
.movebox .mvgo { background: var(--accent-fill); color: var(--accent-fill-fg); }
/* 雲端同步 */
.syncerr { color: #c0392b; }
/* 影片：框出字幕 */
body.noscroll { overflow: hidden; }
.vpsheet .cdscroll { display: flex; flex-direction: column; gap: 10px; }
.vptitle { margin: 0; font-size: 20px; padding-right: 8px; }
.vptip { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.6; }
.vpstage { position: relative; width: 100%; max-height: 52vh; margin: 0 auto; touch-action: none; border-radius: 10px; overflow: hidden; background: #000; cursor: crosshair; }
.vpstage canvas { display: block; width: 100%; height: 100%; object-fit: contain; }
.vprect { position: absolute; border: 3px solid #ffd400; border-radius: 6px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, .45); pointer-events: none; }
.vptime { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
.vptime input { flex: 1; }
.vpact { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.vpact button { min-height: 44px; padding: 0 18px; border-radius: 999px; }
/* 讀影片的進度：浮在下方，不會把主頁的東西擠下去 */
.vidbox { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(78px + env(safe-area-inset-bottom, 0px)); width: min(560px, calc(100% - 32px)); z-index: 40; box-shadow: 0 8px 28px rgba(0, 0, 0, .18); }
#vidStop[hidden], #vidRetry[hidden], #vidClose[hidden] { display: none; }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v23 ok')
