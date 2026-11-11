import os, re, json
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:140]); s = s.replace(old, new)
ANCHOR = '  function armed(btn, label, confirmLabel, action) {\n'

# ---------- 英文對照（零件字串都在這裡登記，最後一起放進 I18N_EN） ----------
EN = {}
def T(zh, en):
    EN[zh] = en
    return json.dumps(zh, ensure_ascii=False)

# ======================================================================
# 1.24-A 資料夾：拿掉「未分類」、讀物庫文章自動放進「讀物庫」資料夾
# ======================================================================
rep("  try { var rawL = localStorage.getItem(LIB_KEY); if (rawL) { lib = Object.assign(lib, JSON.parse(rawL)); } } catch (err) {}\n",
"""  try { var rawL = localStorage.getItem(LIB_KEY); if (rawL) { lib = Object.assign(lib, JSON.parse(rawL)); } } catch (err) {}
  if (!Array.isArray(lib.folders)) { lib.folders = []; }
  if (lib.cur === 'none') { lib.cur = 'all'; }
  /* 1.24 讀物庫的文章放進固定的「讀物庫」資料夾（編號固定，兩台裝置同步時才會合在一起）。舊的讀物只在第一次搬一次 */
  var RDF_ID = 'rdlib', RDF_NAME = '讀物庫', RDF_FLAG = 'thai-rdfolder';
  function rdFolderEnsure() {
    if (!lib.folders.some(function (f) { return f.id === RDF_ID; })) { lib.folders.push({ id: RDF_ID, name: RDF_NAME }); }
    return RDF_ID;
  }
  try {
    if (localStorage.getItem(RDF_FLAG) !== '1') {
      var rdMoved = 0;
      lib.docs.forEach(function (d) { if (d.lib && !d.folder) { d.folder = RDF_ID; rdMoved++; } });
      if (rdMoved) { rdFolderEnsure(); localStorage.setItem(LIB_KEY, JSON.stringify(lib)); }
      localStorage.setItem(RDF_FLAG, '1');
    }
  } catch (err) {}
""")
rep("function libFolderName(id) { if (!id) { return '未分類'; } var f = lib.folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '未分類'; }",
    "function libFolderName(id) { if (!id) { return '全部'; } var f = lib.folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '全部'; }")
rep("function libIn(d) { return lib.cur === 'all' || (lib.cur === 'none' ? !d.folder : d.folder === lib.cur); }",
    "function libIn(d) { return lib.cur === 'all' || d.folder === lib.cur; }")
rep("function libTarget() { return (lib.cur === 'all' || lib.cur === 'none') ? '' : lib.cur; }",
    "function libTarget() { return lib.cur === 'all' ? '' : lib.cur; }")
rep("    host.replaceChildren();\n    if (bar) { bar.replaceChildren(); bar.hidden = true; }\n",
    "    host.replaceChildren();\n    if (bar) { bar.replaceChildren(); bar.hidden = true; }\n    if (lib.cur !== 'all' && !lib.folders.some(function (f) { return f.id === lib.cur; })) { lib.cur = 'all'; }\n")
rep(", ['none', '未分類 ' + lib.docs.filter(function (d) { return !d.folder; }).length]]", "]")
rep("var custom = lib.cur !== 'all' && lib.cur !== 'none';", "var custom = lib.cur !== 'all';")
rep("del.textContent = '再按一次確定（文件會移到未分類）';", "del.textContent = " + T('再按一次確定（裡面的文件不會刪，會留在「全部」）', 'Tap again to confirm (documents inside aren’t deleted; they stay in “All”)') + ";")
rep("$('homeTarget').textContent = '新加入的文件會放進：' + libFolderName(libTarget());",
    "$('homeTarget').textContent = libTarget() ? '新加入的文件會放進：' + libFolderName(libTarget()) : '';")
rep("folder: libTarget(), lib: it.id });", "folder: rdFolderEnsure(), lib: it.id });")
# 搬移選單：沒有資料夾的選項改叫「不放資料夾」
n = s.count("[['', '未分類']]"); assert n == 3, n
s = s.replace("[['', '未分類']]", "[['', " + T('不放資料夾', 'No folder') + "]]")
EN['讀物庫 {n}'] = 'Reading library {n}'

