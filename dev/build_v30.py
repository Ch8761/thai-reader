import os, shutil
D = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(D, 'thai-notes-test.html')
s = open(src, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:120]); s = s.replace(old, new)

# ---------- 1.20 文字辨識同時認中文（繁體或簡體）與英文 ----------
rep("      return window.Tesseract.createWorker(['tha', 'eng'], 1, {", "      return window.Tesseract.createWorker(ocrLangs(), 1, {")
rep('''      <div class="seg" role="radiogroup" aria-label="標示專有名詞" id="entGroup"></div>
    </div>''', '''      <div class="seg" role="radiogroup" aria-label="標示專有名詞" id="entGroup"></div>
    </div>
    <div class="setrow">
      <div class="setlabel">辨識中文<span class="sethelp">圖片、掃描頁、影片字幕裡的中文字也一起認出來（泰文和英文一定會認）。字幕是泰文加中文的影片，中文那行會留在泰文下面當翻譯。台灣的字幕選「繁體」，中國的字幕組選「簡體」。不需要就選「不辨識」，辨識會快一點。</span></div>
      <div class="seg" role="radiogroup" aria-label="辨識中文" id="ocrZhGroup"></div>
    </div>''')
rep("['read', '閱讀與查詞', ['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'toneGroup']]",
    "['read', '閱讀與查詞', ['levelGroup', 'romGroup', 'glossGroup', 'entGroup', 'toneGroup', 'ocrZhGroup']]")
MOD = r'''  /* 文字辨識要認哪些語言：泰文＋（繁體或簡體中文）＋英文；設定改了就關掉辨識工具，下次用時照新設定重開 */
  function ocrZh() { try { var z = localStorage.getItem('thai-ocr-zh'); return z === 'sim' || z === 'off' ? z : 'tra'; } catch (err) { return 'tra'; } }
  function ocrLangs() { var z = ocrZh(); return z === 'off' ? ['tha', 'eng'] : ['tha', z === 'sim' ? 'chi_sim' : 'chi_tra', 'eng']; }
  (function () {
    var g = $('ocrZhGroup'); if (!g) { return; }
    function draw() {
      segButtons(g, [['tra', '繁體'], ['sim', '簡體'], ['off', '不辨識']], ocrZh(), function (v) {
        try { localStorage.setItem('thai-ocr-zh', v); } catch (err) {}
        var r = ocr.ready; ocr.ready = null; ocr.worker = null;
        if (r) { r.then(function (w) { try { w.terminate(); } catch (err) {} }, function () {}); }
        draw();
      });
    }
    draw();
  })();
'''
rep('  function armed(btn, label, confirmLabel, action) {\n', MOD + '  function armed(btn, label, confirmLabel, action) {\n')
# 點到中文字：不查字典，說明一下
rep("""  function showPop(seg) {
    lastPopSeg = seg;""", """  function showPop(seg) {
    if (seg && /[\\u3400-\\u9FFF]/.test(seg.t) && !/[\\u0E01-\\u0E5B]/.test(seg.t)) {
      lastPopSeg = null;
      var pz = $('pop'); pz.replaceChildren();
      var xz = document.createElement('button'); xz.type = 'button'; xz.className = 'x'; xz.textContent = '×'; xz.setAttribute('aria-label', '關閉');
      xz.addEventListener('click', function () { hidePop(); tapSel = null; renderText(); });
      var hz = document.createElement('div'); hz.className = 'head'; var wz = document.createElement('div'); wz.className = 'pw'; wz.lang = 'zh-Hant'; wz.textContent = seg.t; hz.appendChild(wz);
      var nz = document.createElement('p'); nz.className = 'zhnote'; nz.textContent = '這是中文（字幕或畫面上的中文字）。查詞只查泰文，點旁邊的泰文看看。';
      pz.appendChild(xz); pz.appendChild(hz); pz.appendChild(nz);
      pz.hidden = false;
      var rz = clientRectOf(seg.i, seg.i + seg.n), mz = document.querySelector('main').getBoundingClientRect();
      pz.style.left = Math.max(0, Math.min(rz.left - mz.left, mz.width - pz.offsetWidth)) + 'px'; pz.style.top = (rz.bottom - mz.top + 10) + 'px';
      return;
    }
    lastPopSeg = seg;""")
rep("'按「開始讀字幕」。App 每半秒到一秒看一次框裡的畫面，字幕換了就讀一次，最後整理成一份文字文件。白字、黃底黑字、鮮豔的黃色大字都讀得到；夾在字幕裡的中文字會略過。',",
    "'按「開始讀字幕」。App 每半秒到一秒看一次框裡的畫面，字幕換了就讀一次，最後整理成一份文字文件。白字、黃底黑字、鮮豔的黃色大字都讀得到。',\n          '泰文加中文的雙語字幕：中文那行會一起留下來，放在泰文旁邊當翻譯（設定 → 閱讀與查詞 → 辨識中文，可選繁體或簡體）。',")
rep('</style>', '''
/* ---- v1.20 點到中文字 ---- */
.pop .zhnote { margin: 6px 0 2px; font-size: 14px; color: var(--muted); }
</style>''')
open(src, 'w', encoding='utf-8').write(s)
L2 = os.path.join(D, 'srv', 'ocr', 'lang2')
for z in ('chi_tra', 'chi_sim'):
    shutil.copyfile(os.path.join(D, 'chi', 'x_tesseract.js-data-%s-1.0.0' % z, 'package', '4.0.0_best_int', '%s.traineddata.gz' % z), os.path.join(L2, '%s.traineddata.gz' % z))
print('v30 ok')
