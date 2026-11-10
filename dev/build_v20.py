import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 2. 詞義補強 ----------
MEAN = open(os.path.join(D, 'meaning_ui.js'), encoding='utf-8').read()
rep('  function segment(str) {\n', MEAN + '  function segment(str) {\n')
rep('''    out = mergeElong(out);
    return out;
  }
  function segAt(i) {''', '''    out = mergeElong(out);
    out = dictMerge(out);
    return out;
  }
  function segAt(i) {''')
# 專有名詞：字面意思＋翻譯
rep("    sec.appendChild(top); sec.appendChild(help); sec.appendChild(row);\n    return sec;",
    """    sec.appendChild(top); sec.appendChild(help);
    if (!(en.info && en.info.zh)) {
      var cmp = buildComposeRow(en.t); if (cmp) { sec.appendChild(cmp); }
      sec.appendChild(mtRow(en.t, '翻譯'));
    }
    sec.appendChild(row);
    return sec;""")
# 字典查不到的詞：字面意思＋翻譯
rep("    else { var no = document.createElement('div'); no.textContent = '內建字典裡沒有這個詞，可以用下面的按鈕查。'; wrapD.appendChild(no); }",
    """    else {
      var no = document.createElement('div'); no.textContent = '內建字典裡沒有這個詞。'; wrapD.appendChild(no);
      if (/[\\u0E01-\\u0E2E]/.test(key0)) {
        var cmp0 = buildComposeRow(key0); if (cmp0) { wrapD.appendChild(cmp0); }
        if (!entityAt(seg.i)) { wrapD.appendChild(mtRow(key0, '翻譯')); }
      }
    }""")
# 機構名稱被空格切開（กรมส่ง เสริมการค้า）：前後接起來是字典裡的詞，就跨過空格
rep("        var e1 = cutEnd(r, r.segs[k2]), nAfter = 0;",
    """        var e1 = cutEnd(r, r.segs[k2]), nAfter = 0;
        if (e1 === r.e && (type === 'org' || type === 'plan')) {
          var nxr = runAfter(r);
          if (nxr) { var lsg = segs[r.segs[r.segs.length - 1]], fsg = segs[nxr.segs[0]]; if (zhOfEntry(lsg.t + fsg.t)) { e1 = cutEnd(nxr, nxr.segs[0]); } }
        }""")
# 內建名單加上地名、機關（Wikidata）
pf = os.path.join(D, 'dictin', 'places.txt')
if os.path.exists(pf):
    pl = open(pf, encoding='utf-8').read().strip()
    assert '</' not in pl
    i = s.index('<script type="text/plain" id="celebdata">')
    j = s.index('</script>', i)
    s = s[:j] + '\n' + pl + s[j:]

# ---------- 4. 工具框：少一點框框 ----------
rep("""    var sep = head.querySelector('.toolbar .sep'); if (sep) { sep.remove(); }
  })();""", """    var sep = head.querySelector('.toolbar .sep'); if (sep) { sep.remove(); }
    var tb = head.querySelector('.toolbar'), seg = document.createElement('div');
    seg.className = 'toolseg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', '工具');
    Array.prototype.slice.call(tb.querySelectorAll('.tool')).forEach(function (b, k) { if (!k) { tb.insertBefore(seg, b); } seg.appendChild(b); });
    var cl = $('clear'); if (cl && !cl.querySelector('svg')) { cl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg><span class="cl-t">清除全部</span>'; cl.setAttribute('aria-label', '清除全部筆記'); }
  })();""")
rep("""    $('vbZoom').textContent = zoomLabel() + (pdf ? (pagedOn() ? '・翻頁' : '・捲動') : '') + ' ▾';""",
    """    $('vbZoom').innerHTML = '<span class="vbz-main"></span><span class="vbz-mode"></span><span class="vbz-c" aria-hidden="true">▾</span>';
    $('vbZoom').querySelector('.vbz-main').textContent = zoomLabel();
    $('vbZoom').querySelector('.vbz-mode').textContent = pdf ? (pagedOn() ? '・翻頁' : '・捲動') : '';""")
rep("['system', '蘋方（系統預設）',", "['system', '蘋方（預設）',")

