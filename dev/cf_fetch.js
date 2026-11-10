// ไทย Reader：「貼上網址就匯入」用的小程式（Cloudflare Pages Functions，網址 /api/fetch?url=...）
// 網頁 App 不能直接讀別的網站，所以由這支程式代為抓取那一頁的 HTML，交回給 App 自己整理出文章內文。
// 只接受 ไทย Reader 自己網站發出的請求，只抓 http/https 的網頁，最多 3 MB，不保存任何內容。

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 15000;

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
  });
}

function blockedHost(host) {
  host = host.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || /\.(local|localhost|internal|lan|home|arpa)$/.test(host)) { return true; }
  if (host.indexOf(':') >= 0 || host.charAt(0) === '[') { return true; } // IPv6 位址
  if (/^\d+(\.\d+){3}$/.test(host)) { return true; } // 直接用 IP 的不抓
  return false;
}

/* 抓一個網址，讀到 3 MB 為止 */
async function grab(url, headers, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(function () { ctl.abort(); }, ms);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: headers, cf: { cacheTtl: 600, cacheEverything: true } });
    const out = { status: res.status, type: res.headers.get('content-type') || '', finalUrl: res.url || url };
    if (!res.ok) { try { await res.body.cancel(); } catch (e) {} return out; }
    const reader = res.body.getReader(), chunks = [];
    let total = 0, cut = false;
    for (;;) {
      const r = await reader.read();
      if (r.done) { break; }
      total += r.value.byteLength;
      if (total > MAX_BYTES) { chunks.push(r.value.slice(0, r.value.byteLength - (total - MAX_BYTES))); cut = true; try { await reader.cancel(); } catch (e) {} break; }
      chunks.push(r.value);
    }
    const body = new Uint8Array(Math.min(total, MAX_BYTES));
    let at = 0;
    for (const c of chunks) { body.set(c, at); at += c.byteLength; }
    out.body = body; out.cut = cut; out.ok = true;
    return out;
  } catch (e) {
    return { error: ctl.signal.aborted ? 'timeout' : 'network' };
  } finally { clearTimeout(timer); }
}
/* 被擋的樣子：錯誤碼，或是「請稍候、驗證你是真人」的頁面 */
function looksBlocked(r) {
  if (!r || r.error) { return true; }
  if (!r.ok) { return true; }
  if (r.body && r.body.byteLength < 60000) {
    const head = new TextDecoder('utf-8', { fatal: false }).decode(r.body.subarray(0, 60000));
    if (/cf-browser-verification|challenge-platform|_cf_chl_opt|<title>\s*(Just a moment|Attention Required|Access denied|Please Wait)|captcha-delivery|px-captcha|Pardon Our Interruption/i.test(head)) { return true; }
  }
  return false;
}

export async function onRequestGet(context) {
  const request = context.request;
  const self = new URL(request.url);
  /* 只接受自己網站的請求，避免被別人拿去當代理 */
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer') || '';
  const sameSite = site === 'same-origin' || (origin && origin === self.origin) || referer.indexOf(self.origin + '/') === 0;
  if (!sameSite) { return json({ ok: false, error: 'forbidden' }, 403); }

  let target;
  try { target = new URL(self.searchParams.get('url') || ''); } catch (e) { return json({ ok: false, error: 'bad_url' }, 400); }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') { return json({ ok: false, error: 'bad_url' }, 400); }
  if (target.username || target.password || blockedHost(target.hostname)) { return json({ ok: false, error: 'blocked' }, 400); }
  if (target.port && target.port !== '80' && target.port !== '443') { return json({ ok: false, error: 'blocked' }, 400); }

  const viaReader = self.searchParams.get('via') === 'reader';
  let got = null, firstErr = null;
  if (!viaReader) {
    got = await grab(target.toString(), {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'th-TH,th;q=0.9,en;q=0.7'
    }, TIMEOUT_MS);
    if (got.error || looksBlocked(got)) { firstErr = got.error ? got : { error: 'status', status: got.status || 403 }; got = null; }
  }
  /* 網站擋掉了（或內容要用程式載入）：改請「Jina Reader」代為用瀏覽器打開，拿回整理前的網頁 */
  if (!got) {
    /* 有設定自己的金鑰（Cloudflare 的環境變數 JINA_API_KEY）就用它，額度大很多；沒有就用不需要帳號的免費額度 */
    const key = context.env && context.env.JINA_API_KEY;
    const jh = { 'accept': 'text/html', 'x-return-format': 'html', 'x-timeout': '20' };
    const jurl = 'https://r.jina.ai/' + target.toString();
    let r2 = await grab(jurl, key ? Object.assign({ authorization: 'Bearer ' + key }, jh) : jh, 30000);
    /* 金鑰的額度用完或失效：改用免費額度 */
    if (key && (r2.status === 401 || r2.status === 402 || r2.status === 403)) { r2 = await grab(jurl, jh, 30000); }
    /* 太多人同時用（429）：等兩秒再試一次 */
    if (r2.status === 429) { await new Promise(function (ok) { setTimeout(ok, 2000); }); r2 = await grab(jurl, key ? Object.assign({ authorization: 'Bearer ' + key }, jh) : jh, 30000); }
    if (r2.error || looksBlocked(r2)) {
      const e = firstErr || r2;
      return json({ ok: false, error: e.error || 'status', status: e.status || r2.status || 0, reader: r2.status || r2.error || 0 }, 502);
    }
    got = r2; got.via = 'reader'; got.finalUrl = target.toString();
  }
  if (got.finalUrl) { try { if (blockedHost(new URL(got.finalUrl).hostname)) { return json({ ok: false, error: 'blocked' }, 400); } } catch (e) {} }
  if (got.type && !/text\/html|application\/xhtml|text\/plain/i.test(got.type)) { return json({ ok: false, error: 'not_html', type: got.type.split(';')[0] }, 415); }
  const body = got.body, cut = got.cut, type = got.type || '', finalUrl = got.finalUrl || target.toString();
  /* 原始內容直接交回（編碼由 App 判斷，泰文舊網站可能是 TIS-620） */
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'x-final-url': encodeURI(finalUrl),
      'x-source-type': type.slice(0, 200),
      'x-truncated': cut ? '1' : '0',
      'x-via': got.via || 'direct',
      'cache-control': 'private, max-age=300',
      'x-content-type-options': 'nosniff'
    }
  });
}
