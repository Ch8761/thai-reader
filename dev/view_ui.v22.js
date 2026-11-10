  /* ---------- 文件的顯示：縮放（含兩指縮放）、上下捲動或左右翻頁、跳頁、記住讀到哪裡 ---------- */
  var VIEW_KEY = 'thai-view', PROG_KEY = 'thai-progress';
  var viewPrefs = { zoom: 'fit', paged: false };
  try { Object.assign(viewPrefs, JSON.parse(localStorage.getItem(VIEW_KEY) || '{}')); } catch (err) {}
  var viewCur = 0, lastDocId = null, pinch = null;
  var ZOOM_OPTS = [['fit', '符合螢幕'], ['width', '符合寬度'], [1.25, '125%'], [1.5, '150%'], [2, '200%']];
  function saveView() { try { localStorage.setItem(VIEW_KEY, JSON.stringify(viewPrefs)); } catch (err) {} }
  function availH() { return Math.max(320, window.innerHeight - 120); }
  function maxPageH() { var m = 0; if (pdf) { pdf.pages.forEach(function (pg) { m = Math.max(m, pg.h); }); } return m || 900; }
  function effZoom() { return viewPrefs.zoom === 'fit' && !pdf ? 'width' : viewPrefs.zoom; }
  function computeScale(avail) {
    var wfit = avail / PAGE_W, z = effZoom();
    if (z === 'fit') { return pdf ? Math.min(wfit, availH() / maxPageH()) : wfit; }
    if (typeof z === 'number' && isFinite(z)) { return wfit * Math.max(0.5, Math.min(4, z)); }
    return wfit;
  }
  function pagedOn() { return !!(viewPrefs.paged && pdf && pdf.pages && pdf.pages.length); }
  function applyPageTransform() {
    var w = $('wrap'), avail = w.clientWidth, x = Math.max(0, (avail - PAGE_W * scale) / 2), y = 0;
    if (pagedOn()) {
      viewCur = Math.max(0, Math.min(pdf.pages.length - 1, viewCur));
      y = -pdf.pages[viewCur].top * scale;
    }
    $('page').style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale + ')';
    w.style.overflowX = PAGE_W * scale > avail + 1 ? 'auto' : 'hidden';
    w.style.overflowY = 'hidden';
  }
  /* layout() 每次排版完都會叫這個 */
  function viewAfterLayout() {
    var sid = state.src && state.src.id;
    var fresh = !!sid && sid !== lastDocId && !$('view-doc').hidden && (state.src.type !== 'pdf' || !!(pdf && pdf.id === sid));
    if (fresh) {
      lastDocId = sid; viewCur = 0;
      var sp0 = loadProg()[sid];
      if (sp0 && typeof sp0.p === 'number' && pdf) { viewCur = Math.max(0, Math.min(pdf.pages.length - 1, sp0.p)); }
    }
    applyPageTransform();
    if (pagedOn()) {
      var pg = pdf.pages[viewCur];
      $('wrap').style.height = Math.ceil(pg.h * scale) + 'px';
      pdf.pages.forEach(function (p, i) { if (Math.abs(i - viewCur) <= 1) { p.visible = true; } else if (Math.abs(i - viewCur) > 2) { p.visible = false; } });
    }
    renderViewBar();
    if (typeof syncUndoButtons === 'function') { syncUndoButtons(); }
    if (fresh) { setTimeout(function () { if (state.src && state.src.id === sid) { restoreProgress(sid); } }, 80); }
  }
  function zoomLabel() {
    var z = effZoom();
    for (var i = 0; i < ZOOM_OPTS.length; i++) { if (ZOOM_OPTS[i][0] === z) { return ZOOM_OPTS[i][1]; } }
    return Math.round((typeof z === 'number' ? z : 1) * 100) + '%';
  }
  function setZoom(z) { viewPrefs.zoom = z; saveView(); var keep = readingSpot(); layout(); if (keep) { goSpot(keep); } }

  /* ---------- 讀到哪裡：第幾頁、頁內的位置 ---------- */
  function wrapTopY() { return $('wrap').getBoundingClientRect().top + window.scrollY; }
  function headOff() { var h = document.getElementById('toolhead'); return (h ? h.offsetHeight : 60) + 12; }
  function readingSpot() {
    if (!state.src || $('view-doc').hidden) { return null; }
    if (pdf) {
      if (pagedOn()) { return { p: viewCur, f: 0 }; }
      var y = (window.scrollY + headOff() - wrapTopY()) / scale, pg = pageAtY(Math.max(0, y)) || pdf.pages[0];
      return { p: pdf.pages.indexOf(pg), f: Math.max(0, Math.min(1, (y - pg.top) / pg.h)), top: y < 0 };
    }
    var h = $('wrap').offsetHeight || 1, yy = window.scrollY + headOff() - wrapTopY();
    return { r: Math.max(0, Math.min(1, yy / h)), top: yy < 0 };
  }
  function goSpot(sp) {
    if (!sp || (sp.top && !pagedOn())) { return; }
    if (pdf && typeof sp.p === 'number') {
      var pg = pdf.pages[Math.max(0, Math.min(pdf.pages.length - 1, sp.p))];
      if (pagedOn()) { goPage(pdf.pages.indexOf(pg), true); return; }
      window.scrollTo(0, Math.max(0, wrapTopY() + (pg.top + (sp.f || 0) * pg.h) * scale - headOff()));
    } else if (typeof sp.r === 'number') {
      window.scrollTo(0, Math.max(0, wrapTopY() + sp.r * $('wrap').offsetHeight - headOff()));
    }
  }
  function loadProg() { try { return JSON.parse(localStorage.getItem(PROG_KEY) || '{}') || {}; } catch (err) { return {}; } }
  var progTimer = null;
  function saveProgress() {
    clearTimeout(progTimer);
    progTimer = setTimeout(function () {
      var sp = readingSpot(); if (!sp || !state.src) { return; }
      var all = loadProg(); sp.at = Date.now(); all[state.src.id] = sp;
      var keys = Object.keys(all);
      if (keys.length > 200) { keys.sort(function (a, b) { return (all[a].at || 0) - (all[b].at || 0); }).slice(0, keys.length - 200).forEach(function (k) { delete all[k]; }); }
      try { localStorage.setItem(PROG_KEY, JSON.stringify(all)); } catch (err) {}
    }, 500);
  }
  function restoreProgress(id) {
    var sp = loadProg()[id];
    if (sp && !(pagedOn() && sp.p === viewCur)) { goSpot(sp); }
    else if (pagedOn()) { goPage(viewCur, true); }
    renderViewBar();
  }
  window.addEventListener('scroll', function () { if (state.src && !$('view-doc').hidden) { saveProgress(); if (pdf && !pagedOn()) { renderViewBar(); } } }, { passive: true });

  /* ---------- 翻頁、跳頁 ---------- */
  function currentPageIndex() {
    if (!pdf) { return 0; }
    if (pagedOn()) { return viewCur; }
    var sp = readingSpot(); return sp && typeof sp.p === 'number' ? sp.p : 0;
  }
  function goPage(i, quiet) {
    if (!pdf) { return; }
    i = Math.max(0, Math.min(pdf.pages.length - 1, i));
    if (pagedOn()) {
      viewCur = i; hidePop(); layout(); renderVisiblePages();
      var top = wrapTopY();
      if (!quiet && (window.scrollY > top - headOff() || window.scrollY + window.innerHeight < top + 60)) { window.scrollTo(0, Math.max(0, top - headOff())); }
    } else {
      window.scrollTo(0, Math.max(0, wrapTopY() + pdf.pages[i].top * scale - headOff()));
    }
    saveProgress(); renderViewBar();
  }
  function setPaged(on) {
    var cur = currentPageIndex();
    viewPrefs.paged = !!on; saveView();
    viewCur = cur; layout();
    if (pdf) { goPage(cur, true); }
  }

  /* ---------- 浮在文件下方的小工具列：顯示比例、翻頁方式、頁碼 ---------- */
  var vbar = document.createElement('div'); vbar.className = 'viewbar'; vbar.id = 'viewbar'; vbar.hidden = true;
  vbar.innerHTML = '<button type="button" class="vb-zoom" id="vbZoom" aria-haspopup="true" aria-expanded="false"></button>' +
    '<span class="vb-sep" aria-hidden="true"></span>' +
    '<button type="button" class="vb-arrow" id="vbPrev" aria-label="上一頁">‹</button>' +
    '<button type="button" class="vb-page" id="vbPage" aria-label="跳到某一頁"></button>' +
    '<input type="number" class="vb-input" id="vbInput" min="1" inputmode="numeric" aria-label="要跳到第幾頁" hidden>' +
    '<button type="button" class="vb-arrow" id="vbNext" aria-label="下一頁">›</button>' +
    '<div class="vb-menu" id="vbMenu" role="menu" hidden></div>';
  (typeof subBar !== 'undefined' && subBar ? subBar : document.body).appendChild(vbar);
  function renderViewBar() {
    if (!vbar) { return; }
    var onDoc = state.src && !$('view-doc').hidden;
    vbar.hidden = !onDoc;
    if (!onDoc) { return; }
    $('vbZoom').textContent = zoomLabel() + (pdf ? (pagedOn() ? '・翻頁' : '・捲動') : '') + ' ▾';
    var hasPages = !!(pdf && pdf.pages.length);
    ['vbPrev', 'vbNext', 'vbPage'].forEach(function (k) { $(k).hidden = !hasPages; });
    vbar.querySelector('.vb-sep').hidden = !hasPages;
    if (hasPages && $('vbInput').hidden) {
      var i = currentPageIndex();
      $('vbPage').textContent = (i + 1) + ' / ' + pdf.pages.length;
      $('vbPrev').disabled = i <= 0; $('vbNext').disabled = i >= pdf.pages.length - 1;
    }
  }
  function renderViewMenu() {
    var m = $('vbMenu'); m.replaceChildren();
    function head(t) { var h = document.createElement('div'); h.className = 'vm-h'; h.textContent = t; m.appendChild(h); }
    function item(label, on, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.textContent = label; b.addEventListener('click', function () { fn(); closeViewMenu(); });
      m.appendChild(b);
    }
    head('顯示比例');
    ZOOM_OPTS.forEach(function (o) { if (o[0] === 'fit' && !pdf) { return; } item(o[1], effZoom() === o[0], function () { setZoom(o[0]); }); });
    if (pdf) {
      head('翻頁方式');
      item('上下捲動', !viewPrefs.paged, function () { setPaged(false); });
      item('左右翻頁', !!viewPrefs.paged, function () { setPaged(true); });
    }
  }
  function closeViewMenu() { $('vbMenu').hidden = true; $('vbZoom').setAttribute('aria-expanded', 'false'); }
  $('vbZoom').addEventListener('click', function () {
    var m = $('vbMenu');
    if (!m.hidden) { closeViewMenu(); return; }
    renderViewMenu(); m.hidden = false; $('vbZoom').setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('pointerdown', function (e) { if (!$('vbMenu').hidden && !vbar.contains(e.target)) { closeViewMenu(); } });
  $('vbPrev').addEventListener('click', function () { goPage(currentPageIndex() - 1); });
  $('vbNext').addEventListener('click', function () { goPage(currentPageIndex() + 1); });
  $('vbPage').addEventListener('click', function () {
    var inp = $('vbInput'); inp.max = pdf ? pdf.pages.length : 1; inp.value = currentPageIndex() + 1;
    $('vbPage').hidden = true; inp.hidden = false; inp.focus(); inp.select();
  });
  function finishJump(go) {
    var inp = $('vbInput'); if (inp.hidden) { return; }
    var n = parseInt(inp.value, 10); inp.hidden = true; $('vbPage').hidden = false;
    if (go && n) { goPage(n - 1); } else { renderViewBar(); }
  }
  $('vbInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { finishJump(true); } else if (e.key === 'Escape') { finishJump(false); } });
  $('vbInput').addEventListener('blur', function () { finishJump(true); });
  document.addEventListener('keydown', function (e) {
    if (!pagedOn() || $('view-doc').hidden || /input|textarea/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable)) { return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { goPage(viewCur + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { goPage(viewCur - 1); e.preventDefault(); }
  });

  /* ---------- 兩指縮放（任何工具都可以；手寫時第二根手指放下就取消這一筆） ---------- */
  var wrapEl = $('wrap'), swipe = null;
  function touchDist(t) { var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx * dx + dy * dy) || 1; }
  function touchMid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }
  function cancelActiveStroke() {
    if (!active) { return; }
    var k = active.kind; active = null;
    if (k === 'ink') { redrawInk(); } else if (k === 'hl') { renderText(); }
  }
  wrapEl.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      cancelActiveStroke(); cancelSelGesture();
      var m = touchMid(e.touches), r = $('page').getBoundingClientRect();
      pinch = { d0: touchDist(e.touches), s0: scale, s: scale, px: (m.x - r.left) / scale, py: (m.y - r.top) / scale, cx: m.x, cy: m.y, w0: wrapEl.getBoundingClientRect(), sl: wrapEl.scrollLeft, h0: wrapEl.offsetHeight };
      e.preventDefault();
    } else if (e.touches.length === 1 && pagedOn() && mode === 'tap') {
      swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }
  }, { passive: false });
  wrapEl.addEventListener('touchmove', function (e) {
    if (pinch && e.touches.length >= 2) {
      e.preventDefault();
      var m = touchMid(e.touches), avail = wrapEl.clientWidth, wfit = avail / PAGE_W;
      pinch.s = Math.max(wfit * 0.5, Math.min(wfit * 4, pinch.s0 * touchDist(e.touches) / pinch.d0));
      pinch.cx = m.x; pinch.cy = m.y;
      var tx = m.x - pinch.w0.left - pinch.px * pinch.s + pinch.sl, ty = m.y - pinch.w0.top - pinch.py * pinch.s;
      wrapEl.style.height = Math.max(pinch.h0, Math.ceil(pinch.h0 * pinch.s / pinch.s0)) + 'px';
      $('page').style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + pinch.s + ')';
    } else if (selGesture && selTouch) { e.preventDefault(); }
  }, { passive: false });
  function endPinch() {
    var p = pinch; pinch = null;
    var avail = wrapEl.clientWidth, wfit = avail / PAGE_W, z = p.s / wfit;
    if (Math.abs(z - 1) < 0.04) { viewPrefs.zoom = 'width'; }
    else if (pdf && Math.abs(p.s - Math.min(wfit, availH() / maxPageH())) < wfit * 0.03) { viewPrefs.zoom = 'fit'; }
    else { viewPrefs.zoom = Math.round(z * 100) / 100; }
    saveView();
    layout();
    var r = $('page').getBoundingClientRect(), ax = r.left + p.px * scale, ay = r.top + p.py * scale;
    window.scrollBy(0, ay - p.cy);
    wrapEl.scrollLeft += ax - p.cx;
    if (pdf) { renderVisiblePages(); }
    renderViewBar(); saveProgress();
  }
  wrapEl.addEventListener('touchend', function (e) {
    if (pinch && e.touches.length < 2) { endPinch(); return; }
    if (swipe && e.touches.length === 0 && e.changedTouches.length) {
      var t = e.changedTouches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y, quick = Date.now() - swipe.t < 700;
      var canScrollX = wrapEl.scrollWidth > wrapEl.clientWidth + 2;
      var atLeft = wrapEl.scrollLeft <= 2, atRight = wrapEl.scrollLeft + wrapEl.clientWidth >= wrapEl.scrollWidth - 2;
      swipe = null;
      if (quick && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
        if (dx < 0 && (!canScrollX || atRight)) { goPage(viewCur + 1); }
        if (dx > 0 && (!canScrollX || atLeft)) { goPage(viewCur - 1); }
      }
    }
  });
  wrapEl.addEventListener('touchcancel', function () { if (pinch) { endPinch(); } swipe = null; });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (n) { wrapEl.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });

  /* ---------- 點字模式：長按再拖曳選一段，直接翻譯 ---------- */
  var selGesture = false, selTouch = false, selTimer = null, selDown = null, selRange = null;
  function cancelSelGesture() {
    clearTimeout(selTimer); selTimer = null;
    if (selGesture) { selGesture = false; selTouch = false; renderText(); }
    selDown = null;
  }
  wrapEl.addEventListener('pointerdown', function (e) {
    if (mode !== 'tap' || pinch || (e.target.closest && e.target.closest('.note'))) { return; }
    var i = indexByGeometry(e.clientX, e.clientY);
    if (i < 0) { return; }
    selDown = { id: e.pointerId, x: e.clientX, y: e.clientY, a: i, b: i, pen: e.pointerType === 'pen' || e.pointerType === 'mouse' };
    clearTimeout(selTimer);
    if (!selDown.pen) {
      selTimer = setTimeout(function () {
        if (!selDown) { return; }
        selGesture = true; selTouch = true;
        renderText(snapRange(selDown.a, selDown.b));
        if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
      }, 450);
    }
  });
  wrapEl.addEventListener('pointermove', function (e) {
    if (!selDown || e.pointerId !== selDown.id) { return; }
    var moved = Math.abs(e.clientX - selDown.x) + Math.abs(e.clientY - selDown.y);
    if (!selGesture) {
      if (selDown.pen && moved > 10) { selGesture = true; try { wrapEl.setPointerCapture(e.pointerId); } catch (err) {} }
      else if (moved > 10) { clearTimeout(selTimer); selDown = null; return; }
      else { return; }
    }
    var i = indexByGeometry(e.clientX, e.clientY);
    if (i >= 0 && i !== selDown.b) { selDown.b = i; renderText(snapRange(selDown.a, selDown.b)); }
  });
  wrapEl.addEventListener('pointerup', function (e) {
    if (!selDown || e.pointerId !== selDown.id) { return; }
    clearTimeout(selTimer);
    if (selGesture) {
      var r = snapRange(selDown.a, selDown.b);
      selDown = null;
      setTimeout(function () { selGesture = false; selTouch = false; }, 0);
      openSelection(r);
      return;
    }
    selDown = null;
  });
  wrapEl.addEventListener('pointercancel', function () { cancelSelGesture(); });
  wrapEl.addEventListener('contextmenu', function (e) { if (mode === 'tap') { e.preventDefault(); } });

  var selPop = document.createElement('div'); selPop.className = 'selpop'; selPop.id = 'selpop'; selPop.hidden = true;
  selPop.setAttribute('role', 'dialog'); selPop.setAttribute('aria-label', '選取的文字');
  selPop.innerHTML = '<div class="sp-head"><span class="sp-k">選取的文字</span><button type="button" class="sp-x" id="spClose" aria-label="關閉">×</button></div>' +
    '<div class="sp-th" id="spTh" lang="th"></div><div class="sp-tr" id="spTr" aria-live="polite"></div>' +
    '<div class="sp-btns"><button type="button" id="spSay">朗讀</button><button type="button" id="spCopy">複製</button><button type="button" id="spHl">畫螢光筆</button><a class="ext" id="spGoogle" target="_blank" rel="noopener">在 Google 翻譯打開</a></div>';
  document.body.appendChild(selPop);
  function closeSelection() { selPop.hidden = true; selRange = null; tapSel = null; renderText(); }
  $('spClose').addEventListener('click', closeSelection);
  function translateText(t) {
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=zh-TW&dt=t&q=' + encodeURIComponent(t);
    return fetch(url).then(function (r) { if (!r.ok) { throw new Error('HTTP ' + r.status); } return r.json(); }).then(function (j) {
      return (j && j[0] || []).map(function (x) { return x && x[0] || ''; }).join('');
    });
  }
  function openSelection(r) {
    hidePop();
    var t = state.text.slice(r[0], r[1]).replace(/\s+/g, ' ').trim();
    if (!t) { renderText(); return; }
    selRange = r; tapSel = r; renderText();
    $('spTh').textContent = t.length > 400 ? t.slice(0, 400) + '…' : t;
    $('spGoogle').href = 'https://translate.google.com/?sl=th&tl=zh-TW&op=translate&text=' + encodeURIComponent(t.slice(0, 4500));
    var tr = $('spTr'); tr.className = 'sp-tr loading'; tr.textContent = '翻譯中…';
    selPop.hidden = false;
    translateText(t.slice(0, 4500)).then(function (z) {
      if (selRange !== r) { return; }
      tr.className = 'sp-tr'; tr.textContent = z || '沒有取得翻譯，可以按「在 Google 翻譯打開」。';
    }, function () {
      if (selRange !== r) { return; }
      tr.className = 'sp-tr err'; tr.textContent = '現在無法直接翻譯（可能沒有網路），可以按「在 Google 翻譯打開」。';
    });
  }
  $('spSay').addEventListener('click', function () { if (selRange) { speak(state.text.slice(selRange[0], selRange[1])); } });
  $('spCopy').addEventListener('click', function () {
    if (!selRange) { return; }
    var t = state.text.slice(selRange[0], selRange[1]);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { $('spCopy').textContent = '已複製'; setTimeout(function () { $('spCopy').textContent = '複製'; }, 1500); }, function () {});
  });
  $('spHl').addEventListener('click', function () {
    if (!selRange) { return; }
    snapshot(); addRangeColored(selRange, toolPrefs.hlColor, toolPrefs.hlStyle); save(); closeSelection();
  });

  /* ---------- 中文字體 ---------- */
  var FONT_KEY = 'thai-font';
  var UI_FONTS = [
    ['system', '蘋方（系統預設）', '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, -apple-system, sans-serif'],
    ['notosans', '思源黑體', '"Noto Sans TC", "PingFang TC", system-ui, sans-serif'],
    ['notoserif', '思源宋體', '"Noto Serif TC", "Songti TC", "PMingLiU", serif'],
    ['wenkai', '霞鶩文楷', '"LXGW WenKai TC", "Kaiti TC", "BiauKai", serif']
  ];
  var uiFont = 'system';
  try { uiFont = localStorage.getItem(FONT_KEY) || 'system'; } catch (err) {}
  function applyUiFont() {
    var f = UI_FONTS.filter(function (x) { return x[0] === uiFont; })[0] || UI_FONTS[0];
    if (f[0] === 'system') { document.documentElement.style.removeProperty('--ui'); } else { document.documentElement.style.setProperty('--ui', f[2]); }
    if (f[0] === 'notosans' && !document.getElementById('font-notosans')) {
      var l = document.createElement('link'); l.id = 'font-notosans'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap';
      document.head.appendChild(l);
    }
  }
  function renderUiFont() {
    var g = $('fontGroup'); if (!g) { return; }
    segButtons(g, UI_FONTS.map(function (f) { return [f[0], f[1]]; }), uiFont, function (v) {
      uiFont = v; try { localStorage.setItem(FONT_KEY, v); } catch (err) {} applyUiFont(); renderUiFont();
    });
    Array.prototype.forEach.call(g.querySelectorAll('button'), function (b, i) { b.style.fontFamily = UI_FONTS[i][2]; });
  }
  applyUiFont();
  renderUiFont();
