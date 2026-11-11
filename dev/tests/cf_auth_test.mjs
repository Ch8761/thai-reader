import { onRequestGet, onRequestPost } from './cf_auth.mjs';
let calls = [];
globalThis.fetch = async (url, o) => {
  calls.push({ url: String(url), body: o && o.body });
  const b = new URLSearchParams(o && o.body || '');
  if (String(url).includes('/revoke')) return new Response('{}', { status: 200 });
  if (b.get('grant_type') === 'authorization_code') {
    if (b.get('code') === 'good') return new Response(JSON.stringify({ access_token: 'AT1', expires_in: 3599, refresh_token: 'RT1', scope: 'x drive.appdata' }), { status: 200 });
    return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
  }
  if (b.get('grant_type') === 'refresh_token') {
    if (b.get('refresh_token') === 'RT1') return new Response(JSON.stringify({ access_token: 'AT2', expires_in: 3599 }), { status: 200 });
    return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
  }
  return new Response('{}', { status: 500 });
};
const O = 'https://thai-reader-enn.pages.dev';
const req = (body, h = {}) => new Request(O + '/api/auth', { method: 'POST', body: JSON.stringify(body), headers: Object.assign({ 'sec-fetch-site': 'same-origin' }, h) });
const env = { GOOGLE_CLIENT_SECRET: 's3' };
let ok = 0, bad = 0; const t = (n, c) => { if (c) ok++; else { bad++; console.log('FAIL', n); } };
let r = await onRequestGet({ request: new Request(O + '/api/auth'), env });
t('get enabled', (await r.json()).enabled === true);
r = await onRequestGet({ request: new Request(O + '/api/auth'), env: {} });
t('get disabled', (await r.json()).enabled === false);
r = await onRequestPost({ request: req({ action: 'code', code: 'good', redirect_uri: O + '/' }), env });
let j = await r.json(); const ck = r.headers.get('set-cookie') || '';
t('code ok', j.access_token === 'AT1' && j.refresh === true && !JSON.stringify(j).includes('RT1'));
t('cookie', /tr_rt=RT1;.*HttpOnly.*Secure.*SameSite=Strict/.test(ck) && /Path=\/api\//.test(ck));
t('secret sent', calls.at(-1).body.includes('client_secret=s3'));
r = await onRequestPost({ request: req({ action: 'code', code: 'good', redirect_uri: 'https://evil.com/' }), env });
t('bad redirect', r.status === 400);
r = await onRequestPost({ request: req({ action: 'code', code: 'good', redirect_uri: O + '/' }, { 'sec-fetch-site': 'cross-site', origin: 'https://evil.com' }), env });
t('cross site', r.status === 403);
r = await onRequestPost({ request: req({ action: 'refresh' }, { cookie: 'tr_rt=RT1' }), env });
j = await r.json(); t('refresh', j.access_token === 'AT2');
r = await onRequestPost({ request: req({ action: 'refresh' }, { cookie: 'tr_rt=DEAD' }), env });
t('refresh dead', r.status === 401 && /Max-Age=0/.test(r.headers.get('set-cookie') || ''));
r = await onRequestPost({ request: req({ action: 'refresh' }), env });
t('refresh none', r.status === 401);
r = await onRequestPost({ request: req({ action: 'refresh' }, { cookie: 'tr_rt=RT1' }), env: {} });
t('no secret', r.status === 501);
calls = [];
r = await onRequestPost({ request: req({ action: 'logout' }, { cookie: 'tr_rt=RT1' }), env });
t('logout', r.status === 200 && calls.some(c => c.url.includes('revoke')) && /Max-Age=0/.test(r.headers.get('set-cookie')));
console.log('ok', ok, 'bad', bad);
