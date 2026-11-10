import { onRequestGet } from './fetch.mjs';
const T = 'text/html; charset=utf-8';
const PAGES = {
  'https://ok.example.co.th/a': [200, T, '<p>สวัสดี direct</p>'],
  'https://www.bbc.com/thai/articles/x': [403, T, 'Forbidden'],
  'https://r.jina.ai/https://www.bbc.com/thai/articles/x': [200, T, '<html><p>ข่าวจาก reader</p></html>'],
  'https://cf.example.com/b': [200, T, '<html><head><title>Just a moment...</title></head><body>challenge-platform</body></html>'],
  'https://r.jina.ai/https://cf.example.com/b': [200, T, '<p>ผ่านแล้ว</p>'],
  'https://dead.example.com/c': [403, T, 'no'],
  'https://r.jina.ai/https://dead.example.com/c': [451, T, 'no'],
  'https://js.example.com/d': [200, T, '<div id=app></div>'],
  'https://r.jina.ai/https://js.example.com/d': [200, T, '<p>เนื้อหาที่โหลดด้วยสคริปต์</p>'],
};
const calls = [];
globalThis.fetch = async (u, opt) => { calls.push(u); const p = PAGES[u]; if (!p) throw new Error('net'); const r = new Response(p[2], { status: p[0], headers: { 'content-type': p[1] } }); Object.defineProperty(r, 'url', { value: u }); return r; };
const SELF = 'https://thai-reader-enn.pages.dev';
async function call(target, extra) {
  calls.length = 0;
  const r = await onRequestGet({ request: new Request(SELF + '/api/fetch?url=' + encodeURIComponent(target) + (extra || ''), { headers: { 'sec-fetch-site': 'same-origin' } }) });
  const ct = r.headers.get('content-type');
  const body = /json/.test(ct) ? JSON.stringify(await r.json()) : new TextDecoder().decode(await r.arrayBuffer());
  return [r.status, r.headers.get('x-via'), decodeURI(r.headers.get('x-final-url') || ''), body, 'calls=' + calls.length].join(' | ');
}
console.log('direct ok  ', await call('https://ok.example.co.th/a'));
console.log('bbc 403    ', await call('https://www.bbc.com/thai/articles/x'));
console.log('challenge  ', await call('https://cf.example.com/b'));
console.log('both fail  ', await call('https://dead.example.com/c'));
console.log('forced     ', await call('https://js.example.com/d', '&via=reader'));
