import { onRequestGet } from './fetch.mjs';
const PAGES = {
  'https://news.example.co.th/a/1': { status: 200, type: 'text/html; charset=utf-8', body: '<html><head><title>ข่าว</title></head><body><p>สวัสดีครับ</p></body></html>' },
  'https://news.example.co.th/pdf': { status: 200, type: 'application/pdf', body: '%PDF' },
  'https://news.example.co.th/403': { status: 403, type: 'text/html', body: 'no' },
  'https://news.example.co.th/big': { status: 200, type: 'text/html', body: 'x'.repeat(3.5 * 1024 * 1024) },
};
globalThis.fetch = async (u, opt) => { const p = PAGES[u]; if (!p) throw new Error('net'); const r = new Response(p.body, { status: p.status, headers: { 'content-type': p.type } }); Object.defineProperty(r, 'url', { value: u }); return r; };
const SELF = 'https://thai-reader-enn.pages.dev';
async function call(target, headers) {
  const req = new Request(SELF + '/api/fetch?url=' + encodeURIComponent(target), { headers: headers || { 'sec-fetch-site': 'same-origin' } });
  const r = await onRequestGet({ request: req });
  const ct = r.headers.get('content-type');
  const body = /json/.test(ct) ? await r.json() : (await r.arrayBuffer()).byteLength;
  return [r.status, body, r.headers.get('x-final-url'), r.headers.get('x-source-type'), r.headers.get('x-truncated')];
}
console.log('ok      ', JSON.stringify(await call('https://news.example.co.th/a/1')));
console.log('cross   ', JSON.stringify(await call('https://news.example.co.th/a/1', { 'sec-fetch-site': 'cross-site', origin: 'https://evil.com' })));
console.log('referer ', JSON.stringify(await call('https://news.example.co.th/a/1', { referer: SELF + '/' })));
console.log('local   ', JSON.stringify(await call('http://localhost/x')));
console.log('ip      ', JSON.stringify(await call('http://169.254.169.254/latest')));
console.log('ftp     ', JSON.stringify(await call('ftp://x.com/a')));
console.log('pdf     ', JSON.stringify(await call('https://news.example.co.th/pdf')));
console.log('403     ', JSON.stringify(await call('https://news.example.co.th/403')));
console.log('big     ', JSON.stringify(await call('https://news.example.co.th/big')));
console.log('netfail ', JSON.stringify(await call('https://nope.example.com/')));