# 生字卡頁
rep("      if (cardFolder !== 'all' && cardFolder !== 'none' && !folders.some(function (f) { return f.id === cardFolder; })) { cardFolder = 'all'; }",
    "      if (cardFolder === 'none' || (cardFolder !== 'all' && !folders.some(function (f) { return f.id === cardFolder; }))) { cardFolder = 'all'; }")
rep("function folderName(id) { if (!id) { return '未分類'; } var f = folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '未分類'; }",
    "function folderName(id) { if (!id) { return '全部'; } var f = folders.filter(function (x) { return x.id === id; })[0]; return f ? f.name : '全部'; }")
rep("function inFolder(c) { return cardFolder === 'all' || (cardFolder === 'none' ? !c.folder : c.folder === cardFolder); }",
    "function inFolder(c) { return cardFolder === 'all' || c.folder === cardFolder; }")
rep("function addTarget() { return (cardFolder === 'all' || cardFolder === 'none') ? '' : cardFolder; }",
    "function addTarget() { return cardFolder === 'all' ? '' : cardFolder; }")
rep(", ['none', '未分類 ' + cards.filter(function (c) { return !c.folder; }).length]]", "]")
rep("host.appendChild(el('div', 'label', '新加入的生字卡會放進：' + folderName(addTarget())));",
    "if (addTarget()) { host.appendChild(el('div', 'label', '新加入的生字卡會放進：' + folderName(addTarget()))); }")
rep("del.textContent = '再按一次確定（卡片會移到未分類）';", "del.textContent = " + T('再按一次確定（裡面的生字卡不會刪，會留在「全部」）', 'Tap again to confirm (flashcards inside aren’t deleted; they stay in “All”)') + ";")
rep("if (cardFolder !== 'all' && cardFolder !== 'none') {\n      var bar = el('div', 'fbar');", "if (cardFolder !== 'all') {\n      var bar = el('div', 'fbar');")
rep("$('info').textContent = '已加入生字卡：「' + seg.t + '」（' + folderName(addTarget()) + '），到下方「生字卡」分頁複習。';",
    "$('info').textContent = '已加入生字卡：「' + seg.t + '」' + (addTarget() ? '（' + folderName(addTarget()) + '）' : '') + '，到下方「生字卡」分頁複習。';")
rep("var tag = '泰文::' + folderName(c.folder).replace(/\\s+/g, '_');", "var tag = '泰文::' + (c.folder ? folderName(c.folder) : '未分類').replace(/\\s+/g, '_');")
rep("srcText(c) + '・' + folderName(c.folder) + '・熟悉度 '", "srcText(c) + (c.folder ? '・' + folderName(c.folder) : '') + '・熟悉度 '")

# 使用說明（中文）
rep("'點「全部」「未分類」或自己建的資料夾，下面只列出那個資料夾的文件。'", "'點「全部」或自己建的資料夾，下面只列出那個資料夾的文件。從讀物庫打開的文章，會自動放進「讀物庫」資料夾。'")
rep("'刪除要按兩次才會刪；裡面的文件不會被刪，會移到「未分類」。'", "'刪除要按兩次才會刪；裡面的文件不會被刪，會留在「全部」。'")

