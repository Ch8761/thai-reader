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

  const ctl = new AbortController();
  const timer = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
  let res;
  try {
    res = await fetch(target.toString(), {
      redirect: 'follow',
      signal: ctl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 ThaiReader/1.0',
        'accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'accept-language': 'th,en;q=0.7'
      },
      cf: { cacheTtl: 600, cacheEverything: true }
    });
  } catch (e) {
    clearTimeout(timer);
    return json({ ok: false, error: ctl.signal.aborted ? 'timeout' : 'network' }, 502);
  }
  const finalUrl = res.url || target.toString();
  try { if (blockedHost(new URL(finalUrl).hostname)) { clearTimeout(timer); return json({ ok: false, error: 'blocked' }, 400); } } catch (e) {}
  if (!res.ok) { clearTimeout(timer); return json({ ok: false, error: 'status', status: res.status }, 502); }
  const type = res.headers.get('content-type') || '';
  if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) { clearTimeout(timer); return json({ ok: false, error: 'not_html', type: type.split(';')[0] }, 415); }

  /* 讀到 3 MB 為止 */
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0, cut = false;
  try {
    for (;;) {
      const r = await reader.read();
      if (r.done) { break; }
      total += r.value.byteLength;
      if (total > MAX_BYTES) { chunks.push(r.value.slice(0, r.value.byteLength - (total - MAX_BYTES))); cut = true; try { await reader.cancel(); } catch (e) {} break; }
      chunks.push(r.value);
    }
  } catch (e) {
    clearTimeout(timer);
    return json({ ok: false, error: ctl.signal.aborted ? 'timeout' : 'network' }, 502);
  }
  clearTimeout(timer);
  const body = new Uint8Array(Math.min(total, MAX_BYTES));
  let at = 0;
  for (const c of chunks) { body.set(c, at); at += c.byteLength; }
  /* 原始內容直接交回（編碼由 App 判斷，泰文舊網站可能是 TIS-620） */
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'x-final-url': encodeURI(finalUrl),
      'x-source-type': type.slice(0, 200),
      'x-truncated': cut ? '1' : '0',
      'cache-control': 'private, max-age=300',
      'x-content-type-options': 'nosniff'
    }
  });
}
