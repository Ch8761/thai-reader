# 從 Wikidata（CC0）抓有泰文名稱的明星、政治人物、劇集、電影、樂團，產生 dictin/celebs.txt
# 每行：泰文名|種類|中文名|說明|英文名
import json, os, re, sys, time, urllib.parse, urllib.request
D = os.path.dirname(os.path.abspath(__file__))
EP = 'https://query.wikidata.org/sparql'
UA = 'thai-reader-dictionary-builder/1.0 (https://github.com/Ch8761/thai-reader)'
CACHE = os.path.join(D, 'dl', 'wikidata'); os.makedirs(CACHE, exist_ok=True)

def q(name, sparql):
    fn = os.path.join(CACHE, name + '.json')
    if os.path.exists(fn) and '--refresh' not in sys.argv:
        return json.load(open(fn, encoding='utf-8'))
    url = EP + '?' + urllib.parse.urlencode({'query': sparql, 'format': 'json'})
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
            data = json.load(urllib.request.urlopen(req, timeout=180))
            rows = data['results']['bindings']
            json.dump(rows, open(fn, 'w', encoding='utf-8'), ensure_ascii=False)
            print(name, len(rows)); time.sleep(65)
            return rows
        except Exception as e:
            print('retry', name, e); time.sleep(70)
    raise SystemExit('query failed: ' + name)

LABELS = '''
  OPTIONAL { ?x rdfs:label ?zhtw FILTER(LANG(?zhtw) = "zh-tw") }
  OPTIONAL { ?x rdfs:label ?zhant FILTER(LANG(?zhant) = "zh-hant") }
  OPTIONAL { ?x rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  OPTIONAL { ?x rdfs:label ?en FILTER(LANG(?en) = "en") }
'''
def people(country, occs):
    return '''SELECT ?x ?th ?zhtw ?zhant ?zh ?en (GROUP_CONCAT(DISTINCT STRAFTER(STR(?o), "entity/"); separator=",") AS ?occ) WHERE {
  VALUES ?o { %s }
  ?x wdt:P31 wd:Q5; wdt:P27 wd:%s; wdt:P106 ?o.
  { ?x rdfs:label ?th FILTER(LANG(?th) = "th") } UNION { ?x skos:altLabel ?th FILTER(LANG(?th) = "th") }
  %s } GROUP BY ?x ?th ?zhtw ?zhant ?zh ?en''' % (' '.join('wd:' + o for o in occs), country, LABELS)
def works(types, country=None):
    c = ('?x wdt:P495 wd:%s.' % country) if country else ''
    return '''SELECT ?x ?th ?zhtw ?zhant ?zh ?en (SAMPLE(?t) AS ?occ) WHERE {
  VALUES ?t { %s }
  ?x wdt:P31 ?t. %s
  ?x rdfs:label ?th FILTER(LANG(?th) = "th")
  %s } GROUP BY ?x ?th ?zhtw ?zhant ?zh ?en''' % (' '.join('wd:' + t for t in types), c, LABELS)

ENT = ['Q33999', 'Q10800557', 'Q10798782', 'Q177220', 'Q4610556', 'Q947873', 'Q2405480', 'Q488205', 'Q639669', 'Q753110', 'Q17125263', 'Q2252262', 'Q245068', 'Q2526255', 'Q3282637', 'Q1028181', 'Q855091']
OCC_ZH = {'Q33999': '演員', 'Q10800557': '電影演員', 'Q10798782': '電視演員', 'Q177220': '歌手', 'Q4610556': '模特兒', 'Q947873': '節目主持人', 'Q2405480': '配音員',
          'Q488205': '創作歌手', 'Q639669': '音樂人', 'Q753110': '詞曲作者', 'Q17125263': 'YouTuber', 'Q2252262': '饒舌歌手', 'Q245068': '喜劇演員', 'Q2526255': '電影導演',
          'Q3282637': '電影製片', 'Q1028181': '畫家', 'Q855091': '吉他手', 'Q82955': '政治人物', 'Q5398426': '電視劇', 'Q1259759': '迷你劇', 'Q526877': '網路劇',
          'Q15416': '電視節目', 'Q431289': '品牌', 'Q4830453': '企業', 'Q6881511': '企業', 'Q891723': '上市公司', 'Q783794': '公司', 'Q167270': '商標', 'Q11424': '電影', 'Q215380': '樂團', 'Q2088357': '音樂組合', 'Q9212979': '樂團'}
SETS = [
    ('th_ent', people('Q869', ENT), 'person', '泰國'),
    ('th_pol', people('Q869', ['Q82955']), 'person', '泰國'),
    ('kr_ent', people('Q884', ['Q33999', 'Q10800557', 'Q10798782', 'Q177220', 'Q2252262', 'Q4610556']), 'person', '韓國'),
    ('th_series', works(['Q5398426', 'Q1259759', 'Q526877', 'Q15416'], 'Q869'), 'work', '泰國'),
    ('th_film', works(['Q11424'], 'Q869'), 'work', '泰國'),
    ('any_series', works(['Q5398426', 'Q1259759', 'Q526877']), 'work', ''),
    ('groups', works(['Q215380', 'Q2088357', 'Q9212979']), 'org', ''),
    ('brands', works(['Q431289', 'Q167270']), 'org', ''),
    ('th_companies', works(['Q4830453', 'Q6881511', 'Q891723', 'Q783794']).replace('?x wdt:P31 ?t.', '?x wdt:P31 ?t; wdt:P17 wd:Q869.'), 'org', ''),
]

# 簡轉繁（台灣用語）
try:
    import opencc
    CC = opencc.OpenCC('s2twp')
    tw = CC.convert
except Exception:
    tw = lambda x: x