# ======================================================================
# 1.24-B 週目標：取代死板的「連續幾天」
# ======================================================================
rep("  function todayStats() {\n", """  /* 1.24 週目標：本週（週一到週日）有幾天有學。漏一天不會歸零，這週沒達標也不扣任何東西 */
  var WEEKGOAL_KEY = 'thai-week-goal';
  function weekGoal() { var g = parseInt(lsGetJ(WEEKGOAL_KEY, 4), 10); return g >= 1 && g <= 7 ? g : 4; }
  function weekDays() {
    var set = {}; daysLog().forEach(function (k) { set[k] = 1; });
    var t = new Date(); t.setHours(12, 0, 0, 0);
    var back = (t.getDay() + 6) % 7, n = 0;
    for (var i = 0; i <= back; i++) { var d = new Date(t.getTime()); d.setDate(d.getDate() - i); if (set[dayKey(d.getTime())]) { n++; } }
    return n;
  }
  function todayStats() {
""")
rep("streak: streakDays(), best: bestStreak() };", "streak: streakDays(), best: bestStreak(), days: daysLog().length, week: weekDays() };")
a = s.index('  var QUEST = ['); b = s.index('  var QUEST_TXT', a)
blk = s[a:b]; assert blk.count("['best', ") == 6, blk.count("['best', ")
s = s[:a] + blk.replace("['best', ", "['days', ") + s[b:]
rep("best: ['連續學 ', ' 天']", "days: ['累計學 ', ' 天']")
EN['累計學 {n} 天'] = 'Study on {n|day|days} in total'
rep("""    var fl = el('span', 'lqflame' + (qs.st.streak ? ' on' : '')); fl.innerHTML = ICON_FLAME; fl.appendChild(el('span', 'lqfn', String(qs.st.streak)));
    fl.setAttribute('aria-label', '連續學習 ' + qs.st.streak + ' 天'); fl.setAttribute('title', '連續學習 ' + qs.st.streak + ' 天');
    b.appendChild(fl);""",
"""    var wg = weekGoal(), wk = qs.st.week;
    var fl = el('span', 'lqweek' + (wk >= wg ? ' on' : ''));
    fl.appendChild(el('span', 'lqwk', """ + T('本週', 'This week') + """));
    var wn = el('span', 'lqwn'); wn.appendChild(el('b', '', String(wk))); wn.appendChild(document.createTextNode('/' + wg)); fl.appendChild(wn);
    fl.setAttribute('aria-label', '本週學習 ' + wk + ' 天，目標 ' + wg + ' 天'); fl.setAttribute('title', '本週學習 ' + wk + ' 天，目標 ' + wg + ' 天');
    b.appendChild(fl);""")
EN['本週學習 {n} 天，目標 {n} 天'] = 'Studied {n|day|days} this week; goal {n|day|days}'
rep("[st.streak, '天', '連續學習・最長 ' + st.best + ' 天']", "[st.week, '/ ' + weekGoal() + ' 天', '本週學習・連續 ' + st.streak + ' 天']")
EN['/ {n} 天'] = '/ {n|day|days}'
EN['本週學習'] = 'This week'
EN['連續 {n} 天'] = '{n|day|days} streak'
rep("    body.appendChild(grid);\n", """    body.appendChild(grid);
    var wkTile = grid.children[2];
    var gr = el('div', 'lqgoal'); gr.appendChild(el('span', 'lqgl', """ + T('每週目標', 'Weekly goal') + """));
    var gs = el('div', 'seg'); gs.setAttribute('role', 'radiogroup'); gs.setAttribute('aria-label', '每週目標'); gr.appendChild(gs);
    function goalSeg() {
      segButtons(gs, [['3', '3 天'], ['4', '4 天'], ['5', '5 天'], ['6', '6 天']], String(weekGoal()), function (v) {
        lsSetJ(WEEKGOAL_KEY, +v); goalSeg();
        var u = wkTile && wkTile.querySelector('.lqsn span'); if (u) { u.textContent = '/ ' + weekGoal() + ' 天'; }
        renderToday();
      });
    }
    goalSeg(); body.appendChild(gr);
""")
rep("連續學習：那天有打開文件或複習就算。'", "學習天數：那天有打開文件或複習就算，每週一重新計算本週。'")
EN['讀文章：打開過的不同文件。記熟：複習後預估能記住 21 天以上的生字。學習天數：那天有打開文件或複習就算，每週一重新計算本週。'] = 'Articles: different documents you have opened. Mastered: words you’re expected to remember for 21+ days. Study days: any day you open a document or review counts. The week restarts on Monday.'
rep("""    var sk = typeof streakDays === 'function' ? streakDays() : 0;
    if (sk >= 2) { box.appendChild(el('div', 'rs-k', '已經連續學習 ' + sk + ' 天')); }""",
"""    var wkd = typeof weekDays === 'function' ? weekDays() : 0, wkg = typeof weekGoal === 'function' ? weekGoal() : 4;
    if (wkd >= 1) { box.appendChild(el('div', 'rs-k', wkd >= wkg ? '本週目標達成：' + wkd + ' / ' + wkg + ' 天' : '本週 ' + wkd + ' / ' + wkg + ' 天')); }""")
