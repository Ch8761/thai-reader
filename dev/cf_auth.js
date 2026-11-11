// ไทย Reader：雲端同步的「自動續登入」小程式（Cloudflare Pages Functions，網址 /api/auth）
// Google 給網頁 App 的登入一小時就失效。這支程式用 Google 的「授權碼」換一把可以續期的鑰匙（refresh token），
// 鑰匙只放在使用者自己瀏覽器的 HttpOnly cookie 裡（網頁程式讀不到、也不會存在伺服器上），之後要同步時用它換新的登入。
// 需要在 Cloudflare 的環境變數設定 GOOGLE_CLIENT_SECRET（Google Cloud 的 OAuth 用戶端密鑰）；沒設定時 App 會改用原本每小時登入一次的方式。

const CLIENT_ID = '268036065948-eonf124to1ccbpg76ibvur6bjcoqit00.apps.googleusercontent.com';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const COOKIE = 'tr_rt';

function json(obj, status, cookie) {
  const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  if (cookie) { h['set-cookie'] = cookie; }
  return new Response(JSON.stringify(obj), { status: status || 200, headers: h });
}
function sameSite(request) {
  const self = new URL(request.url);
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer') || '';
  return site === 'same-origin' || (origin && origin === self.origin) || referer.indexOf(self.origin + '/') === 0;
}
function readCookie(request) {
  const c = request.headers.get('cookie') || '';
  const m = c.match(/(?:^|;\s*)tr_rt=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
function setCookie(v) { return COOKIE + '=' + encodeURIComponent(v) + '; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000'; }
function clearCookie() { return COOKIE + '=; Path=/api/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'; }
async function google(params) {
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() });
  let j = {};
  try { j = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, j: j };
}

/* 看這個網站有沒有開「自動續登入」 */
export async function onRequestGet(context) {
  const secret = context.env && context.env.GOOGLE_CLIENT_SECRET;
  return json({ enabled: !!secret, linked: !!readCookie(context.request) });
}

export async function onRequestPost(context) {
  const request = context.request;
  if (!sameSite(request)) { return json({ error: 'forbidden' }, 403); }
  const secret = context.env && context.env.GOOGLE_CLIENT_SECRET;
  let body = {};
  try { const t = await request.text(); if (t.length > 4000) { return json({ error: 'too_big' }, 413); } body = t ? JSON.parse(t) : {}; } catch (e) { return json({ error: 'bad_request' }, 400); }
  const action = body.action;

  if (action === 'logout') {
    const rt = readCookie(request);
    if (rt) { try { await fetch(REVOKE_URL + '?token=' + encodeURIComponent(rt), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } }); } catch (e) {} }
    return json({ ok: true }, 200, clearCookie());
  }
  if (!secret) { return json({ error: 'no_secret' }, 501); }

  /* 第一次：用 Google 給的授權碼換登入和可續期的鑰匙 */
  if (action === 'code') {
    const code = String(body.code || ''), redirect = String(body.redirect_uri || '');
    const self = new URL(request.url);
    if (!code || code.length > 2000) { return json({ error: 'bad_code' }, 400); }
    if (redirect !== 'postmessage' && redirect.indexOf(self.origin + '/') !== 0) { return json({ error: 'bad_redirect' }, 400); }
    const g = await google({ code: code, client_id: CLIENT_ID, client_secret: secret, redirect_uri: redirect, grant_type: 'authorization_code' });
    if (!g.ok || !g.j.access_token) { return json({ error: g.j.error || 'exchange_failed', status: g.status }, 400); }
    return json({ access_token: g.j.access_token, expires_in: g.j.expires_in || 3600, scope: g.j.scope || '', refresh: !!g.j.refresh_token },
      200, g.j.refresh_token ? setCookie(g.j.refresh_token) : null);
  }
  /* 之後：登入快過期時，用鑰匙換新的登入（使用者什麼都不用按） */
  if (action === 'refresh') {
    const rt = readCookie(request);
    if (!rt) { return json({ error: 'no_refresh' }, 401); }
    const g = await google({ refresh_token: rt, client_id: CLIENT_ID, client_secret: secret, grant_type: 'refresh_token' });
    if (!g.ok || !g.j.access_token) {
      const dead = g.j.error === 'invalid_grant';
      return json({ error: g.j.error || 'refresh_failed', status: g.status }, dead ? 401 : 502, dead ? clearCookie() : null);
    }
    return json({ access_token: g.j.access_token, expires_in: g.j.expires_in || 3600, scope: g.j.scope || '' });
  }
  return json({ error: 'bad_action' }, 400);
}