CSS = r'''
/* ---- v1.10 工具框：少框線、分段按鈕 ---- */
.toprow { padding: 6px 8px 0; gap: 4px; }
.toprow .viewbar button, .histbtns button { border-color: transparent; background: transparent; }
.toprow .viewbar button:hover, .histbtns button:hover:not(:disabled) { background: var(--bg); }
.toprow .vb-zoom { font-weight: 600; padding: 0 10px; color: var(--fg); }
.toprow .vbz-mode { color: var(--muted); font-weight: 500; }
.toprow .vbz-c { margin-left: 4px; color: var(--muted); font-size: 12px; }
.toprow .vb-arrow { color: var(--accent); }
.toprow .vb-page { min-width: 58px; color: var(--muted); }
.toprow .vb-sep { display: none; }
.histbtns { gap: 2px; }
.histbtns .iconbtn { color: var(--fg); }
.histbtns #clear { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-weight: 500; padding: 0 10px; }
.histbtns #clear svg { width: 17px; height: 17px; }
.toolseg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 12px; background: var(--bg); flex: 0 0 auto; }
.workbox .toolbar .toolseg .tool { border: 0; background: transparent; min-height: 38px; padding: 0 16px; border-radius: 9px; font-size: 15px; color: var(--muted); }
.workbox .toolbar .toolseg .tool[aria-pressed="true"] { background: var(--card); color: var(--fg); font-weight: 700; box-shadow: 0 1px 3px rgba(0, 0, 0, .14), 0 0 0 1px var(--line); }
.workbox .toolbar { padding: 6px 8px 8px; gap: 10px; align-items: center; }
.workbox .toolbar #pencil { border: 0; background: transparent; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); font-weight: 500; padding: 0 4px; min-height: 38px; }
.workbox .toolbar #pencil::after { content: ""; flex: 0 0 auto; width: 38px; height: 22px; border-radius: 11px; background: var(--line) radial-gradient(circle at 11px 50%, #fff 8px, transparent 8.6px); transition: background .15s; }
.workbox .toolbar #pencil[aria-pressed="true"] { color: var(--fg); }
.workbox .toolbar #pencil[aria-pressed="true"]::after { background: var(--accent-fill) radial-gradient(circle at 27px 50%, #fff 8px, transparent 8.6px); }
.toolopts .ob, .subbar .stylebar .sb { border-color: transparent; background: var(--bg); }
.toolopts .ob[aria-pressed="true"], .subbar .stylebar .sb[aria-pressed="true"] { background: var(--card); box-shadow: 0 0 0 1.5px var(--accent); color: var(--accent); }
.subbar .stylebar .sb { min-height: 34px; border-radius: 999px; }
.toolopts .ob { min-height: 34px; }
/* 朗讀：播放鍵小一點 */
.player .iconbtn.play { width: 32px; min-width: 32px; height: 32px; min-height: 32px; }
.player .iconbtn.play svg { width: 16px; height: 16px; }
.player .iconbtn:not(.play) { width: 32px; min-width: 32px; height: 32px; min-height: 32px; }
.player .iconbtn:not(.play) svg { width: 15px; height: 15px; }
/* 我的顏色：外面三格 */
.cpop .cp-sec { font-size: 13px; font-weight: 600; color: var(--muted); }
.cpop .cp-favs { display: flex; gap: 12px; padding: 2px 3px 8px; border-bottom: 1px solid var(--line); }
.cpop .cp-slot { position: relative; width: 40px; height: 40px; min-height: 40px; padding: 0; border-radius: 50%; background: var(--sw); border: 3px solid var(--card); box-shadow: 0 0 0 1px var(--line); }
.cpop .cp-slot.sel { box-shadow: 0 0 0 3px var(--accent); }
.cpop .cp-slotn { position: absolute; right: -7px; bottom: -7px; width: 18px; height: 18px; border-radius: 50%; background: var(--card); border: 1px solid var(--line); color: var(--muted); font-size: 11px; line-height: 16px; text-align: center; font-weight: 600; }
.cpop.slotting .cp-grid .cp-sw { box-shadow: 0 0 0 1px var(--line), 0 0 0 4px rgba(115, 148, 136, .18); }
/* 字面意思、翻譯 */
.compose { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px; margin-top: 8px; font-size: 15px; }
.compose .cmp-l, .mtrow .mt-l { flex: 0 0 auto; font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; line-height: 20px; }
.compose .cmp-part { display: inline-flex; align-items: baseline; gap: 4px; }
.compose .cmp-th { font-family: var(--thai); font-size: 16px; }
.compose .cmp-zh { color: var(--muted); }
.compose .cmp-plus { color: var(--muted); font-size: 13px; }
.mtrow { display: flex; align-items: baseline; gap: 8px; margin-top: 8px; font-size: 16px; font-weight: 600; }
.mtrow.loading .mt-v { color: var(--muted); font-weight: 400; font-size: 14px; }
.mtrow[hidden] { display: none; }

/* ---- 手機：按鈕跟著畫面縮小，不要掉到第二行 ---- */
@media (max-width: 600px) {
  button { font-size: 15px; padding: 0 12px; }
  .homeadd { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .homeadd > * { justify-content: center; padding: 0 6px; font-size: 14px; white-space: nowrap; min-width: 0; }
  .vhead #openExport { padding: 0 10px; font-size: 14px; }
  .vh-acts { gap: 4px; }
  .ttsbar { gap: 6px; }
  .ttsbar #slow, .ttsbar #translateAll { padding: 0 10px; font-size: 14px; min-height: 40px; }
  .toprow .vbz-mode { display: none; }
  .toprow .vb-page { min-width: 48px; padding: 0 4px; }
  .toprow .vb-arrow { width: 30px; }
  .histbtns #clear .cl-t { display: none; }
  .histbtns #clear { width: 34px; padding: 0; justify-content: center; }
  .workbox .toolbar #pencil { display: none; }
  .workbox .toolbar .toolseg { flex: 1 1 auto; }
  .workbox .toolbar .toolseg .tool { flex: 1 1 0; padding: 0 6px; font-size: 14px; }
  .seg button { padding: 0 11px; font-size: 13.5px; }
  .subbar { gap: 6px 10px; }
  .toolopts .ob { padding: 0 10px; }
  .subbar { flex-wrap: nowrap; padding-left: 8px; padding-right: 8px; }
  .subbar .stylebar, .subbar .toolopts { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding: 3px 2px 4px; }
  .subbar .stylebar::-webkit-scrollbar, .subbar .toolopts::-webkit-scrollbar { display: none; }
  .subbar .stylebar > *, .subbar .toolopts > * { flex: 0 0 auto; }
  .subbar .stylebar, .subbar .toolopts { -webkit-mask-image: linear-gradient(to right, #000 85%, transparent); mask-image: linear-gradient(to right, #000 85%, transparent); }
  #fontGroup { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 380px) {
  .homeadd > * { font-size: 13px; }
  .ttsbar #slow, .ttsbar #translateAll { padding: 0 8px; font-size: 13px; }
}
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v20 ok')
