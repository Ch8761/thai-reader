  /* ==== 1.41：匯出 CSV／Markdown／JSON（Notion、Obsidian、Excel），從 CSV 加入生字卡，文件匯出成 Markdown ==== */
  function csvCell(v) { var s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function mdCell(v) { return String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim(); }
  function isoDay(t) { if (!t) { return ''; } var d = new Date(t); return isNaN(d) ? '' : d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function cxCsv(list) {
    var head = CX_EN ? ['Word', 'Romanization', 'Part of speech', 'Meaning (Chinese)', 'Meaning (English)', 'My note', 'Example', 'Source', 'Folder', 'Added', 'Last reviewed']
      : ['單字', '拼音', '詞性', '中文意思', '英文意思', '我的筆記', '例句', '來源', '資料夾', '加入日期', '上次複習'];
    var rows = [head].concat(list.map(function (c) {
      var g = glossSnapshot(c.w);
      return [c.w, c.rom || g.rom || '', c.pos || '', g.zh || c.zh || '', g.en || c.en || '', c.my || '', c.sent || '', srcText(c), c.folder ? folderName(c.folder) : '', isoDay(c.added), lastIso(c)];
    }));
    /* 開頭加 BOM，Excel 打開才不會變亂碼 */
    return '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }
  function cxMd(list) {
    var out = ['# ' + cxL('泰文生字卡', 'Thai flashcards'), '', isoDay(Date.now()) + ' · ' + list.length + cxL(' 張', ' cards'), ''];
    out.push(CX_EN ? '| Word | Romanization | Meaning | Example | Source |' : '| 單字 | 拼音 | 意思 | 例句 | 來源 |', '| --- | --- | --- | --- | --- |');
    list.forEach(function (c) { out.push('| ' + [c.w, c.rom || '', cxMean(c).join(' / '), c.sent || '', srcText(c)].map(mdCell).join(' | ') + ' |'); });
    return out.join('\n') + '\n';
  }
  function cxJson(list) { return JSON.stringify({ app: 'Thai Reader', kind: 'flashcards', exported: new Date().toISOString(), cards: list }, null, 1); }

  var _cxRender49 = cxRender;
  cxRender = function () {
    _cxRender49.apply(this, arguments);
    var body = $('cxBody'); if (!body) { return; }
    var anchor = body.querySelector('.cxcopy');
    if (cards.length && anchor) {
      [['csv', 'CSV (.csv)', cxL('Excel、Google 試算表、Notion 資料庫都能直接匯入', 'Opens in Excel, Google Sheets, or imports into a Notion database')],
       ['md', 'Markdown (.md)', cxL('放進 Obsidian，或貼到 Notion 就是一個表格', 'Drop into Obsidian, or paste into Notion as a table')],
       ['json', 'JSON (.json)', cxL('完整資料（含複習紀錄），給程式或備份用', 'Full data including review history, for tools or backup')]].forEach(function (x) {
        var b = el('button', 'exfmt'); b.type = 'button'; b.setAttribute('data-fmt', x[0]);
        b.appendChild(el('b', '', x[1])); b.appendChild(el('span', '', x[2]));
        b.addEventListener('click', function () { cxGo(x[0]); });
        body.insertBefore(b, anchor);
      });
    }
    /* 從 CSV 加入生字卡 */
    var sec = el('div', 'cximp');
    sec.appendChild(el('h3', 'cximph', cxL('從 CSV 加入生字卡', 'Add flashcards from CSV')));
    sec.appendChild(el('p', 'label', cxL('第一欄放泰文單字、第二欄放意思就可以；有標題列（單字、意思、拼音、例句）會自動對應。已經有的單字不會重複加。', 'Put the Thai word in the first column and the meaning in the second; a header row (Word, Meaning, Romanization, Example) is matched automatically. Words you already have are skipped.')));
    var lb = el('label', 'filebtn cximpbtn'); lb.appendChild(el('span', '', cxL('選 CSV 檔', 'Choose a CSV file')));
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv,.txt,text/plain'; inp.className = 'vh'; inp.id = 'cxImpFile';
    inp.addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) { cardsFromCsvFile(f); } });
    lb.appendChild(inp); sec.appendChild(lb);
    body.appendChild(sec);
  };
  var _cxGo49 = cxGo;
  cxGo = async function (kind) {
    if (kind !== 'csv' && kind !== 'md' && kind !== 'json') { return _cxGo49.apply(this, arguments); }
    if (cxBusy) { return; }
    var list = cxList(); if (!list.length) { cxMsg(cxL('還沒有生字卡可以匯出。', 'No flashcards to export yet.')); return; }
    cxBusySet(true);
    try {
      var name = 'thai-flashcards-' + ymd(), blob;
      if (kind === 'csv') { blob = new Blob([cxCsv(list)], { type: 'text/csv;charset=utf-8' }); name += '.csv'; }
      else if (kind === 'md') { blob = new Blob([cxMd(list)], { type: 'text/markdown;charset=utf-8' }); name += '.md'; }
      else { blob = new Blob([cxJson(list)], { type: 'application/json' }); name += '.json'; }
      var r = await saveFile(name, blob);
      cxMsg(r === 'declined' ? cxL('已取消。', 'Cancelled.') : cxL('已匯出 ' + list.length + ' 張。如果跳出視窗，請選「儲存到檔案」。', 'Exported ' + list.length + ' cards. If a sheet appears, choose “Save to Files”.'));
    } catch (err) { cxMsg(cxL('匯出失敗：', 'Export failed: ') + String(err && err.message || err).slice(0, 80)); }
    cxBusySet(false);
  };

  /* CSV 解析：支援引號、引號裡的逗號和換行；也接受用 Tab 分隔的檔（Anki、試算表複製） */
  function parseCsv(text) {
    text = String(text || '').replace(/^\ufeff/, '');
    var first = text.split(/\r?\n/).filter(function (l) { return l.trim() && !/^#/.test(l); })[0] || '', sep = (first.split('\t').length > first.split(',').length) ? '\t' : ',';
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else { q = false; } } else { cur += ch; } continue; }
      if (ch === '"' && cur === '') { q = true; } else if (ch === sep) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') { i++; } row.push(cur); rows.push(row); row = []; cur = ''; }
      else { cur += ch; }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }) && !/^#/.test(String(r[0] || '')); });
  }
  function cardsFromRows(rows) {
    if (!rows.length) { return { added: 0, skipped: 0 }; }
    var map = { w: 0, m: 1, rom: -1, ex: -1, en: -1, my: -1 }, h = rows[0].map(function (x) { return String(x).trim().toLowerCase(); }), hasHead = false;
    var keys = { w: /^(單字|单词|泰文|詞|word|thai|front|term)$/, m: /^(意思|中文|中文意思|解釋|meaning|back|definition|translation)$/, rom: /^(拼音|羅馬拼音|romanization|reading|pronunciation)$/, ex: /^(例句|example|sentence)$/, en: /^(英文|英文意思|english)$/, my: /^(我的筆記|筆記|note|notes)$/ };
    Object.keys(keys).forEach(function (k) { var ix = -1; h.forEach(function (x, j) { if (ix < 0 && keys[k].test(x)) { ix = j; } }); if (ix >= 0) { map[k] = ix; hasHead = true; } });
    if (hasHead && map.m === 1 && !keys.m.test(h[1] || '') && map.en >= 0) { map.m = -1; }
    var added = 0, skipped = 0, body = hasHead ? rows.slice(1) : rows, now = Date.now();
    body.forEach(function (r, n) {
      var w = String(r[map.w] || '').split(/<br\s*\/?>/i)[0].replace(/<[^>]+>/g, ' ').trim();
      if (!w || !/[\u0E01-\u0E5B]/.test(w) || w.length > 60) { skipped++; return; }
      if (cardOf(w)) { skipped++; return; }
      var g = glossSnapshot(w), pick = function (k) { return map[k] >= 0 ? String(r[map[k]] || '').replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>/g, '').trim() : ''; };
      var zh = pick('m');
      cards.unshift({ id: (now + n).toString(36) + Math.random().toString(36).slice(2, 6), w: w, rom: pick('rom') || g.rom, pos: g.pos, zh: zh || g.zh, en: pick('en') || g.en, my: pick('my') || '', sent: pick('ex').slice(0, 220), src: cxL('CSV 匯入', 'CSV import'), page: 0, added: now, box: 1, due: today0(), seen: 0, right: 0, folder: addTarget() });
      added++;
    });
    if (added) { saveCards(); try { renderCards(); } catch (err) {} }
    return { added: added, skipped: skipped };
  }
  function cardsFromCsvFile(f) {
    var rd = new FileReader();
    rd.onload = function () {
      var r = cardsFromRows(parseCsv(rd.result));
      cxMsg(r.added ? cxL('已加入 ' + r.added + ' 張生字卡' + (r.skipped ? '（' + r.skipped + ' 行略過：已經有了或不是泰文）' : '') + '。', 'Added ' + r.added + ' flashcards' + (r.skipped ? ' (' + r.skipped + ' rows skipped: already there or not Thai)' : '') + '.')
        : cxL('沒有加入任何卡片：找不到泰文單字，或都已經有了。', 'No cards added: no Thai words found, or they are all there already.'));
      try { cxRender(); var m = $('cxMsg'); if (m && !m.textContent) { m.textContent = ''; } } catch (err) {}
      cxMsg(r.added ? cxL('已加入 ' + r.added + ' 張生字卡' + (r.skipped ? '（' + r.skipped + ' 行略過：已經有了或不是泰文）' : '') + '。', 'Added ' + r.added + ' flashcards' + (r.skipped ? ' (' + r.skipped + ' rows skipped: already there or not Thai)' : '') + '.') : cxL('沒有加入任何卡片：找不到泰文單字，或都已經有了。', 'No cards added: no Thai words found, or they are all there already.'));
    };
    rd.onerror = function () { cxMsg(cxL('讀不到這個檔案。', 'Could not read this file.')); };
    rd.readAsText(f);
  }

  /* ---- 文件匯出成 Markdown：標題、原文網址、螢光筆、註解、這篇的生字、全文 ---- */
  function docMarkdown() {
    var t = state.text || '', name = docName(), d = state.src ? docById(state.src.id) : null, out = ['# ' + name, ''];
    if (d && d.url) { out.push(cxL('原文：', 'Source: ') + d.url); }
    out.push(cxL('匯出日期：', 'Exported: ') + isoDay(Date.now()), '');
    var hl = state.hl.slice().sort(function (a, b) { return a[0] - b[0]; }), bx = state.boxes.filter(function (b) { return b.t && String(b.t).trim(); });
    if (hl.length || bx.length) {
      out.push('## ' + cxL('筆記', 'Notes'), '');
      hl.forEach(function (r) { var s = t.slice(r[0], r[1]).replace(/\s+/g, ' ').trim(); if (s) { out.push('> ' + s, ''); } });
      bx.forEach(function (b) { var at = b.a ? t.slice(b.a[0], b.a[1]).replace(/\s+/g, ' ').trim() : ''; out.push('- ' + (at ? '**' + at + '**：' : '') + String(b.t).replace(/\s+/g, ' ').trim()); });
      if (bx.length) { out.push(''); }
    }
    var mine = cards.filter(function (c) { return c.src === name; });
    if (mine.length) {
      out.push('## ' + cxL('這篇的生字', 'Words from this text'), '', CX_EN ? '| Word | Meaning |' : '| 單字 | 意思 |', '| --- | --- |');
      mine.forEach(function (c) { out.push('| ' + mdCell(c.w) + ' | ' + mdCell(cxMean(c).join(' / ')) + ' |'); });
      out.push('');
    }
    out.push('## ' + cxL('全文', 'Full text'), '', t.replace(/\r/g, ''), '');
    return out.join('\n');
  }
  (function () {
    var go = $('exGo'); if (!go) { return; }
    var b = document.createElement('button'); b.type = 'button'; b.id = 'exMd'; b.textContent = cxL('匯出 Markdown', 'Export Markdown');
    b.title = cxL('給 Obsidian、Notion 用：全文、螢光筆的句子、註解和這篇的生字', 'For Obsidian or Notion: full text, highlighted sentences, notes and words from this text');
    go.parentNode.insertBefore(b, go.nextSibling);
    b.addEventListener('click', async function () {
      if (!state.src) { return; }
      var st = $('exStatus');
      try {
        var nm = (docName().replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'thai-reader') + '.md';
        var r = await saveFile(nm, new Blob([docMarkdown()], { type: 'text/markdown;charset=utf-8' }));
        if (st) { st.textContent = r === 'declined' ? cxL('已取消。', 'Cancelled.') : cxL('已匯出 Markdown。可以放進 Obsidian 的資料夾，或在 Notion 選「匯入 → Markdown」。', 'Markdown exported. Put it in your Obsidian vault, or in Notion choose Import → Markdown.'); }
      } catch (err) { if (st) { st.textContent = cxL('匯出失敗：', 'Export failed: ') + String(err && err.message || err).slice(0, 80); } }
    });
  })();

  /* ---- 查詞視窗：常用詞先顯示最常用的意思（例如 ผม 先「我」再「頭髮」），依逐詞對照的常用詞表排序 ---- */
  function senseScore(e, fix, fixEn) {
    var zh = (e[4] || []).join('；'), en = (e[3] || []).join('; ').toLowerCase(), s = 0;
    if (fix) { fix.replace(/[（(][^）)]*[）)]/g, '').split(/[；;、，,]/).forEach(function (p) { p = p.replace(/[…\s]/g, ''); if (p && zh.indexOf(p) >= 0) { s += 3; } else { Array.prototype.forEach.call(p, function (ch) { if (/[㐀-鿿]/.test(ch) && zh.indexOf(ch) >= 0) { s += 0.5; } }); } }); }
    if (fixEn) { fixEn.toLowerCase().replace(/\([^)]*\)/g, '').split(/[;,]/).forEach(function (p) { p = p.trim(); if (p && new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(en)) { s += 2; } }); }
    return s;
  }
  var _entryBlock49 = entryBlock;
  entryBlock = function (word, list) {
    var fix = typeof GL_FIX !== 'undefined' ? GL_FIX[word] : null, fixEn = typeof GL_FIX_EN !== 'undefined' ? GL_FIX_EN[word] : null;
    if ((fix || fixEn) && list && list.length > 1) {
      var sc = list.map(function (e, i) { return { e: e, i: i, s: senseScore(e, fix, fixEn) }; });
      var best = sc.reduce(function (a, b) { return b.s > a.s ? b : a; }, sc[0]);
      if (best.s > 0 && best.i > 0) { list = [best.e].concat(list.filter(function (e, i) { return i !== best.i; })); }
    }
    return _entryBlock49.call(this, word, list);
  };
