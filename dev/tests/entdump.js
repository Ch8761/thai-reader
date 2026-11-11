const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.setDefaultTimeout(8000);
  await p.goto('http://127.0.0.1:8765/index.html'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); }); await p.reload(); await p.waitForTimeout(1500);
  const R = JSON.parse(fs.readFileSync('reader.json', 'utf8')); const out = [];
  for (const it of R) {
    const r = await p.evaluate(t => window.__ev("(function(){ var id='text:x'+Date.now(); lib.docs.push({id:id,name:'x',type:'text',size:1,added:1,opened:0,folder:''}); localStorage.setItem(PDF_DOC_PREFIX+id, JSON.stringify({text:" + JSON.stringify(t) + ",src:{type:'text',id:id,name:'x'},hl:[],strokes:[],boxes:[],nextId:1})); return id; })()"), it.text);
    await p.evaluate(id => window.__ev("openDoc('" + id + "')"), r); await p.waitForTimeout(500);
    const es = await p.evaluate(() => window.__ev("JSON.stringify(getEnts().map(function(e){return state.text.slice(e.s,e.e)+'='+e.type+(e.info&&e.info.zh?'('+e.info.zh+')':'')}))"));
    out.push(it.id + ' ' + it.zh + ': ' + JSON.parse(es).join(', '));
  }
  console.log(out.join('\n')); await b.close();
})();
