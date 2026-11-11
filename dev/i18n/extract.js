const fs = require('fs'), acorn = require('acorn'), walk = require('acorn-walk');
const html = fs.readFileSync('../srv/index.html', 'utf8');
const cjk = /[一-鿿]/;
const lits = new Map();
const re = /<script(?![^>]*type="(?:application\/json|text\/plain)")[^>]*>([\s\S]*?)<\/script>/g; let m, idx = 0;
while ((m = re.exec(html))) {
  const code = m[1]; idx++;
  if (/^\s*window\.GRAMMAR/.test(code)) continue;
  let ast; try { ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script', locations: true }); } catch (e) { console.error('parse fail', idx, code.length, e.message); continue; }
  // skip HELP array
  const helpRanges = [];
  walk.simple(ast, { AssignmentExpression(n) { if (n.left.type === 'MemberExpression' && n.left.property && n.left.property.name === 'GRAMMAR') helpRanges.push([n.right.start, n.right.end]); }, VariableDeclarator(n) { if ((n.id.name === 'HELP' || n.id.name === 'CHECKS') && n.init) helpRanges.push([n.init.start, n.init.end]); } });
  walk.simple(ast, {
    Literal(n) { if (typeof n.value === 'string' && cjk.test(n.value) && !helpRanges.some(r => n.start >= r[0] && n.end <= r[1])) { if (n.value.length < 2000) lits.set(n.value, (lits.get(n.value) || 0) + 1); } },
    TemplateElement(n) { const v = n.value.cooked; if (v && cjk.test(v)) lits.set(v, (lits.get(v) || 0) + 1); }
  });
}
// static HTML text outside scripts
const body = html.replace(/<details class="testtools">[\s\S]*?<\/details>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
for (const mm of body.matchAll(/>([^<>]+)</g)) { const t = mm[1].trim(); if (cjk.test(t)) lits.set(t, (lits.get(t) || 0) + 1); }
for (const mm of body.matchAll(/(?:placeholder|aria-label|title|alt)="([^"]+)"/g)) { const t = mm[1].trim(); if (cjk.test(t)) lits.set(t, (lits.get(t) || 0) + 1); }
const arr = [...lits.keys()];
fs.writeFileSync('lits.json', JSON.stringify(arr, null, 0).replace(/","/g, '",\n"'));
console.log('literals', arr.length, 'chars', arr.reduce((a, x) => a + x.length, 0), 'cjk', arr.reduce((a, x) => a + (x.match(/[一-鿿]/g) || []).length, 0));
