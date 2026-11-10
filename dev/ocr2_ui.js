  /* ---------- 照片、菜單辨識加強：自動版面讀不到多少字時，改用「一整塊文字」和「零散文字」再讀，選讀出最多真的詞的那次 ----------
     菜單、招牌、海報常常是表格或大小字混在一起，Tesseract 的自動版面分析會整塊當成圖片略過。 */
  function ocrScore(items) {
    var n = 0;
    items.forEach(function (it) {
      var t = it[4] || '';
      if (typeof segment !== 'function' || !DICT) { n += (t.match(/[ก-ฮ]/g) || []).length; return; }
      segment(t).forEach(function (x) { var c = (x.t.match(/[ก-ฮ]/g) || []).length; if (c >= 2 && DICT[x.t]) { n += c; } });
    });
    return n;
  }
  async function ocrBest(w, c, cw) {
    var res = await w.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
    var best = ocrItems(res.data, cw), bs = ocrScore(best.items);
    if (bs >= 400) { return best; }
    try {
      for (var psm of ['6', '11']) {
        await w.setParameters({ tessedit_pageseg_mode: psm });
        var r2 = await w.recognize(c, {}, { blocks: true, text: false, hocr: false, tsv: false });
        var g = ocrItems(r2.data, cw), sc = ocrScore(g.items);
        if (sc > bs * 1.15 + 5) { best = g; bs = sc; }
      }
    } finally { await w.setParameters({ tessedit_pageseg_mode: '3' }); }
    return best;
  }
