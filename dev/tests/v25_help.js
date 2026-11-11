const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch();
  for (const lang of ['zh', 'en']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.setDefaultTimeout(5000);
    await p.goto(URL); await p.evaluate(l => { localStorage.clear(); localStorage.setItem('thai-welcome-v1', '1'); localStorage.setItem('thai-quest-quiet', '1'); if (l === 'en') { localStorage.setItem('thai-ui-lang', 'en'); } }, lang);
    await p.reload(); await p.waitForTimeout(1200);
    await p.click('.tabbar [data-tab="settings"]'); await p.waitForTimeout(300);
    await p.evaluate(() => window.settingsOpen('help')); await p.waitForTimeout(200); await p.click('#openHelp'); await p.waitForTimeout(300);
    const n = await p.locator('#helpTabs button').count(); let all = '';
    for (let i = 0; i < n; i++) { await p.locator('#helpTabs button').nth(i).click(); await p.waitForTimeout(120); await p.evaluate(() => document.querySelectorAll('#helpBody details').forEach(d => d.open = true)); all += '\n##' + i + '\n' + (await p.locator('#helpBody').innerText()); }
    const keys = lang === 'zh' ? ['多選文件', '匯出生字卡', '上次複習和篩選', '再點一下同一個分頁'] : ['Select several documents', 'Export flashcards', 'Last reviewed and filtering', 'tap the same tab once more'];
    console.log(lang, 'tabs', n, keys.map(k => k + '=' + all.toLowerCase().includes(k.toLowerCase())).join(' | '));
    if (lang === 'zh') { const i = all.indexOf('多選文件'); console.log(all.slice(i, i + 330).replace(/\n+/g, ' / ')); }
    await ctx.close();
  }
  await b.close();
})();
