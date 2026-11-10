import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 聲調學習模式 ----------
TONE = open(os.path.join(D, 'tone_ui.js'), encoding='utf-8').read()
rep('  function segment(str) {\n', TONE + '  function segment(str) {\n')
rep('''      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>''', '''      <div class="seg" role="radiogroup" aria-label="中文字體" id="fontGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">聲調學習模式<span class="sethelp">打開後，查詞視窗和生字卡會顯示每個音節的聲調、子音分類和推出聲調的規則；測驗也會出聲調題。</span></div>
      <div class="seg" role="radiogroup" aria-label="聲調學習模式" id="toneGroup"></div>
    </div>''')
rep("'thai-progress', 'thai-home-view'];", "'thai-progress', 'thai-home-view', 'thai-tone-mode'];")
rep("    if (!(seg.gz && en0)) { pop.appendChild(d); }",
    "    if (!(seg.gz && en0)) { pop.appendChild(d); }\n    if (toneMode && !(seg.gz && en0) && /[\\u0E01-\\u0E2E]/.test(seg.t)) { pop.appendChild(buildToneSection(seg.t)); }")

# ---------- 點字和筆記不衝突 ----------
NOTES = open(os.path.join(D, 'notes2_ui.js'), encoding='utf-8').read()
rep('  function segment(str) {\n', NOTES + '  function segment(str) {\n')
rep("    pop.appendChild(links); pop.appendChild(extl);", "    if (seg.w && /[\\u0E01-\\u0E2E]/.test(seg.t)) { pop.appendChild(popNoteButtons(seg)); }\n    pop.appendChild(links); pop.appendChild(extl);")
# 螢光筆模式：點一下（沒有拖）＝查詞；拖過去＝畫螢光筆
rep('''      snapshot();
      var hit = hlAt(a.a);
      if (!a.moved && hit >= 0) { state.hl.splice(hit, 1); } else { addRangeColored(snapRange(a.a, a.b), toolPrefs.hlColor, toolPrefs.hlStyle); }
      renderText();
      save();''', '''      if (!a.moved) {
        var hs = segAt(a.a);
        if (hs && hs.w) { tapSel = [hs.i, hs.i + hs.n]; renderText(); showPop(hs); } else { renderText(); }
        return;
      }
      snapshot();
      addRangeColored(snapRange(a.a, a.b), toolPrefs.hlColor, toolPrefs.hlStyle);
      renderText();
      save();''')
# 手寫：橡皮擦；手指點一下（沒有畫出線）＝查詞
rep("    if (mode === 'ink') {\n      active = { id: e.pointerId, kind: 'ink', s: { w: toolPrefs.inkW, p: [toPage(e)] } };",
    """    if (mode === 'ink' && toolPrefs.inkTool === 'erase') {
      active = { id: e.pointerId, kind: 'erase', hit: false };
      eraseAt(toPage(e), active);
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    } else if (mode === 'ink') {
      active = { id: e.pointerId, kind: 'ink', t0: Date.now(), cx: e.clientX, cy: e.clientY, s: { w: toolPrefs.inkW, p: [toPage(e)] } };""")
rep("""    if (active.kind === 'ink') {
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];""", """    if (active.kind === 'erase') {
      var el2 = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (el2 && el2.length ? el2 : [e]).forEach(function (ev) { eraseAt(toPage(ev), active); });
      return;
    }
    if (active.kind === 'ink') {
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];""")
rep("""    if (a.kind === 'ink') {
      snapshot();""", """    if (a.kind === 'erase') { if (a.hit) { save(); } return; }
    if (a.kind === 'ink') {
      if (Date.now() - a.t0 < 350 && Math.abs(e.clientX - a.cx) + Math.abs(e.clientY - a.cy) < 8) {
        var ti = indexByGeometry(e.clientX, e.clientY), ts = ti >= 0 ? segAt(ti) : null;
        if (ts && ts.w && /[\\u0E01-\\u0E2E]/.test(ts.t)) { redrawInk(); tapSel = [ts.i, ts.i + ts.n]; renderText(); showPop(ts); return; }
      }
      snapshot();""")
rep("    if (a.kind === 'ink') { redrawInk(); }", "    if (a.kind === 'ink') { redrawInk(); }\n    if (a.kind === 'erase' && a.hit) { save(); }")
rep("hl: '從一個詞劃到另一個詞，放開就畫好。點一下畫過的地方可以取消。'", "hl: '從一個詞劃到另一個詞就畫好。點一下詞是查詞，查詞視窗裡可以取消螢光筆。'")
rep("ink: '直接在泰文上寫字或畫線。'", "ink: '直接在泰文上寫字或畫線；手指點一下詞可以查詞。要擦掉就選「橡皮擦」。'")

