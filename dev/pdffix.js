/* 泰文 PDF 修復：在交給 PDF.js 之前，用字型裡的資訊把壞掉的「字形→文字」對照表修好。
   三種線索：(1) 字形名稱（例如 totaothai_maithothai = ต้）
             (2) 組合字形（標準聲調字形其實是「借用」移位聲調的外形）
             (3) 外形比對（同一個外形，只是位置不同）
   需要 PDFLib（pdf-lib）。輸出：{ bytes, report } */
(function (root) {
  'use strict';
  var AGL = {"kokaithai":"0E01","khokhaithai":"0E02","khokhuatthai":"0E03","khokhwaithai":"0E04","khokhonthai":"0E05","khorakhangthai":"0E06","ngonguthai":"0E07","chochanthai":"0E08","chochingthai":"0E09","chochangthai":"0E0A","sosothai":"0E0B","chochoethai":"0E0C","yoyingthai":"0E0D","dochadathai":"0E0E","topatakthai":"0E0F","thothanthai":"0E10","thonangmonthothai":"0E11","thophuthaothai":"0E12","nonenthai":"0E13","dodekthai":"0E14","totaothai":"0E15","thothungthai":"0E16","thothahanthai":"0E17","thothongthai":"0E18","nonuthai":"0E19","bobaimaithai":"0E1A","poplathai":"0E1B","phophungthai":"0E1C","fofathai":"0E1D","phophanthai":"0E1E","fofanthai":"0E1F","phosamphaothai":"0E20","momathai":"0E21","yoyakthai":"0E22","roruathai":"0E23","ruthai":"0E24","lolingthai":"0E25","luthai":"0E26","wowaenthai":"0E27","sosalathai":"0E28","sorusithai":"0E29","sosuathai":"0E2A","hohipthai":"0E2B","lochulathai":"0E2C","oangthai":"0E2D","honokhukthai":"0E2E","paiyannoithai":"0E2F","saraathai":"0E30","maihanakatthai":"0E31","saraaathai":"0E32","saraamthai":"0E33","saraithai":"0E34","saraiithai":"0E35","sarauethai":"0E36","saraueethai":"0E37","sarauthai":"0E38","sarauuthai":"0E39","phinthuthai":"0E3A","bahtthai":"0E3F","saraethai":"0E40","saraaethai":"0E41","saraothai":"0E42","saraaimaimuanthai":"0E43","saraaimaimalaithai":"0E44","lakkhangyaothai":"0E45","maiyamokthai":"0E46","maitaikhuthai":"0E47","maiekthai":"0E48","maithothai":"0E49","maitrithai":"0E4A","maichattawathai":"0E4B","thanthakhatthai":"0E4C","nikhahitthai":"0E4D","yamakkanthai":"0E4E","fongmanthai":"0E4F","zerothai":"0E50","onethai":"0E51","twothai":"0E52","threethai":"0E53","fourthai":"0E54","fivethai":"0E55","sixthai":"0E56","seventhai":"0E57","eightthai":"0E58","ninethai":"0E59","angkhankhuthai":"0E5A","khomutthai":"0E5B"};
  /* 舊式泰文字型把「移位後的符號」放在私用區 U+F700–F71A，這裡換回標準泰文 */
  var PUA = {};
  [[0xF700,0x0E10],[0xF701,0x0E34],[0xF702,0x0E35],[0xF703,0x0E36],[0xF704,0x0E37],
   [0xF705,0x0E48],[0xF706,0x0E49],[0xF707,0x0E4A],[0xF708,0x0E4B],[0xF709,0x0E4C],
   [0xF70A,0x0E48],[0xF70B,0x0E49],[0xF70C,0x0E4A],[0xF70D,0x0E4B],[0xF70E,0x0E4C],
   [0xF70F,0x0E0D],[0xF710,0x0E31],[0xF711,0x0E4D],[0xF712,0x0E47],
   [0xF713,0x0E48],[0xF714,0x0E49],[0xF715,0x0E4A],[0xF716,0x0E4B],[0xF717,0x0E4C],
   [0xF718,0x0E38],[0xF719,0x0E39],[0xF71A,0x0E3A]].forEach(function (p) { PUA[String.fromCharCode(p[0])] = String.fromCharCode(p[1]); });
  var THAI = /[ก-๛]/;
  function mapPUA(s) { return s.replace(/[-]/g, function (c) { return PUA[c] || c; }); }

  function nameToUni(name) {
    if (!name || name.charAt(0) === '.') { return null; }
    var base = name.split('.')[0];
    if (!base) { return null; }
    var parts = base.split('_'), out = '';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], m;
      if (AGL[p]) { out += String.fromCharCode(parseInt(AGL[p], 16)); }
      else if ((m = /^uni((?:[0-9A-Fa-f]{4})+)$/.exec(p))) { for (var k = 0; k < m[1].length; k += 4) { out += String.fromCharCode(parseInt(m[1].substr(k, 4), 16)); } }
      else if ((m = /^u([0-9A-Fa-f]{4,6})$/.exec(p))) { out += String.fromCodePoint(parseInt(m[1], 16)); }
      else { return null; }
    }
    out = mapPUA(out);
    return THAI.test(out) ? out : null;
  }

  /* ---------- 讀 TrueType 字型 ---------- */
  function parseTT(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var t = {}, n = dv.getUint16(4);
    for (var i = 0; i < n; i++) {
      var o = 12 + i * 16;
      var tag = String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
      t[tag] = { off: dv.getUint32(o + 8), len: dv.getUint32(o + 12) };
    }
    var f = { dv: dv, u8: u8, t: t, numGlyphs: t.maxp ? dv.getUint16(t.maxp.off + 4) : 0 };
    f.names = parsePost(f);
    f.cmaps = parseCmap(f);
    if (t.head && t.loca && t.glyf) {
      f.longLoca = dv.getInt16(t.head.off + 50) === 1;
    }
    return f;
  }
  function parsePost(f) {
    var p = f.t.post, dv = f.dv, names = [];
    if (!p) { return names; }
    var ver = dv.getUint32(p.off);
    if (ver !== 0x00020000) { return names; }
    var ng = dv.getUint16(p.off + 32), idx = [], o = p.off + 34;
    for (var i = 0; i < ng; i++) { idx.push(dv.getUint16(o)); o += 2; }
    var custom = [], end = p.off + p.len;
    while (o < end) {
      var len = f.u8[o]; o++;
      if (o + len > end) { break; }
      var s = '';
      for (var k = 0; k < len; k++) { s += String.fromCharCode(f.u8[o + k]); }
      custom.push(s); o += len;
    }
    for (var g = 0; g < ng; g++) { names[g] = idx[g] >= 258 ? (custom[idx[g] - 258] || null) : null; }
    return names;
  }
  function parseCmap(f) {
    var c = f.t.cmap, dv = f.dv, out = [];
    if (!c) { return out; }
    var n = dv.getUint16(c.off + 2);
    for (var i = 0; i < n; i++) {
      var pid = dv.getUint16(c.off + 4 + i * 8), eid = dv.getUint16(c.off + 6 + i * 8);
      var o = c.off + dv.getUint32(c.off + 8 + i * 8), fmt = dv.getUint16(o), map = {};
      try {
        if (fmt === 0) { for (var k = 0; k < 256; k++) { map[k] = f.u8[o + 6 + k]; } }
        else if (fmt === 6) { var first = dv.getUint16(o + 6), cnt = dv.getUint16(o + 8); for (var k6 = 0; k6 < cnt; k6++) { map[first + k6] = dv.getUint16(o + 10 + k6 * 2); } }
        else if (fmt === 4) {
          var segX2 = dv.getUint16(o + 6), ends = o + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
          for (var s = 0; s < segX2 / 2; s++) {
            var e = dv.getUint16(ends + s * 2), st = dv.getUint16(starts + s * 2), d = dv.getInt16(deltas + s * 2), ro = dv.getUint16(ranges + s * 2);
            for (var ch = st; ch <= e && ch !== 0xFFFF; ch++) {
              var gid;
              if (ro === 0) { gid = (ch + d) & 0xFFFF; }
              else { var ga = ranges + s * 2 + ro + (ch - st) * 2; gid = dv.getUint16(ga); if (gid) { gid = (gid + d) & 0xFFFF; } }
              if (gid) { map[ch] = gid; }
            }
          }
        } else if (fmt === 12) {
          var ng = dv.getUint32(o + 12);
          for (var q = 0; q < ng; q++) { var a = dv.getUint32(o + 16 + q * 12), b = dv.getUint32(o + 20 + q * 12), g0 = dv.getUint32(o + 24 + q * 12); for (var z = a; z <= b && z - a < 65536; z++) { map[z] = g0 + (z - a); } }
        } else { continue; }
      } catch (err) { continue; }
      out.push({ pid: pid, eid: eid, map: map });
    }
    return out;
  }
  function glyphRange(f, gid) {
    var dv = f.dv, l = f.t.loca.off;
    if (gid + 1 > f.numGlyphs) { return null; }
    var a, b;
    if (f.longLoca) { a = dv.getUint32(l + gid * 4); b = dv.getUint32(l + gid * 4 + 4); }
    else { a = dv.getUint16(l + gid * 2) * 2; b = dv.getUint16(l + gid * 2 + 2) * 2; }
    return b > a ? [f.t.glyf.off + a, b - a] : null;
  }
  /* 回傳 { comps: [gid...] } 或 { pts: [[x,y]...] } 或 null（空字形） */
  function readGlyph(f, gid) {
    if (!f.t.glyf || !f.t.loca) { return null; }
    var r = glyphRange(f, gid);
    if (!r) { return null; }
    var dv = f.dv, o = r[0], nc = dv.getInt16(o);
    if (nc < 0) {
      var comps = [], p = o + 10, flags;
      do {
        flags = dv.getUint16(p); var g = dv.getUint16(p + 2); p += 4;
        p += (flags & 1) ? 4 : 2;
        if (flags & 8) { p += 2; } else if (flags & 0x40) { p += 4; } else if (flags & 0x80) { p += 8; }
        comps.push(g);
      } while (flags & 0x20 && comps.length < 32);
      return { comps: comps };
    }
    if (nc === 0) { return null; }
    var endPts = [], q = o + 10;
    for (var i = 0; i < nc; i++) { endPts.push(dv.getUint16(q)); q += 2; }
    var np = endPts[nc - 1] + 1, il = dv.getUint16(q); q += 2 + il;
    var fl = [];
    while (fl.length < np) { var fv = f.u8[q++]; fl.push(fv); if (fv & 8) { var rep = f.u8[q++]; for (var rr = 0; rr < rep; rr++) { fl.push(fv); } } }
    var xs = [], ys = [], x = 0, y = 0, k;
    for (k = 0; k < np; k++) { var fx = fl[k]; if (fx & 2) { var dx = f.u8[q++]; x += (fx & 16) ? dx : -dx; } else if (!(fx & 16)) { x += dv.getInt16(q); q += 2; } xs.push(x); }
    for (k = 0; k < np; k++) { var fy = fl[k]; if (fy & 4) { var dy = f.u8[q++]; y += (fy & 32) ? dy : -dy; } else if (!(fy & 32)) { y += dv.getInt16(q); q += 2; } ys.push(y); }
    var pts = []; for (k = 0; k < np; k++) { pts.push([xs[k], ys[k]]); }
    return { pts: pts };
  }
  function shapeKey(f, gid, depth) {
    var g = readGlyph(f, gid);
    if (!g) { return null; }
    if (g.comps) { return (g.comps.length === 1 && (depth || 0) < 4) ? shapeKey(f, g.comps[0], (depth || 0) + 1) : null; }
    var mx = Infinity, my = Infinity;
    g.pts.forEach(function (p) { mx = Math.min(mx, p[0]); my = Math.min(my, p[1]); });
    return g.pts.length + ':' + g.pts.map(function (p) { return Math.round((p[0] - mx) / 4) + ',' + Math.round((p[1] - my) / 4); }).join(' ');
  }

  /* ---------- ToUnicode 對照表 ---------- */
  function hexToStr(h) {
    var s = '';
    for (var i = 0; i + 4 <= h.length; i += 4) { s += String.fromCharCode(parseInt(h.substr(i, 4), 16)); }
    if (h.length % 4 === 2) { s += String.fromCharCode(parseInt(h.substr(h.length - 2), 16)); }
    return s;
  }
  function strToHex(s) {
    var h = '';
    for (var i = 0; i < s.length; i++) { h += ('0000' + s.charCodeAt(i).toString(16).toUpperCase()).slice(-4); }
    return h;
  }
  function parseToUnicode(txt) {
    var map = {}, bytes = 1, m;
    var cs = /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(txt);
    if (cs) { bytes = cs[1].length / 2; }
    var reChar = /beginbfchar([\s\S]*?)endbfchar/g;
    while ((m = reChar.exec(txt))) {
      var re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g, p;
      while ((p = re.exec(m[1]))) { map[parseInt(p[1], 16)] = hexToStr(p[2]); }
    }
    var reRange = /beginbfrange([\s\S]*?)endbfrange/g;
    while ((m = reRange.exec(txt))) {
      var re2 = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]*)>|\[([^\]]*)\])/g, q;
      while ((q = re2.exec(m[1]))) {
        var lo = parseInt(q[1], 16), hi = parseInt(q[2], 16);
        if (hi - lo > 65535) { continue; }
        if (q[3] !== undefined) {
          var base = q[3];
          for (var c = lo; c <= hi; c++) {
            var h = base;
            if (h.length >= 4) { var last = parseInt(h.slice(-4), 16) + (c - lo); h = h.slice(0, -4) + ('0000' + last.toString(16)).slice(-4); }
            map[c] = hexToStr(h);
          }
        } else {
          var arr = q[4].match(/<([0-9a-fA-F]*)>/g) || [];
          for (var c2 = lo; c2 <= hi && c2 - lo < arr.length; c2++) { map[c2] = hexToStr(arr[c2 - lo].slice(1, -1)); }
        }
      }
    }
    return { map: map, bytes: bytes };
  }
  function buildToUnicode(map, bytes) {
    var codes = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
    var hx = function (c) { return ('0000' + c.toString(16).toUpperCase()).slice(-bytes * 2); };
    var out = ['/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap',
      '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
      '/CMapName /Adobe-Identity-UCS def', '/CMapType 2 def',
      '1 begincodespacerange', '<' + hx(0) + '> <' + (bytes === 1 ? 'FF' : 'FFFF') + '>', 'endcodespacerange'];
    for (var i = 0; i < codes.length; i += 100) {
      var chunk = codes.slice(i, i + 100);
      out.push(chunk.length + ' beginbfchar');
      chunk.forEach(function (c) { out.push('<' + hx(c) + '> <' + strToHex(map[c]) + '>'); });
      out.push('endbfchar');
    }
    out.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
    return out.join('\n');
  }
  function goodStr(s) { return typeof s === 'string' && s.length > 0 && !/[\u0000\uFFFD\uE000-\uF8FF]/.test(s); }

  /* ---------- 主流程 ---------- */
  async function fixPdfBytes(bytes) {
    var report = { fonts: 0, fixedFonts: [], codes: 0, byName: 0, byComposite: 0, byShape: 0, unresolved: 0, error: null, textMaps: {} };
    var L = root.PDFLib;
    if (!L) { report.error = '沒有載入 pdf-lib'; return { bytes: bytes, report: report }; }
    var doc;
    try { doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false }); }
    catch (err) { report.error = '讀不了 PDF 結構：' + String(err && err.message || err).slice(0, 80); return { bytes: bytes, report: report }; }
    var ctx = doc.context, N = L.PDFName, changed = false;
    var get = function (d, k) { try { return d.lookup(N.of(k)); } catch (e) { return undefined; } };
    var streamBytes = function (s) { try { return L.decodePDFRawStream(s).decode(); } catch (e) { try { return s.getContents(); } catch (e2) { return null; } } };
    var nameOf = function (v) { return v && v.asString ? v.asString() : (v ? String(v) : ''); };
    var objs = ctx.enumerateIndirectObjects();
    for (var oi = 0; oi < objs.length; oi++) {
      var obj = objs[oi][1];
      if (!(obj instanceof L.PDFDict)) { continue; }
      var type = get(obj, 'Type'), sub = nameOf(get(obj, 'Subtype'));
      if (!type || nameOf(type) !== '/Font' || (sub !== '/Type0' && sub !== '/TrueType')) { continue; }
      report.fonts++;
      try {
        var isCID = sub === '/Type0', fdHost = obj, cidToGid = null;
        if (isCID) {
          var enc = nameOf(get(obj, 'Encoding'));
          if (enc !== '/Identity-H' && enc !== '/Identity-V') { continue; }
          var desc = get(obj, 'DescendantFonts');
          fdHost = desc && desc.lookup ? desc.lookup(0) : null;
          if (!fdHost) { continue; }
          var c2g = get(fdHost, 'CIDToGIDMap');
          if (c2g && !(c2g instanceof L.PDFName)) {
            var mb = streamBytes(c2g); cidToGid = {};
            if (mb) { for (var ci = 0; ci + 1 < mb.length; ci += 2) { cidToGid[ci / 2] = (mb[ci] << 8) | mb[ci + 1]; } }
          }
        }
        var fd = get(fdHost, 'FontDescriptor');
        var ff = fd ? get(fd, 'FontFile2') : null;
        if (!ff) { continue; }
        var fb = streamBytes(ff);
        if (!fb || fb.length < 12) { continue; }
        var font = parseTT(fb);
        var tuStream = get(obj, 'ToUnicode');
        var tu = { map: {}, bytes: isCID ? 2 : 1 };
        if (tuStream && tuStream.dict) {
          var tb = streamBytes(tuStream);
          if (tb) { var tx = ''; for (var bi = 0; bi < tb.length; bi++) { tx += String.fromCharCode(tb[bi]); } tu = parseToUnicode(tx); }
        }
        /* 字碼 → 字形編號 */
        var code2gid = {}, gid2code = {};
        if (isCID) {
          for (var g0 = 0; g0 < font.numGlyphs; g0++) { code2gid[g0] = g0; }
          if (cidToGid) { code2gid = cidToGid; }
        } else {
          var pick = null;
          font.cmaps.forEach(function (c) { if (c.pid === 3 && c.eid === 0) { pick = pick || { m: c.map, sym: true }; } });
          font.cmaps.forEach(function (c) { if (c.pid === 1 && c.eid === 0) { pick = pick || { m: c.map }; } });
          font.cmaps.forEach(function (c) { if (c.pid === 3 && c.eid === 1) { pick = pick || { m: c.map }; } });
          if (!pick) { continue; }
          for (var cc = 0; cc < 256; cc++) { var gg = pick.m[cc] || (pick.sym ? pick.m[0xF000 + cc] : 0); if (gg) { code2gid[cc] = gg; } }
        }
        Object.keys(code2gid).forEach(function (c) { var g = code2gid[c]; if (gid2code[g] === undefined) { gid2code[g] = Number(c); } });
        /* 已知可靠的字形 → 文字 */
        var gidText = {};
        Object.keys(tu.map).forEach(function (c) { var g = code2gid[c]; if (g !== undefined && goodStr(tu.map[c]) && THAI.test(tu.map[c])) { gidText[g] = tu.map[c]; } });
        /* 組合字形：子字形 → 父字形 */
        var parents = {}, shapes = {};
        var hasGlyf = !!(font.t.glyf && font.t.loca);
        var newMap = {}, fixedHere = 0, textMap = {};
        Object.keys(tu.map).forEach(function (c) { if (goodStr(tu.map[c])) { newMap[c] = tu.map[c]; } });
        var codes = Object.keys(code2gid).map(Number);
        var candidates = [];
        codes.forEach(function (c) {
          var g = code2gid[c], cur = tu.map[c];
          var nm = nameToUni(font.names[g]);
          var bad = !goodStr(cur);
          var garbage = !bad && !THAI.test(cur) && nm && (!isCID ? true : /^[\x20-\x7E -ɏ]+$/.test(cur));
          if (!bad && !garbage) { return; }
          if (bad && cur === undefined && !nm && !(hasGlyf && readGlyph(font, g))) { return; }
          candidates.push({ c: c, g: g, nm: nm, cur: cur });
        });
        if (!candidates.length) { continue; }
        if (hasGlyf && candidates.some(function (x) { return !x.nm; })) {
          for (var pg = 0; pg < font.numGlyphs; pg++) {
            var gl = readGlyph(font, pg);
            if (gl && gl.comps && gl.comps.length === 1) { (parents[gl.comps[0]] = parents[gl.comps[0]] || []).push(pg); }
          }
          Object.keys(gidText).forEach(function (g) { var t = gidText[g]; if (t.length === 1) { var k = shapeKey(font, Number(g)); if (k && !shapes[k]) { shapes[k] = t; } } });
        }
        candidates.forEach(function (x) {
          var val = null, how = null;
          if (x.nm) { val = x.nm; how = 'byName'; }
          if (!val && parents[x.g]) {
            for (var pi = 0; pi < parents[x.g].length; pi++) {
              var pgid = parents[x.g][pi];
              var t = gidText[pgid];
              if (!t && gid2code[pgid] !== undefined) { var pc = tu.map[gid2code[pgid]]; if (goodStr(pc) && THAI.test(pc)) { t = pc; } }
              if (t) { val = t; how = 'byComposite'; break; }
            }
          }
          if (!val && hasGlyf) { var k2 = shapeKey(font, x.g); if (k2 && shapes[k2]) { val = shapes[k2]; how = 'byShape'; } }
          if (val && !isCID) {
            /* 簡單字型：不改 PDF（改了會讓 PDF.js 算錯字寬），改成記下「亂碼字 → 正確文字」，取出文字後再換 */
            if (typeof x.cur === 'string' && x.cur.length === 1 && x.cur !== ' ') { textMap[x.cur] = val; fixedHere++; report[how]++; }
            else if (x.cur !== undefined) { report.unresolved++; }
          }
          else if (val) { newMap[x.c] = val; fixedHere++; report[how]++; }
          else if (x.cur !== undefined) { report.unresolved++; }
        });
        if (fixedHere) {
          var fname = nameOf(get(obj, 'BaseFont')).replace(/^\/([A-Z]{6}\+)?/, '');
          report.fixedFonts.push(fname + '（' + fixedHere + '）');
          report.codes += fixedHere;
          if (!isCID) { report.textMaps[nameOf(get(obj, 'BaseFont')).replace(/^\//, '')] = textMap; continue; }
          var cm = buildToUnicode(newMap, tu.bytes);
          var ref = ctx.register(ctx.flateStream(cm));
          obj.set(N.of('ToUnicode'), ref);
          changed = true;
        }
      } catch (err) { report.error = (report.error ? report.error + '；' : '') + String(err && err.message || err).slice(0, 60); }
    }
    if (!changed) { return { bytes: bytes, report: report }; }
    try {
      var out = await doc.save({ useObjectStreams: false, updateFieldAppearances: false, addDefaultPage: false });
      return { bytes: out, report: report };
    } catch (err) {
      report.error = '修好後存檔失敗：' + String(err && err.message || err).slice(0, 80);
      return { bytes: bytes, report: report };
    }
  }

  /* ---------- 文字層面的整理 ---------- */
  function cleanText(s) {
    var stats = { nulls: 0 };
    s = mapPUA(s);
    s = s.replace(/ํ([่-๋]?)า/g, '$1ำ');
    s = s.replace(/([่-์]+)([ัิ-ื็])/g, '$2$1');
    s = s.replace(/([่-์]+)([ุ-ฺ])/g, '$2$1');
    s = s.replace(/[⺀-⻳⼀-⿕豈-﫿]/g, function (c) { return c.normalize('NFKC'); });
    s = s.replace(/[\u0000\uFFFD]/g, function () { stats.nulls++; return ''; });
    return { text: s, nulls: stats.nulls };
  }
  /* 泰文字中間夾著拉丁字母或符號（例如 ไ%ห'น）：通常代表文字對照表壞掉 */
  var SANDWICH = /[ก-๎][A-Za-z!-\/:-@\[-`{-~\u0080-ɏ‐-™]{1,2}(?=[ก-๎])/g;
  function garbageCount(s) { var m = s.match(SANDWICH); return m ? m.length : 0; }

  root.ThaiPdfFix = { fixPdfBytes: fixPdfBytes, cleanText: cleanText, garbageCount: garbageCount, nameToUni: nameToUni };
})(typeof window !== 'undefined' ? window : globalThis);
