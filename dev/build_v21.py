import os
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 生字卡 v2 ----------
SRS = open(os.path.join(D, 'srs_ui.js'), encoding='utf-8').read()
rep("\n  updateCardButton();\n", "\n  updateCardButton();\n" + SRS + "  updateCardButton();\n")
rep("    if (t === 'cards') { $('cardmsg').textContent = ''; renderCards(); }",
    "    if (t === 'cards') { $('cardmsg').textContent = ''; markCardsSeen(); renderCards(); }\n    else if (typeof updateCardButton === 'function') { updateCardButton(); }")

# ---------- 文字框的三個顏色：再點一次已選的顏色 → 換顏色（像 GoodNotes） ----------
rep("    } else if (el.hasAttribute('data-color')) { setStyle({ color: el.getAttribute('data-color') }); }",
    "    } else if (el.hasAttribute('data-color')) { if (!(typeof favTap === 'function' && favTap('box', el))) { setStyle({ color: el.getAttribute('data-color') }); } }")

# ---------- 查詞視窗的按鈕：小一點、排成一行 ----------
SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'
rep('''    var links = document.createElement('div'); links.className = 'links';
    LOOKUPS.forEach(function (L) {
      var a = document.createElement('a');
      a.className = 'ext'; a.href = L[1](seg.t); a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = '在 ' + L[0] + ' 查';
      links.appendChild(a);
    });''', '''    var links = document.createElement('div'); links.className = 'links';
    var extl = document.createElement('div'); extl.className = 'extlinks';
    var extLab = document.createElement('span'); extLab.textContent = '外部字典'; extl.appendChild(extLab);
    LOOKUPS.forEach(function (L) {
      var a = document.createElement('a');
      a.className = 'ext'; a.href = L[1](seg.t); a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = L[0];
      extl.appendChild(a);
    });''')
rep("    say.type = 'button'; say.className = 'say'; say.textContent = '朗讀這個詞';",
    "    say.type = 'button'; say.className = 'say'; say.innerHTML = '" + SPK + "<span>朗讀</span>'; say.setAttribute('aria-label', '朗讀這個詞');")
rep("      var nmb = document.createElement('button'); nmb.type = 'button'; nmb.className = 'say'; nmb.textContent = '這是名字或劇名？';",
    "      var nmb = document.createElement('button'); nmb.type = 'button'; nmb.className = 'say'; nmb.textContent = '這是名字？'; nmb.setAttribute('aria-label', '這是名字或劇名？存成專有名詞');")
rep("    pop.appendChild(links);\n    if (gs.others)", "    pop.appendChild(links); pop.appendChild(extl);\n    if (gs.others)")

# ---------- 跟讀：正在唸的那段標出來 ----------
rep("    if (tapSel) { marks.push({ s: tapSel[0], e: tapSel[1], c: 'tapsel' }); }",
    "    if (tapSel) { marks.push({ s: tapSel[0], e: tapSel[1], c: 'tapsel' }); }\n    if (typeof ra !== 'undefined' && ra && ra.cur) { marks.push({ s: ra.cur[0], e: ra.cur[1], c: 'reading' }); if (ra.word) { marks.push({ s: ra.word[0], e: ra.word[1], c: 'readword' }); } }")

# ---------- 主頁：清單／方塊兩種排列 ----------
rep('    <div id="homeTarget" class="label"></div>', '''    <div class="homebar"><div id="homeTarget" class="label"></div>
      <div class="viewtoggle" role="radiogroup" aria-label="文件排列方式">
        <button type="button" role="radio" data-hv="list" aria-label="清單" title="清單"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg></button>
        <button type="button" role="radio" data-hv="grid" aria-label="方塊" title="方塊"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg></button>
      </div></div>''')
rep("    list.forEach(function (d) {\n      var li = mk('li', 'doccard' + (state.src && state.src.id === d.id ? ' current' : ''));",
    "    syncHomeView();\n    list.forEach(function (d) {\n      var li = mk('li', 'doccard' + (state.src && state.src.id === d.id ? ' current' : ''));")
rep("      li.appendChild(icon); li.appendChild(open); li.appendChild(side);\n      ul.appendChild(li);",
    """      li.appendChild(icon); li.appendChild(open); li.appendChild(side);
      var more = mk('button', 'dmore'); more.type = 'button'; more.setAttribute('aria-label', d.name + ' 的選項'); more.setAttribute('aria-expanded', 'false');
      more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>';
      more.addEventListener('click', function (e) { e.stopPropagation(); var on = !li.classList.contains('menu'); Array.prototype.forEach.call(document.querySelectorAll('#docList .doccard.menu'), function (x) { x.classList.remove('menu'); }); li.classList.toggle('menu', on); more.setAttribute('aria-expanded', String(on)); });
      li.appendChild(more);
      icon.addEventListener('click', function () { if ($('docList').classList.contains('grid')) { openDoc(d.id); } });
      ul.appendChild(li);""")