EN['本週目標達成：{n} / {n} 天'] = 'Weekly goal reached: {n} / {n|day|days}'
EN['本週 {n} / {n} 天'] = '{n} of {n|day|days} this week'
rep("'thai-swipe-tip'];", "'thai-swipe-tip', 'thai-week-goal'];")
# 使用說明（中文）
rep("'一共 5 章、30 關，照順序一關一關過：讀文章、存生字、複習、連續學習、記熟生字。', '卡片上是現在這一關的目標和進度條，右邊的火焰是連續學習幾天。', '點卡片打開「學習紀錄」：讀過幾篇、生字幾個（記熟幾個）、連續幾天、複習幾次，還有每一章的關卡。', '過關時回到主頁會跳出慶祝；連續天數斷掉也不會把已經過的關收回。'],\n        tip: '那天有打開文件或複習，就算「有學」。' }",
    "'一共 5 章、30 關，照順序一關一關過：讀文章、存生字、複習、累計學習天數、記熟生字。', '卡片上是現在這一關的目標和進度條，右邊是「本週」學了幾天（目標一開始是每週 4 天）。', '點卡片打開「學習紀錄」：讀過幾篇、生字幾個（記熟幾個）、本週學了幾天、複習幾次，還有每一章的關卡。每週目標也可以在這裡改（3 到 6 天）。', '過關時回到主頁會跳出慶祝；某一天沒學、這週沒達標，都不會扣任何東西，也不會把已經過的關收回。'],\n        tip: '那天有打開文件或複習，就算「有學」。每週一重新計算。' }")

# ======================================================================
# 1.24-C 打開文章時：這篇有幾個「快忘記」的生字
# ======================================================================
SOFT = r'''  /* 1.24 打開文章時：這篇裡面有幾個「快忘記」的生字（以前複習過、現在到期的）。同一篇一天只提示一次，可以關掉 */
  var SOFT_KEY = 'thai-soft-day';
  var softBox = document.createElement('div'); softBox.id = 'softHint'; softBox.className = 'softhint'; softBox.hidden = true; softBox.setAttribute('role', 'status');
  softBox.innerHTML = '<div class="softrow"><button type="button" class="softmain" id="softMain" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg><span id="softTx"></span></button><button type="button" class="softx" id="softX" aria-label="關閉">×</button></div><div class="softwords" id="softWords" hidden></div>';
  $('docSrc').parentNode.insertBefore(softBox, $('docSrc'));
  $('softMain').addEventListener('click', function () { var w = $('softWords'); w.hidden = !w.hidden; $('softMain').setAttribute('aria-expanded', String(!w.hidden)); });
  $('softX').addEventListener('click', function () { softBox.hidden = true; });
  function softList() {
    if (!state.src || !segs || !segs.length) { return []; }
    var have = {}; segs.forEach(function (g) { if (g && g.t) { have[g.t] = 1; } });
    var t = today0();
    return cards.filter(function (c) { return c.due <= t && (c.last || c.seen) && have[c.w]; });
  }
  function softShow(id) {
    softBox.hidden = true;
    if (!state.src || state.src.id !== id) { return false; }
    var list = softList(); if (!list.length) { return false; }
    var dk = dayKey(), m = lsGetJ(SOFT_KEY, {}), nm = {};
    if (m[id] === dk) { return true; }
    nm[id] = dk; Object.keys(m).forEach(function (k) { if (m[k] === dk) { nm[k] = dk; } }); lsSetJ(SOFT_KEY, nm);
    $('softTx').textContent = '這篇有 ' + list.length + ' 個快忘記的生字';
    var w = $('softWords'); w.replaceChildren(); w.hidden = true; $('softMain').setAttribute('aria-expanded', 'false');
    list.slice(0, 30).forEach(function (c) {
      var b = el('button', 'softchip', c.w); b.type = 'button'; b.lang = 'th';
      b.addEventListener('click', function () { openCardDetail(c.id); });
      w.appendChild(b);
    });
    softBox.hidden = false;
    return true;
  }
  /* PDF 的文字是慢慢讀出來的，所以最多再等兩次 */
  function softTry(id, n) {
    setTimeout(function () {
      if (!state.src || state.src.id !== id) { return; }
      if ((!segs || !segs.length) && n < 2) { softTry(id, n + 1); return; }
      softShow(id);
    }, n === 0 ? 450 : 1400);
  }
  var _openDoc1 = openDoc;
  openDoc = function (id) { var r = _openDoc1.apply(this, arguments); softTry(id, 0); return r; };
'''
EN.update({'已過關': 'cleared', '進行中': 'in progress', '還沒開始': 'not started'})
EN['這篇有 {n} 個快忘記的生字'] = 'This text has {n|word|words} you’re about to forget'