W = json.load(open(os.path.join(D, 'dictin', 'thai_dict_zh.json'), encoding='utf-8'))['words']
F = {}
for line in open(os.path.join(D, 'dl/pythainlp/pythainlp/corpus/tnc_freq.txt'), encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) == 2: F[p[0]] = int(p[1])

TOP = set(sorted(F, key=lambda w: -F[w])[:3000])
VOC = set(W) | set(w for w in F if F[w] >= 5)
MAXL = 20
def pieces(t):
    out, i = [], 0
    while i < len(t):
        for L in range(min(MAXL, len(t) - i), 0, -1):
            if t[i:i + L] in VOC or L == 1:
                out.append(t[i:i + L]); i += L; break
    return out
def generic(t):
    if ' ' in t or not re.fullmatch('[\u0e01-\u0e4e]+', t):
        return False
    ps = pieces(t)
    return len(ps) <= 3 and all(p in TOP for p in ps)
dropped = []
out = {}
for name, sp, typ, where in SETS:
    rows = q(name, sp)
    for r in rows:
        th = r['th']['value'].strip()
        th = re.sub(r'\s*\(.*?\)\s*$', '', th).strip()
        if len(th) < 4 or (' ' not in th and len(th) < 5) or not re.search('[ก-ฮ]', th) or '|' in th or '\n' in th:
            continue
        if re.search(r'[A-Za-z0-9]', th) and not re.search('[ก-ฮ]{3}', th):
            continue
        if ' ' not in th:
            if th in W and not any(e[0] == 'name' for e in W[th]):
                continue
            if F.get(th, 0) > 50 and len(th) < 8:
                continue
        if generic(th):
            dropped.append(th); continue
        zh = ''
        for k in ('zhtw', 'zhant', 'zh'):
            if k in r:
                zh = r[k]['value']; break
        if zh and 'zhtw' not in r and 'zhant' not in r:
            zh = tw(zh)
        en = r.get('en', {}).get('value', '')
        occs = [o.rsplit('/', 1)[-1] for o in r.get('occ', {}).get('value', '').split(',') if o]
        names = []
        for grp in (('Q177220', 'Q488205', 'Q2252262'), ('Q33999', 'Q10800557', 'Q10798782'), ('Q947873',), ('Q4610556',), ('Q17125263',), ('Q2405480',), ('Q245068',), ('Q2526255',), ('Q82955',)):
            hit = [o for o in grp if o in occs]
            if hit:
                n = {'Q177220': '歌手', 'Q488205': '歌手', 'Q2252262': '饒舌歌手', 'Q33999': '演員', 'Q10800557': '演員', 'Q10798782': '演員'}.get(hit[0], OCC_ZH.get(hit[0], ''))
                if n and n not in names: names.append(n)
        if not names and occs: names = [OCC_ZH.get(occs[0], '')]
        desc = (where if where and typ != 'org' else '') + '、'.join(names[:2])
        if name == 'any_series' and th in out:
            continue
        prev = out.get(th)
        if prev and prev[1] == 'person' and typ != 'person':
            continue
        out[th] = (th, typ, zh.replace('|', ' ')[:40], desc, en.replace('|', ' ')[:60])

# 暱稱＋名字（泰國媒體常寫「ญาญ่า อุรัสยา」）
nk = 0
nf = os.path.join(CACHE, 'th_nick.json')
if os.path.exists(nf):
    for r in json.load(open(nf, encoding='utf-8')):
        if r['nick'].get('xml:lang') != 'th':
            continue
        base = re.sub(r'\s*\(.*?\)\s*$', '', r['th']['value']).strip(); nick = r['nick']['value'].strip()
        if base not in out or ' ' not in base or not re.fullmatch('[\u0e01-\u0e4e]+', nick):
            continue
        first = base.split(' ')[0]
        for v in (nick + ' ' + first, nick + first):
            if v not in out and len(v) >= 5:
                out[v] = (v,) + out[base][1:]; nk += 1
print('nickname variants', nk)
# 單獨的暱稱（例如 ฟรีน）：只收沒有撞名、不是一般詞的，標成「弱」：只在詞界上、前後不是連字號時才算，也不會蓋過其他規則
weak = {}
if os.path.exists(nf):
    for r in json.load(open(nf, encoding='utf-8')):
        if r['nick'].get('xml:lang') != 'th':
            continue
        base = re.sub(r'\s*\(.*?\)\s*$', '', r['th']['value']).strip(); nick = r['nick']['value'].strip()
        if base in out and re.fullmatch('[\u0e01-\u0e4e]{4,}', nick):
            weak.setdefault(nick, set()).add(base)
nw = 0
for nick, bases in weak.items():
    if len(bases) > 1 or nick in out or nick in W or F.get(nick, 0) > 50 or (generic(nick) and all(len(x) >= 2 for x in pieces(nick))):
        continue
    out[nick] = (nick,) + out[next(iter(bases))][1:] + ('w',); nw += 1
print('weak nicknames', nw, [k for k, v in weak.items() if len(v) == 1][:30])
# 手動補充的暱稱
for line in open(os.path.join(D, 'dictin', 'celebs_extra.txt'), encoding='utf-8'):
    if line.startswith('#') or '|' not in line:
        continue
    nick, base, flag = (line.rstrip('\n').split('|') + ['', ''])[:3]
    if base in out and nick not in out:
        row = out[base][:5]
        out[nick] = (nick,) + row[1:] + (('w',) if flag == 'w' else ())
lines = ['|'.join(v) for v in sorted(out.values(), key=lambda v: v[0])]
open(os.path.join(D, 'dictin', 'celebs.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
from collections import Counter
print('dropped generic', len(dropped), dropped[:40])
print('total', len(lines), Counter(v[1] for v in out.values()), 'bytes', sum(len(l.encode()) + 1 for l in lines))