rep("  function deleteDoc(id) {", r"""  var HV_KEY = 'thai-home-view', homeView = 'list';
  try { homeView = localStorage.getItem(HV_KEY) || 'list'; } catch (err) {}
  function syncHomeView() {
    $('docList').classList.toggle('grid', homeView === 'grid');
    Array.prototype.forEach.call(document.querySelectorAll('.viewtoggle [data-hv]'), function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-hv') === homeView)); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.viewtoggle [data-hv]'), function (b) {
    b.addEventListener('click', function () { homeView = b.getAttribute('data-hv'); try { localStorage.setItem(HV_KEY, homeView); } catch (err) {} renderHome(); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.doccard.menu')) { Array.prototype.forEach.call(document.querySelectorAll('#docList .doccard.menu'), function (x) { x.classList.remove('menu'); }); } });
  function deleteDoc(id) {""")
# 縮圖畫大一點（方塊模式要用）
rep("vp = page.getViewport({ scale: 160 / vp1.width });", "vp = page.getViewport({ scale: 360 / vp1.width });")
rep("      var url = await idbGet('thumb:' + id);", "      var url = await idbGet('thumb2:' + id);")
rep("          try { idbPut('thumb:' + id, url); } catch (err) {}", "          try { idbPut('thumb2:' + id, url); } catch (err) {}")
s = s.replace("idbDel('ocr:' + id);", "idbDel('ocr:' + id); idbDel('thumb2:' + id);")
rep("'thai-font', 'thai-view', 'thai-tools', 'thai-progress'];", "'thai-font', 'thai-view', 'thai-tools', 'thai-progress', 'thai-home-view'];")

