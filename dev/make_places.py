# 從 Wikidata（CC0）抓國家、首都、泰國各府、泰國政府機關、泰國大學、國際組織的泰文名＋中文名，產生 dictin/places.txt
# 每行：泰文名|種類|中文名|說明|英文名
import json, os, re, sys, time, urllib.parse, urllib.request
D = os.path.dirname(os.path.abspath(__file__))
EP = 'https://query.wikidata.org/sparql'
UA = 'thai-reader-dictionary-builder/1.0 (https://github.com/Ch8761/thai-reader)'
CACHE = os.path.join(D, 'dl', 'wikidata'); os.makedirs(CACHE, exist_ok=True)
def q(name, sparql):
    fn = os.path.join(CACHE, name + '.json')
    if os.path.exists(fn):
        return json.load(open(fn, encoding='utf-8'))
    url = EP + '?' + urllib.parse.urlencode({'query': sparql, 'format': 'json'})
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/sparql-results+json'})
            rows = json.load(urllib.request.urlopen(req, timeout=180))['results']['bindings']
            json.dump(rows, open(fn, 'w', encoding='utf-8'), ensure_ascii=False)
            print(name, len(rows), flush=True); time.sleep(75)
            return rows
        except Exception as e:
            print('retry', name, e, flush=True); time.sleep(90)
    print('FAILED', name); return []
LABELS = '''
  OPTIONAL { ?x rdfs:label ?zhtw FILTER(LANG(?zhtw) = "zh-tw") }
  OPTIONAL { ?x rdfs:label ?zhant FILTER(LANG(?zhant) = "zh-hant") }
  OPTIONAL { ?x rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  OPTIONAL { ?x rdfs:label ?en FILTER(LANG(?en) = "en") }'''
def sel(where, alt=False):
    th = '{ ?x rdfs:label ?th FILTER(LANG(?th) = "th") }' + (' UNION { ?x skos:altLabel ?th FILTER(LANG(?th) = "th") }' if alt else '')
    return 'SELECT DISTINCT ?x ?th ?zhtw ?zhant ?zh ?en WHERE { %s %s %s }' % (where, th, LABELS)
SETS = [
    ('pl_countries', sel('VALUES ?t { wd:Q6256 wd:Q3624078 } ?x wdt:P31 ?t.', True), 'place', '國家'),
    ('pl_capitals', sel('?x wdt:P31/wdt:P279* wd:Q5119.'), 'place', '首都'),
    ('pl_th_prov', sel('?x wdt:P31 wd:Q50198.', True), 'place', '泰國的府'),
    ('pl_th_dist', sel('?x wdt:P31 wd:Q1385497.'), 'place', '曼谷的區'),
    ('pl_th_agency', sel('?x wdt:P31/wdt:P279* wd:Q327333; wdt:P17 wd:Q869.', True), 'org', '泰國政府機關'),
    ('pl_th_univ', sel('?x wdt:P31/wdt:P279* wd:Q3918; wdt:P17 wd:Q869.', True), 'org', '泰國大學'),
    ('pl_intl', sel('VALUES ?t { wd:Q484652 wd:Q245065 wd:Q1335818 } ?x wdt:P31 ?t.'), 'org', '國際組織'),
]
try:
    import opencc; tw = opencc.OpenCC('s2twp').convert
except Exception:
    tw = lambda x: x
W = json.load(open(os.path.join(D, 'dictin', 'thai_dict_zh.json'), encoding='utf-8'))['words']
out = {}
for name, sp, typ, desc in SETS:
    for r in q(name, sp):
        th = re.sub(r'\s*\(.*?\)\s*$', '', r['th']['value']).strip()
        if len(th) < 4 or not re.search('[ก-ฮ]', th) or '|' in th or '\n' in th or re.search('[A-Za-z]', th):
            continue
        if th in W:
            continue
        zh = ''
        for k in ('zhtw', 'zhant', 'zh'):
            if k in r: zh = r[k]['value']; break
        if zh and 'zhtw' not in r and 'zhant' not in r: zh = tw(zh)
        if not zh:
            continue
        en = r.get('en', {}).get('value', '')
        if th not in out:
            out[th] = (th, typ, zh.replace('|', ' ')[:40], desc, en.replace('|', ' ')[:60])
lines = ['|'.join(v) for v in sorted(out.values())]
open(os.path.join(D, 'dictin', 'places.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
from collections import Counter
print('total', len(lines), Counter(v[3] for v in out.values()))
