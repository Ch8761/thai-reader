  /* ---- 全部清單（1.22）：清單／方塊兩種排法、左滑刪除、右滑收藏、只看收藏 ---- */
  var CV_KEY = 'thai-cards-view', CF_KEY = 'thai-cards-filter', SWTIP_KEY = 'thai-swipe-tip';
  function clGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (err) { return d; } }
  function clSet(k, v) { try { localStorage.setItem(k, v); } catch (err) {} }
  var ICON_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
  var ICON_TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>';
  var ICON_LIST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>';
  var ICON_GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>';
  /* 刪掉之後 5 秒內可以復原 */
  var snack = document.createElement('div'); snack.className = 'snack'; snack.hidden = true; snack.setAttribute('role', 'status');
  snack.innerHTML = '<span id="snackT"></span><button type="button" id="snackU">復原</button>';
  document.body.appendChild(snack);
  var snackTimer = null, snackUndo = null;
  function showSnack(text, undo) {
    $('snackT').textContent = text; snackUndo = undo; snack.hidden = false;
    clearTimeout(snackTimer); snackTimer = setTimeout(function () { snack.hidden = true; snackUndo = null; }, 5000);
  }
  $('snackU').addEventListener('click', function () { var u = snackUndo; snack.hidden = true; snackUndo = null; clearTimeout(snackTimer); if (u) { u(); } });
  function cardDelUndo(c) {
    var idx = cards.indexOf(c); if (idx < 0) { return; }
    removeCard(c.id);
    showSnack('已刪除「' + c.w + '」', function () { cards.splice(Math.min(idx, cards.length), 0, c); saveCards(); renderCards(); });
    renderCards();
  }
  function cardFav(c) {
    if (c.fav) { delete c.fav; } else { c.fav = 1; }
    saveCards();
    showSnack(c.fav ? '已收藏「' + c.w + '」' : '已取消收藏「' + c.w + '」', null);
  }
  /* 手指往左／右滑：超過門檻放開就執行；上下滑照常捲動 */
  function swipeable(li, fg, onLeft, onRight) {
    var sx = 0, sy = 0, dx = 0, pid = null, drag = false, moved = false;
    function th() { return Math.min(110, li.offsetWidth * 0.3); }
    function reset() { fg.style.transition = 'transform .2s ease'; fg.style.transform = ''; li.classList.remove('sw-l', 'sw-r', 'sw-go', 'swiping'); }
    fg.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) { return; } sx = e.clientX; sy = e.clientY; dx = 0; drag = false; pid = e.pointerId; });
    fg.addEventListener('pointermove', function (e) {
      if (pid !== e.pointerId) { return; }
      var mx = e.clientX - sx, my = e.clientY - sy;
      if (!drag) {
        if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.4) { drag = true; try { fg.setPointerCapture(pid); } catch (err) {} li.classList.add('swiping'); fg.style.transition = 'none'; }
        else if (Math.abs(my) > 10) { pid = null; return; }
        else { return; }
      }
      dx = mx;
      fg.style.transform = 'translateX(' + dx + 'px)';
      li.classList.toggle('sw-l', dx < 0); li.classList.toggle('sw-r', dx > 0); li.classList.toggle('sw-go', Math.abs(dx) > th());
      e.preventDefault();
    });
    function end(e) {
      if (pid !== e.pointerId) { return; }
      pid = null;
      if (!drag) { return; }
      drag = false; moved = true; setTimeout(function () { moved = false; }, 350);
      clSet(SWTIP_KEY, '1');
      if (dx < -th()) { fg.style.transition = 'transform .18s ease'; fg.style.transform = 'translateX(-110%)'; setTimeout(onLeft, 170); }
      else if (dx > th()) { reset(); onRight(); }
      else { reset(); }
    }
    fg.addEventListener('pointerup', end);
    fg.addEventListener('pointercancel', function (e) { if (pid === e.pointerId) { pid = null; drag = false; reset(); } });
    fg.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  function renderList(host) {
    var doc = docName(), view = clGet(CV_KEY, 'list'), filt = clGet(CF_KEY, 'all');
    var inF = cards.filter(function (c) { return inFolder(c) && (!cardsOnlyDoc || c.src === doc); });
    var nFav = inF.filter(function (c) { return c.fav; }).length;
    if (filt === 'fav' && !nFav) { filt = 'all'; }
    /* 第一排：全部／收藏、排列方式 */
    var top = el('div', 'clbar');
    var seg = el('div', 'clfilt'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', '顯示哪些生字卡');
    [['all', '全部 ' + inF.length], ['fav', '收藏 ' + nFav]].forEach(function (x) {
      var b = el('button', x[0] === 'fav' ? 'clfav' : ''); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(filt === x[0]));
      if (x[0] === 'fav') { b.innerHTML = ICON_STAR; }
      b.appendChild(document.createTextNode(x[1]));
      b.addEventListener('click', function () { clSet(CF_KEY, x[0]); renderCards(); });
      seg.appendChild(b);
    });
    top.appendChild(seg);
    var vt = el('div', 'viewtoggle'); vt.setAttribute('role', 'radiogroup'); vt.setAttribute('aria-label', '生字卡排列方式');
    [['list', '清單', ICON_LIST], ['grid', '方塊', ICON_GRID]].forEach(function (x) {
      var b = el('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', x[1]); b.title = x[1]; b.innerHTML = x[2];
      b.setAttribute('aria-checked', String(view === x[0]));
      b.addEventListener('click', function () { clSet(CV_KEY, x[0]); renderCards(); });
      vt.appendChild(b);
    });
    top.appendChild(vt);
    host.appendChild(top);
    /* 第二排：只看目前文件、Anki */
    var bar = el('div', 'clbar2');
    var only = el('button', 'toggle', '只看目前文件'); only.type = 'button'; only.setAttribute('aria-pressed', String(cardsOnlyDoc));
    only.addEventListener('click', function () { cardsOnlyDoc = !cardsOnlyDoc; renderCards(); });
    var copy = el('button', '', '複製成 Anki 格式'); copy.type = 'button';
    copy.addEventListener('click', function () { copyAnki(); });
    bar.appendChild(only); bar.appendChild(copy);
    host.appendChild(bar);
    var ta = el('textarea', 'ankibox'); ta.id = 'ankibox'; ta.readOnly = true; ta.hidden = true; ta.setAttribute('aria-label', 'Anki 格式內容');
    host.appendChild(ta);
    var list = filt === 'fav' ? inF.filter(function (c) { return c.fav; }) : inF;
    if (!list.length) { host.appendChild(el('p', 'label', cardsOnlyDoc ? '這個資料夾裡沒有這份文件的生字卡。' : '這個資料夾還沒有生字卡。')); return; }
    if (clGet(SWTIP_KEY, '') !== '1') { host.appendChild(el('p', 'swtip', '小技巧：往左滑刪除、往右滑收藏')); }
    var ul = el('ul', view === 'grid' ? 'cgrid' : 'clist2');
    list.forEach(function (c) {
      srsInit(c);
      var li = el('li', 'swli' + (c.fav ? ' isfav' : ''));
      var bg = el('div', 'swbg'); bg.setAttribute('aria-hidden', 'true');
      var bl = el('span', 'swfav'); bl.innerHTML = ICON_STAR; bl.appendChild(el('span', '', c.fav ? '取消收藏' : '收藏'));
      var br = el('span', 'swdel'); br.appendChild(el('span', '', '刪除')); br.insertAdjacentHTML('beforeend', ICON_TRASH);
      bg.appendChild(bl); bg.appendChild(br); li.appendChild(bg);
      var fg = el('div', 'swfg');
      var b = el('button', view === 'grid' ? 'ctile' : 'crow'); b.type = 'button'; b.setAttribute('aria-label', c.w + '，' + cardMeaning(c) + '，點一下看詳解');
      var l = el('span', 'crow-l');
      var w = el('span', 'cw', c.w); w.lang = 'th'; l.appendChild(w);
      if (showRom && c.rom) { l.appendChild(el('span', 'crom', c.rom)); }
      l.appendChild(el('span', 'cm', cardMeaning(c) || '（字典沒有）'));
      b.appendChild(l);
      var r = el('span', 'crow-r');
      var dots = el('span', 'cdots'); dots.setAttribute('aria-hidden', 'true');
      for (var k = 1; k <= 5; k++) { dots.appendChild(el('i', k <= c.box ? 'on' : '')); }
      r.appendChild(dots);
      r.appendChild(el('span', 'cdue', c.due <= today0() ? '今天複習' : ivlText(Math.round((c.due - today0()) / DAY)) + '後'));
      if (view !== 'grid') { r.appendChild(el('span', 'chev', '›')); }
      b.appendChild(r);
      b.addEventListener('click', function () { openCardDetail(c.id); });
      fg.appendChild(b);
      var st = el('button', 'cstar'); st.type = 'button'; st.innerHTML = ICON_STAR;
      st.setAttribute('aria-pressed', String(!!c.fav)); st.setAttribute('aria-label', (c.fav ? '取消收藏 ' : '收藏 ') + c.w);
      st.addEventListener('click', function () { cardFav(c); renderCards(); });
      fg.appendChild(st);
      li.appendChild(fg);
      swipeable(li, fg, function () { cardDelUndo(c); }, function () { cardFav(c); renderCards(); });
      ul.appendChild(li);
    });
    host.appendChild(ul);
  }