# ======================================================================
# 1.24-D 網頁版第一次打開：先引導加到主畫面（不含「先試用」連結）
# ======================================================================
IG = r'''  /* 1.24 網頁版第一次打開（手機／平板）：先引導加到主畫面。iPhone／iPad 的瀏覽器和主畫面 App 資料是分開的，
     所以要先裝再開始。從主畫面打開、用電腦、或已經按過「開始使用」的人不會看到。 */
  var igEvt = null, igInstalled = false, igMore = false, igCopied = false;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); igEvt = e; if (!igWrap.hidden) { igRender(); } });
  window.addEventListener('appinstalled', function () { igEvt = null; igInstalled = true; if (!igWrap.hidden) { igRender(); } });
  function igPlatform() {
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var android = /Android/i.test(ua);
    var inapp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger|Messenger|Twitter|TikTok|Snapchat|; wv\)/i.test(ua);
    return { ios: ios, android: android, mobile: ios || android, inapp: inapp };
  }
  function igWanted() {
    if (welcomeSeen || syncStandalone()) { return false; }
    try { if (localStorage.getItem('thai-install-skip') === '1') { return false; } } catch (err) {}
    return igPlatform().mobile;
  }
  var IG_ICON = {
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M6 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H18"/></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    open: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M10.5 17.5h3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5h.01M12 12h.01M12 18.5h.01" stroke-width="3"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-8 8M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>'
  };
  var igWrap = document.createElement('div'); igWrap.id = 'installGuide'; igWrap.className = 'modal'; igWrap.hidden = true;
  igWrap.setAttribute('role', 'dialog'); igWrap.setAttribute('aria-modal', 'true'); igWrap.setAttribute('aria-labelledby', 'igTitle');
  document.body.appendChild(igWrap);
  function igSteps(list) {
    var ol = el('ol', 'igsteps');
    list.forEach(function (x) { var li = el('li'); var ic = el('span', 'igic'); ic.innerHTML = IG_ICON[x[0]]; li.appendChild(ic); li.appendChild(el('span', 'igtx', x[1])); ol.appendChild(li); });
    return ol;
  }
  function igCopyLink(btn) {
    var u = location.origin + location.pathname;
    function ok() { igCopied = true; btn.textContent = {{ig_copied}}; }
    function fail() { var inp = el('input', 'igurl'); inp.type = 'text'; inp.readOnly = true; inp.value = u; btn.parentNode.appendChild(inp); inp.focus(); inp.select(); }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(u).then(ok, fail); } else { fail(); } } catch (err) { fail(); }
  }
  function igFinish() {
    try { localStorage.setItem('thai-install-skip', '1'); } catch (err) {}
    igWrap.hidden = true; openWelcome();
  }
  function igRender() {
    var p = igPlatform(), box = el('div', 'mcard igcard');
    var h = el('h2', '', {{ig_title}}); h.id = 'igTitle'; box.appendChild(h);
    if (igInstalled) {
      box.appendChild(el('p', 'igdone', {{ig_done}}));
    } else {
      box.appendChild(el('p', 'igwhy', {{ig_why}}));
      if (p.inapp) {
        box.appendChild(el('p', 'igwarn', {{ig_inapp}}));
        box.appendChild(igSteps([['menu', {{ig_s_menu}}], ['out', {{ig_s_out}}], ['add', {{ig_s_then}}]]));
        var cp = el('button', 'igbtn', igCopied ? {{ig_copied}} : {{ig_copy}}); cp.type = 'button';
        cp.addEventListener('click', function () { igCopyLink(cp); });
        var cw = el('div', 'btns'); cw.appendChild(cp); box.appendChild(cw);
      } else if (p.ios) {
        box.appendChild(igSteps([['share', {{ig_i1}}], ['add', {{ig_i2}}], ['open', {{ig_i3}}]]));
      } else if (igEvt) {
        var ib = el('button', 'primary igbtn', {{ig_install}}); ib.type = 'button';
        ib.addEventListener('click', function () {
          var e = igEvt; if (!e) { return; }
          try { e.prompt(); e.userChoice.then(function (r) { if (r && r.outcome === 'accepted') { igInstalled = true; } igEvt = null; igRender(); }); } catch (err) { igEvt = null; igRender(); }
        });
        var iw = el('div', 'btns'); iw.appendChild(ib); box.appendChild(iw);
      } else {
        box.appendChild(igSteps([['menu', {{ig_a1}}], ['add', {{ig_a2}}], ['open', {{ig_a3}}]]));
      }
      box.appendChild(el('p', 'ignote', {{ig_already}}));
      var hp = el('div', 'ighelp');
      var hb = el('button', '', {{ig_trouble}}); hb.type = 'button'; hb.setAttribute('aria-expanded', String(igMore));
      hb.addEventListener('click', function () { igMore = !igMore; igRender(); });
      hp.appendChild(hb);
      if (igMore) {
        var mo = el('div', 'igmore'); mo.appendChild(el('p', '', {{ig_more}}));
        var go = el('button', '', {{ig_go}}); go.type = 'button'; go.addEventListener('click', igFinish);
        var gw = el('div', 'btns'); gw.appendChild(go); mo.appendChild(gw); hp.appendChild(mo);
      }
      box.appendChild(hp);
    }
    igWrap.replaceChildren(box);
  }
  function igOpen() { igRender(); igWrap.hidden = false; }
'''
GUIDE = {
 'ig_title': ('先把 ไทย Reader 加到主畫面', 'Add ไทย Reader to your Home Screen first'),
 'ig_why': ('從主畫面打開，學習紀錄才會存在 App 裡；之後也可以像一般 App 一樣離線使用。', 'Open it from your Home Screen so your progress is saved in the app. It also works offline like any other app.'),
 'ig_done': ('已加到主畫面！請從主畫面打開 ไทย Reader，就可以開始了。', 'Added! Open ไทย Reader from your Home Screen to get started.'),
 'ig_inapp': ('你現在是在 LINE、Instagram 這類 App 內建的瀏覽器裡，這裡沒辦法加到主畫面。請先換成 Safari（iPhone／iPad）或 Chrome（Android）打開。', 'You’re in the built-in browser of an app like LINE or Instagram, which can’t add apps to the Home Screen. Please reopen this page in Safari (iPhone/iPad) or Chrome (Android).'),
 'ig_s_menu': ('點右上角的「⋯」或分享圖示', 'Tap “⋯” or the share icon at the top right'),
 'ig_s_out': ('選「用 Safari 開啟」（Android：「用 Chrome 開啟」）', 'Choose “Open in Safari” (Android: “Open in Chrome”)'),
 'ig_s_then': ('在新打開的瀏覽器裡，照著畫面加到主畫面', 'In the browser that opens, follow the steps to add it to your Home Screen'),
 'ig_copy': ('複製網址', 'Copy link'),
 'ig_copied': ('已複製，可以貼到 Safari 或 Chrome', 'Copied; paste it into Safari or Chrome'),
 'ig_i1': ('點瀏覽器的「分享」圖示（iPhone 在下方、iPad 在上方）', 'Tap the browser’s “Share” icon (at the bottom on iPhone, at the top on iPad)'),
 'ig_i2': ('往下滑，點「加入主畫面」', 'Scroll down and tap “Add to Home Screen”'),
 'ig_i3': ('點右上角的「加入」，然後回到主畫面，點 ไทย Reader 的圖示打開', 'Tap “Add” at the top right, then go to your Home Screen and tap the ไทย Reader icon'),
 'ig_install': ('安裝到主畫面', 'Install to Home Screen'),
 'ig_a1': ('點右上角的「⋮」選單', 'Tap the “⋮” menu at the top right'),
 'ig_a2': ('點「安裝應用程式」或「加到主畫面」', 'Tap “Install app” or “Add to Home screen”'),
 'ig_a3': ('回到主畫面，點 ไทย Reader 的圖示打開', 'Go to your Home Screen and tap the ไทย Reader icon'),
 'ig_already': ('已經加過了？請從主畫面的圖示打開，不要在這裡繼續。', 'Already added it? Open it from the Home Screen icon instead of continuing here.'),
 'ig_trouble': ('安裝有問題？', 'Trouble installing?'),
 'ig_more': ('① 請確認用的是 Safari（iPhone／iPad）或 Chrome（Android）。② 還是裝不起來的話，可以先在這個瀏覽器使用；但這裡的資料不會自動出現在主畫面的 App，之後要用「設定」裡的備份或雲端同步搬過去。', '① Make sure you’re using Safari (iPhone/iPad) or Chrome (Android). ② If it still won’t install, you can use it in this browser for now. The data here won’t appear automatically in the Home Screen app; later, move it over with Backup or Cloud sync in Settings.'),
 'ig_go': ('先在這個瀏覽器使用', 'Use it in this browser for now'),
}
for k, (zh, en) in GUIDE.items():
    EN[zh] = en
