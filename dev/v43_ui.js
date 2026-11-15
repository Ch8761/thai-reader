  /* ====== 1.35 ====== */
  /* ---- 泰文字體：有圈的書面體、無圈的廣告體看起來差很多，讓使用者自己選（字型檔放在 fonts/，選了才下載）---- */
  var THF_KEY = 'thai-thfont', THF_BASE = '"Thonburi", "Sukhumvit Set", "Noto Sans Thai", "Leelawadee UI", "Tahoma", system-ui, sans-serif';
  var TH_FONTS = [
    ['system', L2('系統預設', 'System default'), ''],
    ['sarabun', L2('有圈・書面體', 'Looped (textbook)'), 'sarabun'],
    ['serif', L2('有圈・報紙體', 'Looped serif (newspaper)'), 'noto-serif-thai'],
    ['kanit', L2('無圈・廣告體', 'Loopless (ads, signs)'), 'kanit'],
    ['mali', L2('手寫風', 'Handwriting style'), 'mali']
  ];
  var thFont = 'system';
  try { thFont = localStorage.getItem(THF_KEY) || 'system'; } catch (err) {}
  function thFontFace(f) {
    if (!f[2] || document.getElementById('thf-' + f[0])) { return; }
    var st = document.createElement('style'); st.id = 'thf-' + f[0];
    st.textContent = [400, 700].map(function (w) { return '@font-face { font-family: "TR ' + f[0] + '"; font-weight: ' + w + '; font-style: normal; font-display: swap; src: url("fonts/' + f[2] + '-' + w + '.woff2") format("woff2"); unicode-range: U+0E01-0E5B, U+200C-200D, U+25CC; }'; }).join('\n');
    document.head.appendChild(st);
  }
  function applyThFont() {
    var f = TH_FONTS.filter(function (x) { return x[0] === thFont; })[0] || TH_FONTS[0];
    if (!f[2]) { document.documentElement.style.removeProperty('--thai'); return; }
    thFontFace(f);
    document.documentElement.style.setProperty('--thai', '"TR ' + f[0] + '", ' + THF_BASE);
  }
  function renderThFont() {
    var g = $('thFontGroup'); if (!g) { return; }
    segButtons(g, TH_FONTS.map(function (f) { return [f[0], f[1]]; }), thFont, function (v) {
      thFont = v; try { if (v === 'system') { localStorage.removeItem(THF_KEY); } else { localStorage.setItem(THF_KEY, v); } } catch (err) {}
      applyThFont(); renderThFont();
    });
    Array.prototype.forEach.call(g.querySelectorAll('button'), function (b, i) {
      var f = TH_FONTS[i]; thFontFace(f);
      var sm = document.createElement('span'); sm.className = 'thfs'; sm.setAttribute('lang', 'th'); sm.setAttribute('aria-hidden', 'true'); sm.textContent = 'ภาษาไทย';
      sm.style.fontFamily = f[2] ? '"TR ' + f[0] + '", ' + THF_BASE : THF_BASE;
      b.appendChild(sm);
    });
  }
  applyThFont(); renderThFont();