s = s.replace('按「這是名字或劇名？」', '按「這是名字？」')
CSS = r'''
/* ---- v1.11 朗讀：播放鍵不要圓底 ---- */
.player .iconbtn.play { background: transparent; color: var(--accent); width: 34px; min-width: 34px; height: 34px; min-height: 34px; }
.player .iconbtn.play svg { width: 22px; height: 22px; }
.player .iconbtn.play:hover { background: var(--bg); }
/* 查詞視窗：小按鈕一排，外部字典變成文字連結 */
.pop .links { display: flex; flex-wrap: wrap; gap: 6px; }
.pop .links > * { width: auto; min-height: 34px; padding: 0 12px; font-size: 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; grid-column: auto !important; }
.pop .links > * svg { width: 16px; height: 16px; flex: 0 0 auto; }
.pop .extlinks { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; font-size: 13px; color: var(--muted); margin-top: -2px; }
.pop .extlinks a.ext { font-size: 13px; min-height: 0; padding: 0; border: 0; background: none; }
/* 外面的三個顏色：選中的那個下面有小箭頭，提示「再點一次可以換」 */
.sw2.fav, .stylebar .sw.fav { position: relative; }
.sw2.fav[aria-pressed="true"]::after, .stylebar .sw.fav[aria-pressed="true"]::after { content: ""; position: absolute; left: 50%; bottom: -9px; transform: translateX(-50%); border: 4px solid transparent; border-top-color: var(--accent); }
.cpop::before { content: ""; position: absolute; top: -7px; left: var(--arrow, 50%); transform: translateX(-50%) rotate(45deg); width: 12px; height: 12px; background: var(--card); border-left: 1px solid var(--line); border-top: 1px solid var(--line); }
.cpop .cp-cur { width: 22px; height: 22px; border-radius: 50%; background: var(--sw); box-shadow: 0 0 0 1px var(--line); flex: 0 0 auto; }
.cpop .cp-n { font-size: 12px; }

/* ---- 跟讀標示 ---- */
#text mark.reading { background: color-mix(in srgb, var(--accent) 28%, transparent); color: inherit; border-radius: 3px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent); }
#text mark.readword { background: color-mix(in srgb, var(--accent) 45%, transparent); color: inherit; }
#text.pdf mark.reading, #text.pdf mark.readword { color: transparent; mix-blend-mode: multiply; }

/* ---- 生字卡 ---- */
.rprog { display: flex; align-items: center; gap: 10px; margin: 6px 0 10px; }
.rbar { flex: 1; height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.rbar span { display: block; height: 100%; background: var(--accent-fill); border-radius: 3px; transition: width .2s; }
.rnum { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.fcard .fctop { display: flex; align-items: center; justify-content: center; gap: 8px; }
.iconbtn.csay { width: 40px; min-width: 40px; height: 40px; min-height: 40px; border: 0; background: var(--bg); color: var(--accent); }
.iconbtn.csay svg { width: 20px; height: 20px; }
.iconbtn.csay.small { width: 30px; min-width: 30px; height: 30px; min-height: 30px; vertical-align: middle; margin-left: 6px; }
.iconbtn.csay.small svg { width: 16px; height: 16px; }
.linkbtn { border: 0; background: none; color: var(--accent); padding: 0; min-height: 32px; font-size: 14px; font-weight: 600; }
.cmy { margin-top: 6px; font-size: 14px; color: var(--muted); }
.btns.cans .wide, .btns .wide { flex: 1 1 auto; min-width: 200px; }
.btns.grades { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.grade { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 56px; padding: 6px 4px; border-radius: 12px; font-weight: 600; }
.grade .gi { font-size: 12px; font-weight: 500; color: var(--muted); }
.grade.g0 { color: #c0392b; } .grade.g1 { color: #b9770e; } .grade.g2 { color: var(--accent); } .grade.g3 { color: #1e8449; }
:root[data-theme="dark"] .grade.g0 { color: #f1948a; } :root[data-theme="dark"] .grade.g1 { color: #f5cba7; } :root[data-theme="dark"] .grade.g3 { color: #82e0aa; }
.qtypes { margin: 4px 0 12px; }
.qcard { text-align: center; }
.qprompt { font-size: 24px; font-weight: 700; padding: 10px 0; }
.iconbtn.qlisten { width: 64px; min-width: 64px; height: 64px; min-height: 64px; margin: 6px auto; border: 0; background: var(--bg); color: var(--accent); }
.iconbtn.qlisten svg { width: 30px; height: 30px; }
.qopts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.qopt { min-height: 56px; padding: 8px 10px; border-radius: 12px; font-size: 16px; line-height: 1.35; }
.qopt.th { font-family: var(--thai); font-size: 20px; }
.qopt.ok { border-color: #1e8449; background: color-mix(in srgb, #1e8449 14%, var(--card)); color: var(--fg); opacity: 1; }
.qopt.bad { border-color: #c0392b; background: color-mix(in srgb, #c0392b 12%, var(--card)); color: var(--fg); opacity: 1; }
.qopt:disabled { cursor: default; }
.qopt:disabled:not(.ok):not(.bad) { opacity: .55; }
.qfb { margin-top: 12px; font-weight: 700; }
.qfb.ok { color: #1e8449; } .qfb.bad { color: #c0392b; }
.qfb .cw { font-family: var(--thai); font-size: 20px; margin-left: 4px; }
.qdone { text-align: center; padding: 10px 0; }
.qscore { font-size: 44px; font-weight: 800; color: var(--accent); }
.qwrong { list-style: none; padding: 0; margin: 10px auto; max-width: 420px; text-align: left; display: flex; flex-direction: column; gap: 6px; }
.qwrong li { display: flex; gap: 10px; align-items: baseline; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
.qwrong .cw { font-family: var(--thai); font-size: 19px; }
.clist2 { list-style: none; margin: 10px 0 0; padding: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--card); overflow: hidden; }
.clist2 li + li { border-top: 1px solid var(--line); }
.crow { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 0; border-radius: 0; background: transparent; text-align: left; padding: 10px 14px; min-height: 60px; }
.crow:hover { background: var(--bg); }
.crow-l { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; min-width: 0; }
.crow-l .cw { font-family: var(--thai); font-size: 21px; }
.crow-l .crom { font-size: 13px; color: var(--muted); }
.crow-l .cm { flex-basis: 100%; font-size: 14px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crow-r { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.cdots { display: inline-flex; gap: 3px; }
.cdots i { width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
.cdots i.on { background: var(--accent-fill); }
.cdue { font-size: 12px; color: var(--muted); min-width: 56px; text-align: right; }
.crow .chev { color: var(--muted); font-size: 20px; }
@media (max-width: 600px) { .cdue { display: none; } }
/* 單字詳解 */
.cdlayer { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; }
.cdlayer[hidden] { display: none; }
.cdback { position: absolute; inset: 0; background: rgba(20, 24, 22, .38); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }
.cdsheet { position: relative; width: min(680px, 100%); max-height: min(88vh, 900px); background: var(--card); border-radius: 22px 22px 0 0; box-shadow: 0 -10px 40px rgba(0, 0, 0, .2); display: flex; flex-direction: column; }
@media (min-width: 700px) { .cdlayer { align-items: center; } .cdsheet { border-radius: 22px; } }
.cdx { position: absolute; top: 10px; right: 10px; z-index: 2; width: 40px; min-width: 40px; height: 40px; min-height: 40px; padding: 0; border-radius: 50%; font-size: 22px; border: 0; background: var(--bg); }
.cdscroll { overflow-y: auto; padding: 22px 22px calc(22px + env(safe-area-inset-bottom, 0px)); -webkit-overflow-scrolling: touch; }
.cdhead { display: flex; align-items: center; gap: 10px; padding-right: 44px; }
.cdword { margin: 0; font-family: var(--thai); font-size: 38px; line-height: 1.3; }
.cdrom { color: var(--muted); font-size: 15px; margin-top: 2px; }
.cdsec { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
.cdsec h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: .04em; color: var(--muted); }
.cdsec h4 { margin: 14px 0 6px; font-size: 14px; }
.cdpos { margin-bottom: 10px; }
.cdpos-l { display: inline-block; font-size: 12px; font-weight: 700; color: var(--accent); border: 1px solid var(--accent); border-radius: 999px; padding: 0 8px; line-height: 20px; }
.cdsenses { margin: 6px 0 0; padding-left: 22px; display: flex; flex-direction: column; gap: 4px; }
.cdzh { font-size: 17px; margin-right: 8px; }
.cden { font-size: 14px; color: var(--muted); }
.cdmy { width: 100%; box-sizing: border-box; font: inherit; font-size: 16px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); resize: vertical; }
.cdex { padding: 10px 12px; border-radius: 12px; background: var(--bg); margin-bottom: 8px; }
.cdex-th { display: flex; align-items: flex-start; gap: 6px; }
.cdex-th p { margin: 0; flex: 1; font-family: var(--thai); font-size: 19px; line-height: 1.6; }
.cdex-th .csay.small { margin-left: 0; background: var(--card); }
.cwmark { background: color-mix(in srgb, var(--accent) 22%, transparent); color: inherit; border-radius: 3px; padding: 0 1px; }
.cdex-en { font-size: 14px; color: var(--muted); margin-top: 2px; }
.cdex-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-top: 4px; }
.cdex-src { font-size: 12px; color: var(--muted); }
.cdex .mtrow { margin-top: 0; font-size: 15px; }
.cdmeta p { margin: 0 0 6px; }
body.cdopen { overflow: hidden; }

/* ---- 主頁：方塊排列 ---- */
.homebar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.viewtoggle { display: inline-flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--card); border: 1px solid var(--line); flex: 0 0 auto; }
.viewtoggle button { width: 34px; min-width: 34px; height: 30px; min-height: 30px; padding: 0; border: 0; border-radius: 7px; background: transparent; color: var(--muted); display: inline-flex; align-items: center; justify-content: center; }
.viewtoggle button svg { width: 18px; height: 18px; }
.viewtoggle button[aria-checked="true"] { background: var(--bg); color: var(--fg); box-shadow: 0 1px 2px rgba(0, 0, 0, .12); }
.doccard { position: relative; }
.doccard .dmore { display: none; }
#docList.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px 14px; }
#docList.grid .doccard { display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 0; border: 0; background: transparent; box-shadow: none; }
#docList.grid .doccard.current .dicon { box-shadow: 0 0 0 3px var(--accent); }
#docList.grid .dicon { width: 100%; height: auto; aspect-ratio: 3 / 4; border-radius: 10px; font-size: 22px; cursor: pointer; box-shadow: 0 1px 4px rgba(0, 0, 0, .1); }
#docList.grid .dicon.textprev { font-size: 11px; padding: 10px; line-height: 1.5; }
#docList.grid .dopen { padding: 0 30px 0 2px; min-height: 0; }
#docList.grid .dname { font-size: 14px; font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; }
#docList.grid .dmeta { font-size: 12px; }
#docList.grid .dside { display: none; }
#docList.grid .dmore { display: inline-flex; position: absolute; right: -4px; bottom: 18px; width: 32px; min-width: 32px; height: 32px; min-height: 32px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--muted); align-items: center; justify-content: center; }
#docList.grid .dmore svg { width: 18px; height: 18px; }
#docList.grid .doccard.menu .dside { display: flex; flex-direction: column; position: absolute; right: 0; bottom: 54px; z-index: 5; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 8px; box-shadow: 0 10px 28px rgba(0, 0, 0, .18); width: 180px; }
@media (max-width: 600px) { #docList.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
#docList.grid .dicon.thumb img { object-fit: contain; background: #fff; }
.cdsheet section.cdsec { border: 0; border-top: 1px solid var(--line); border-radius: 0; background: none; box-shadow: none; padding: 14px 0 0; margin: 16px 0 0; }
.btns.cans { margin-top: 12px; }
.qfb { margin-bottom: 10px; }
#cardbody .fcard { margin-bottom: 4px; }
'''
rep('</style>', CSS + '</style>')
open(src, 'w', encoding='utf-8').write(s)
print('v21 ok')