# ---------- 加入影片 ----------
VID = open(os.path.join(D, 'video_ui.js'), encoding='utf-8').read()
rep("  $('imgfile').addEventListener('change', function () { var fs = this.files; libAddImages(fs); this.value = ''; });",
    """  $('imgfile').addEventListener('change', function () {
    var all = Array.prototype.slice.call(this.files || []);
    var vids = all.filter(function (f) { return /^video\\//.test(f.type) || /\\.(mp4|mov|m4v|webm)$/i.test(f.name); });
    var imgs = all.filter(function (f) { return vids.indexOf(f) < 0; });
    if (imgs.length) { libAddImages(imgs); }
    if (vids.length) { libAddVideo(vids[0]); }
    this.value = '';
  });
""" + VID)
rep('<label class="filebtn">＋ 加入圖片<input type="file" id="imgfile" class="vh" accept="image/*" multiple></label>',
    '<label class="filebtn">＋ 圖片／影片<input type="file" id="imgfile" class="vh" accept="image/*,video/*" multiple></label>')
s = s.replace('「＋ 加入圖片」', '「＋ 圖片／影片」')

CSS = r'''
/* ---- v1.12 聲調 ---- */
.tonesec { margin-top: 8px; }
.tsyls { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 8px; }
.tsyl { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 1px; min-width: 64px; padding: 8px 10px 6px; border-radius: 12px; background: var(--bg); border: 1.5px solid var(--tc); }
.tsyl .tp { font-family: var(--thai); font-size: 22px; line-height: 1.3; }
.tsyl .tr { font-size: 12px; color: var(--muted); }
.tsyl .tt { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; color: var(--tc); }
.tsyl .tt b { font-weight: 700; }
.tcurve { width: 22px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
.tcls { position: absolute; top: -9px; right: -6px; font-size: 11px; font-weight: 700; line-height: 18px; padding: 0 6px; border-radius: 999px; color: #fff; background: var(--cc); font-family: var(--thai), var(--ui); }
.t-M { --tc: #7f8c8d; } .t-L { --tc: #2e86c1; } .t-F { --tc: #c0392b; } .t-H { --tc: #d68910; } .t-R { --tc: #8e44ad; }
.c-m { --cc: #2e86c1; } .c-h { --cc: #c0392b; } .c-l { --cc: #27ae60; }
:root[data-theme="dark"] .t-M { --tc: #b2bec3; } :root[data-theme="dark"] .t-L { --tc: #74b9ff; } :root[data-theme="dark"] .t-F { --tc: #ff7675; } :root[data-theme="dark"] .t-H { --tc: #fdcb6e; } :root[data-theme="dark"] .t-R { --tc: #c39bd3; }
.twhy { margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.6; display: flex; flex-direction: column; gap: 2px; }
.twhy .twp, .qwhy .twp { font-family: var(--thai); font-weight: 700; font-size: 16px; }
.twhy li.exc { color: var(--muted); }
.tdet { margin-top: 6px; font-size: 14px; }
.tdet summary { cursor: pointer; color: var(--accent); font-weight: 600; min-height: 32px; display: flex; align-items: center; }
.ttable { border-collapse: collapse; font-size: 13px; margin: 6px 0; width: 100%; }
.ttable th, .ttable td { border: 1px solid var(--line); padding: 4px 6px; text-align: center; }
.ttable thead th { background: var(--bg); }
.tnote { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin: 6px 0 0; }
.cword.tq .tqhl { color: var(--accent); text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 6px; }
.qprompt.small { font-size: 17px; font-weight: 600; padding: 4px 0 0; }
.qopt.tone { display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--tc); font-weight: 700; }
.qopts:has(.qopt.tone) { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.qwhy { margin-top: 6px; font-weight: 500; font-size: 14px; color: var(--fg); }
/* 查詞視窗：畫螢光筆、加註解 */
.pop .popnotes { display: flex; flex-wrap: wrap; gap: 6px; }
.pop .popnotes button { min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }
.pop .popnotes .pn-dot { width: 12px; height: 12px; border-radius: 3px; }
.pop .popnotes button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
.pop .popnotes svg { width: 15px; height: 15px; }
.pop .links a.ext { border-radius: 999px !important; }
/* 橡皮擦 */
.toolopts .ob.otool { gap: 5px; }
.toolopts .ob.otool svg { width: 16px; height: 16px; }
/* 影片字幕進度 */
.vidbox { padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); display: flex; flex-direction: column; gap: 8px; }
.vidbox[hidden] { display: none; }
.vidbox .vb-row { display: flex; align-items: center; gap: 10px; }
.vidbox .vb-t { flex: 1; font-size: 14px; }
.vidbox .vb-row button { min-height: 34px; font-size: 14px; border-radius: 999px; }
.vidbox .vb-bar { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.vidbox .vb-bar span { display: block; height: 100%; width: 0; background: var(--accent-fill); transition: width .3s; }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v22 ok')
