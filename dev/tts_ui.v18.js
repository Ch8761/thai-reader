  /* ---------- 朗讀全文：播放／暫停、進度條（可以拖）、停止 ---------- */
  var ra = { pos: 0, playing: false, gen: 0, poll: null, doc: null, drag: false };
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>';
  function raSegs(text, from) {
    var out = [], re = /\S+\s*/g, m, cur = null;
    re.lastIndex = from;
    while ((m = re.exec(text))) {
      if (!cur) { cur = { s: m.index, e: m.index }; }
      if (m.index + m[0].length - cur.s > 200 && cur.e > cur.s) { out.push(cur); cur = { s: m.index, e: m.index }; }
      cur.e = m.index + m[0].length;
    }
    if (cur && cur.e > cur.s) { out.push(cur); }
    return out.map(function (c) { return { s: c.s, e: c.e, t: text.slice(c.s, c.e) }; });
  }
  function raUI() {
    var b = $('readAll'), len = Math.max(1, (state.text || '').length);
    if (!b) { return; }
    b.innerHTML = ra.playing ? ICON_PAUSE : ICON_PLAY;
    b.setAttribute('aria-label', ra.playing ? '暫停朗讀' : (ra.pos > 0 ? '繼續朗讀' : '播放朗讀全文'));
    b.title = ra.playing ? '暫停' : '播放';
    $('player').classList.toggle('playing', ra.playing);
    var v = Math.round(ra.pos / len * 1000);
    if (!ra.drag) { $('ttsSeek').value = v; }
    $('ttsSeek').style.setProperty('--p', (ra.drag ? $('ttsSeek').value / 10 : v / 10) + '%');
    $('stopRead').disabled = !ra.playing && ra.pos === 0;
  }
  function raHalt() {
    if (!ra.playing) { return; }
    ra.gen++; ra.playing = false;
    if (ra.poll) { clearInterval(ra.poll); ra.poll = null; }
    raUI();
  }
  function raReset() {
    if (ra.playing && hasTTS) { window.speechSynthesis.cancel(); }
    ra.gen++; ra.playing = false; ra.pos = 0;
    if (ra.poll) { clearInterval(ra.poll); ra.poll = null; }
    raUI();
  }
  function raStart() {
    if (!hasTTS) { $('ttsnote').textContent = '這個瀏覽器不支援朗讀。'; return; }
    var text = state.text || '';
    if (!text.trim()) { return; }
    if (ra.doc !== (state.src && state.src.id)) { ra.pos = 0; ra.doc = state.src && state.src.id; }
    if (ra.pos >= text.length - 1) { ra.pos = 0; }
    window.speechSynthesis.cancel(); stopSpeakingMark();
    var g = ++ra.gen, t0 = Date.now(), segs = raSegs(text, ra.pos);
    if (!segs.length) { ra.pos = 0; segs = raSegs(text, 0); }
    ra.playing = true;
    segs.forEach(function (c, i) {
      var u = new SpeechSynthesisUtterance(c.t);
      u.lang = 'th-TH';
      if (thVoice) { u.voice = thVoice; }
      u.rate = ttsRate;
      u.onstart = function () { if (g === ra.gen) { ra.pos = c.s; raUI(); } };
      u.onboundary = function (e) { if (g === ra.gen && e && typeof e.charIndex === 'number') { ra.pos = Math.min(c.e, c.s + e.charIndex); raUI(); } };
      if (i === segs.length - 1) {
        u.onend = function () {
          if (g !== ra.gen) { return; }
          ra.playing = false; ra.pos = 0; ra.gen++;
          if (ra.poll) { clearInterval(ra.poll); ra.poll = null; }
          $('ttsnote').textContent = ''; raUI();
        };
      }
      u.onerror = function (e) {
        if (g !== ra.gen || (e && /interrupted|canceled/.test(e.error || ''))) { return; }
        $('ttsnote').textContent = '朗讀出錯：' + (e && e.error ? e.error : '未知原因');
        raHalt();
      };
      window.speechSynthesis.speak(u);
    });
    if (ra.poll) { clearInterval(ra.poll); }
    ra.poll = setInterval(function () {
      if (g !== ra.gen) { clearInterval(ra.poll); ra.poll = null; return; }
      var on = window.speechSynthesis.speaking || window.speechSynthesis.pending;
      if (!on && Date.now() - t0 > 1500) { raHalt(); }
    }, 400);
    $('ttsnote').textContent = thVoice ? '' : '沒找到泰文語音，可能用其他語音唸。';
    raUI();
  }
  function raPause() { if (hasTTS) { window.speechSynthesis.cancel(); } raHalt(); }
  $('readAll').addEventListener('click', function () { if (ra.playing) { raPause(); } else { raStart(); } });
  $('stopRead').addEventListener('click', function () { raReset(); });
  $('slow').addEventListener('click', function () { if (ra.playing) { raStart(); } });
  $('ttsSeek').addEventListener('input', function () {
    ra.drag = true;
    var text = state.text || '', p = Math.round($('ttsSeek').value / 1000 * text.length);
    while (p > 0 && !/\s/.test(text[p - 1])) { p--; }
    ra.pos = p; ra.doc = state.src && state.src.id;
    raUI();
  });
  $('ttsSeek').addEventListener('change', function () { ra.drag = false; if (ra.playing) { raStart(); } else { raUI(); } });
  raUI();
