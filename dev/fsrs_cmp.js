const fs = require('fs');
const DAY = 864e5; let src = fs.readFileSync(__dirname + '/fsrs_ui.js', 'utf8');
const BOX_DAYS = [0, 1, 3, 7, 14]; const today0 = () => 0;
eval(src + '; global.fsNext = fsNext; global.fsIvl = fsIvl;');
const ref = JSON.parse(fs.readFileSync(__dirname + '/fsrs_ref.json', 'utf8'));
const gaps = [0, 3, 8, 20, 40]; let maxErr = 0;
for (const r of ref) {
  const c = { seen: 0, ivl: 0 }; let t = Date.UTC(2026, 0, 1); const mine = [];
  r.seq.forEach((g, i) => { if (i) { t += gaps[i] * DAY; } const n = fsNext(c, g - 1, t); c.fs = { s: n.s, d: n.d, t }; c.seen = 1; mine.push([+n.s.toFixed(4), +n.d.toFixed(4), fsIvl(n.s)]); });
  r.res.forEach((x, i) => { maxErr = Math.max(maxErr, Math.abs(x[0] - mine[i][0]) / x[0], Math.abs(x[1] - mine[i][1])); });
  console.log(r.seq.join(''), 'ref', JSON.stringify(r.res), '\n     mine', JSON.stringify(mine));
}
console.log('max relative error', maxErr.toFixed(5));