IG = re.sub(r'\{\{(\w+)\}\}', lambda m: json.dumps(GUIDE[m.group(1)][0], ensure_ascii=False), IG)
rep("  if (!welcomeSeen) { openWelcome(); }\n", "  if (!welcomeSeen) { if (igWanted()) { igOpen(); } else { openWelcome(); } }\n")
s = s.replace(ANCHOR, SOFT + IG + ANCHOR, 1)

# ======================================================================
# CSS
# ======================================================================
CSS = '''
/* 1.24 週目標、快忘記提示、安裝引導 */
#homeTarget:empty { display: none; }
.lqweek { flex: none; display: flex; flex-direction: column; align-items: center; line-height: 1.15; min-width: 38px; color: var(--muted); }
.lqweek .lqwk { font-size: 11px; font-weight: 600; }
.lqweek .lqwn { font-size: 13px; font-variant-numeric: tabular-nums; }
.lqweek .lqwn b { font-size: 17px; font-weight: 800; color: var(--fg); }
.lqweek.on, .lqweek.on .lqwn b { color: var(--accent); }
.lqgoal { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: -6px 0 16px; }
.lqgl { font-size: 13.5px; color: var(--muted); }
.lqgoal .seg { flex: 0 1 auto; }
.softhint { margin: 0 0 10px; border-radius: 12px; background: color-mix(in srgb, #d9733b 11%, var(--card)); }
.softhint[hidden], .softwords[hidden] { display: none; }
.softrow { display: flex; align-items: center; }
.softmain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 4px 0 12px; border: 0; border-radius: 12px; background: transparent; color: var(--fg); font-size: 14.5px; text-align: left; }
.softmain svg { width: 18px; height: 18px; flex: none; fill: none; stroke: #d9733b; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.softx { flex: none; width: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--muted); font-size: 22px; }
.softwords { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 12px; }
.softchip { min-height: 36px; padding: 0 12px; border: 1px solid var(--line); border-radius: 18px; background: var(--card); font-family: var(--thai); font-size: 17px; color: var(--fg); }
.igcard h2 { margin: 0 0 8px; font-size: 21px; line-height: 1.4; }
.igwhy { margin: 0 0 14px; color: var(--muted); font-size: 14.5px; line-height: 1.6; }
.igsteps { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.igsteps li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); font-size: 15px; line-height: 1.5; }
.igic { flex: none; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.igic svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.igwarn { margin: 0 0 12px; padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, #d9733b 14%, var(--card)); font-size: 14.5px; line-height: 1.6; }
.igdone { margin: 8px 0 4px; font-size: 16px; line-height: 1.6; }
.ignote { margin: 4px 0 0; color: var(--muted); font-size: 13.5px; text-align: center; }
.igbtn { width: 100%; min-height: 48px; }
.igurl { width: 100%; margin-top: 8px; }
.ighelp { margin-top: 6px; text-align: center; }
.ighelp > button { min-height: 40px; border: 0; background: transparent; color: var(--muted); font-size: 13.5px; text-decoration: underline; }
.igmore { margin-top: 4px; padding: 12px; border-radius: 12px; background: var(--bg); color: var(--muted); font-size: 13.5px; line-height: 1.65; text-align: left; }
.igmore p { margin: 0; }
.igmore .btns { margin-top: 10px; }
'''
rep('</style>', CSS + '</style>')

# ======================================================================
# 英文對照表：放進 I18N_EN
# ======================================================================
a = s.index('  var I18N_EN = '); b = s.index(';\n', a)
data = json.loads(s[a + len('  var I18N_EN = '):b])
for k, v in EN.items():
    data[k] = v
s = s[:a] + '  var I18N_EN = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[b:]

open(src, 'w', encoding='utf-8').write(s)
print('v33 ok')
