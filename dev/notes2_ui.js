  /* ---------- 邊查詞邊做筆記：查詞視窗裡直接畫螢光筆、加註解；手寫的橡皮擦 ---------- */
  function annotateWord(seg) {
    snapshot();
    var wr = pageRectOf(seg.i, seg.i + seg.n);
    var lift = Math.round(state.style.size * 1.3) + (pdf ? 3 : 8);
    var b = { id: state.nextId++, x: Math.max(0, Math.round(wr.left - 5)), y: Math.max(0, Math.round(wr.top - lift)), t: '', a: [seg.i, seg.i + seg.n], s: Object.assign({}, state.style) };
    state.boxes.push(b);
    hidePop();
    tapSel = null;
    if (mode !== 'box') { mode = 'box'; applyMode(); }
    renderText();
    renderBoxes(b.id);
    save();
  }
  function popNoteButtons(seg) {
    var row = document.createElement('div'); row.className = 'popnotes';
    var hb = document.createElement('button'); hb.type = 'button'; hb.className = 'pn-hl';
    function paint() {
      var on = hlAt(seg.i) >= 0;
      hb.innerHTML = '<span class="pn-dot" aria-hidden="true"></span><span></span>';
      hb.querySelector('span:last-child').textContent = on ? '取消螢光筆' : '畫螢光筆';
      hb.querySelector('.pn-dot').style.background = toolPrefs.hlColor;
      hb.setAttribute('aria-pressed', String(on));
    }
    paint();
    hb.addEventListener('click', function () {
      snapshot();
      var k = hlAt(seg.i);
      if (k >= 0) { state.hl.splice(k, 1); } else { addRangeColored([seg.i, seg.i + seg.n], toolPrefs.hlColor, toolPrefs.hlStyle); }
      renderText(); save(); paint();
    });
    var ab = document.createElement('button'); ab.type = 'button'; ab.className = 'pn-box';
    ab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/></svg><span>加註解</span>';
    ab.addEventListener('click', function () { annotateWord(seg); });
    row.appendChild(hb); row.appendChild(ab);
    return row;
  }
  /* 橡皮擦：碰到的那一整筆擦掉（像 GoodNotes 的「整筆擦除」） */
  function eraseAt(pt, a) {
    var r = 9 / Math.max(0.5, scale) + 4, r2 = r * r, hit = false;
    var keep = state.strokes.filter(function (s) {
      var p = s.p, rr = r + (s.w || 3) / 2, rr2 = rr * rr;
      for (var k = 0; k < p.length; k++) {
        var dx = p[k][0] - pt[0], dy = p[k][1] - pt[1];
        if (dx * dx + dy * dy <= rr2) { return false; }
        if (k) {
          var x1 = p[k - 1][0], y1 = p[k - 1][1], vx = p[k][0] - x1, vy = p[k][1] - y1, L = vx * vx + vy * vy;
          if (L) { var t = Math.max(0, Math.min(1, ((pt[0] - x1) * vx + (pt[1] - y1) * vy) / L)), ex = x1 + t * vx - pt[0], ey = y1 + t * vy - pt[1]; if (ex * ex + ey * ey <= rr2) { return false; } }
        }
      }
      return true;
    });
    if (keep.length !== state.strokes.length) {
      if (!a.hit) { snapshot(); a.hit = true; }
      state.strokes = keep; hit = true;
      redrawInk();
    }
    return hit;
  }
