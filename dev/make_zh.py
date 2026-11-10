# 把字典的英文詞義對照成繁體中文（台灣用語）
# 來源：ECDICT（MIT 授權，英漢詞典）＋ OpenCC 簡轉繁（s2twp）
import csv, json, re, sys, collections
from opencc import OpenCC
D = sys.argv[1] if len(sys.argv) > 1 else '.'
cc = OpenCC('s2twp')
csv.field_size_limit(10**9)

EC = {}
with open(D + '/dl/ecdict.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        w = row['word'].strip().lower()
        t = row['translation'].strip()
        if not t or w in EC:
            continue
        EC[w] = (t, int(row['frq'] or 0) or int(row['bnc'] or 0) or 999999)


# ---- WordNet：泰文詞 → 同義詞組 → 中文詞（依詞義對齊，比單純英漢對照準）
import os
WN = D + '/dl'
EN = {}
for fn, pos in (('data.noun', 'n'), ('data.verb', 'v'), ('data.adj', 'a'), ('data.adv', 'r')):
    for line in open(WN + '/wordnet/' + fn, encoding='utf-8', errors='ignore'):
        if line.startswith(' '):
            continue
        a = line.split()
        off, typ, n = a[0], a[2], int(a[3], 16)
        ws = [a[4 + 2 * i].lower().replace('_', ' ') for i in range(n)]
        key = off + '-' + ('a' if typ == 's' else typ)
        EN[key] = ws
        if typ == 's':
            EN[off + '-s'] = ws
TH = collections.defaultdict(list)
for line in open(WN + '/omw-1.4/tha/wn-data-tha.tab', encoding='utf-8'):
    if line.startswith('#'):
        continue
    a = line.rstrip('\n').split('\t')
    if len(a) >= 3 and a[1].endswith('lemma'):
        k = a[0].replace('-s', '-a')
        TH[a[2].strip()].append(k)
CM = collections.defaultdict(list)
for line in open(WN + '/omw-1.4/cow/wn-data-cmn.tab', encoding='utf-8'):
    if line.startswith('#'):
        continue
    a = line.rstrip('\n').split('\t')
    if len(a) >= 3 and a[1].endswith('lemma'):
        k = a[0].replace('-s', '-a')
        z = cc.convert(a[2].replace('+', ''))
        if z not in CM[k]:
            CM[k].append(z)
POSMAP = {'noun': 'n', 'name': 'n', 'verb': 'v', 'adj': 'a', 'adv': 'r', 'classifier': 'n', 'pron': 'n', 'num': 'n'}
LABELS = {
    'geometry': '幾何', 'slang': '俚語', 'colloquial': '口語', 'informal': '非正式', 'formal': '正式', 'archaic': '古語',
    'obsolete': '已不用', 'buddhism': '佛教', 'royal': '王室用語', 'chemistry': '化學', 'botany': '植物', 'zoology': '動物',
    'law': '法律', 'legal': '法律', 'medicine': '醫學', 'figuratively': '比喻', 'figurative': '比喻', 'literary': '文學用語',
    'poetic': '詩詞', 'music': '音樂', 'mathematics': '數學', 'physics': '物理', 'anatomy': '解剖', 'grammar': '文法',
    'military': '軍事', 'computing': '電腦', 'religion': '宗教', 'christianity': '基督教', 'islam': '伊斯蘭教',
    'hinduism': '印度教', 'astronomy': '天文', 'biology': '生物', 'economics': '經濟', 'politics': '政治', 'sports': '運動',
    'ichthyology': '魚類', 'ornithology': '鳥類', 'entomology': '昆蟲', 'vulgar': '粗俗', 'derogatory': '貶義', 'offensive': '冒犯',
    'polite': '禮貌', 'humorous': '幽默', 'euphemistic': '委婉', 'dialectal': '方言', 'northern thailand': '泰北', 'isan': '依善方言',
    'southern thailand': '泰南', 'internet slang': '網路用語', 'pali': '巴利語', 'sanskrit': '梵語', 'transitive': '及物', 'intransitive': '不及物',
}
PAREN_TMPL = [
    (r'^\(?a (?:city|town) in thailand\)?$', '泰國城市'), (r'^\(?a province of thailand\)?$', '泰國的府'),
    (r'^\(?a country in ([a-z ]+)\)?$', '國家'), (r'^\(?a district of ([a-z ]+)\)?$', '縣、區'),
]
STOP_LEAD = re.compile(r'^(to be |to |a |an |the |one\'s |someone\'s )', re.I)

def pick(trans, verb, n=2):
    lines = [l for l in trans.split('\\n') if l.strip()]
    lines2 = [l for l in lines if not l.startswith('[')]
    if not lines2:
        lines2 = [re.sub(r'^\[[^\]]*\]\s*', '', l) for l in lines]
    pref = None
    for l in lines2:
        m = re.match(r'^([a-z]+)\.\s*', l)
        p = m.group(1) if m else ''
        if verb and p in ('v', 'vt', 'vi'):
            pref = l; break
        if not verb and p in ('n', 'a', 'adj', 'ad', 'adv', 'num', 'pron', 'int', 'prep', 'conj'):
            pref = pref or l
    l = pref or lines2[0]
    l = re.sub(r'^([a-z]+\.\s*)+', '', l)
    l = re.sub(r'（[^）]*）|\([^)]*\)|<[^>]*>|\[[^\]]*\]', '', l)
    items = [x.strip() for x in re.split(r'[；;,，]', l) if x.strip()]
    items = [x for x in items if len(x) <= 12]
    return cc.convert('、'.join(items[:n])) if items else ''

def look(part):
    p = part.strip().strip('.').strip()
    if not p:
        return ''
    verb = bool(re.match(r'^to ', p, re.I))
    cands = [p.lower()]
    q = STOP_LEAD.sub('', p).strip()
    cands.append(q.lower())
    q2 = re.sub(r'\s*\([^)]*\)', '', q).strip()
    cands.append(q2.lower())
    for c in list(cands):
        if c.endswith('ies'):
            cands.append(c[:-3] + 'y')
        elif c.endswith('es'):
            cands.append(c[:-2])
        if c.endswith('s'):
            cands.append(c[:-1])
    for c in cands:
        if c and c in EC and len(c.split()) <= 5:
            r = pick(EC[c][0], verb)
            if r:
                return r
    return ''

def keys_of(part):
    p = STOP_LEAD.sub('', part.strip().strip('.').strip()).strip()
    p = re.sub(r'\s*\([^)]*\)', '', p).strip().lower()
    out = [p]
    if p.endswith('s'): out.append(p[:-1])
    if p.endswith('es'): out.append(p[:-2])
    if p.endswith('ies'): out.append(p[:-3] + 'y')
    return out

def zh_of(g, word='', pos=''):
    s = g.strip()
    lab = ''
    m = re.match(r'^\(([^)]*)\)\s*', s)
    if m:
        labs = [LABELS.get(x.strip().lower()) for x in re.split(r'[,;]', m.group(1))]
        labs = [x for x in labs if x]
        if labs:
            lab = '（' + '、'.join(labs) + '）'
        s = s[m.end():]
    s = re.sub(r'\((?:classifiers?|clf)[^)]*\)', '', s, flags=re.I).strip()
    m = re.match(r'^abstract noun of (\S+)(?: \([^)]*\))?:\s*(.*)$', s)
    pre = ''
    if m:
        pre = m.group(1) + ' 的名詞形：'
        s = m.group(2)
    tail = ''
    m = re.search(r'\s*\(([^)]*)\)\.?$', s)
    if m:
        for pat, zh in PAREN_TMPL:
            if re.match(pat, m.group(1).lower()):
                tail = '（' + zh + '）'
                break
    head = s
    if ':' in s and not pre:
        h, _, rest = s.partition(':')
        if len(h.split()) <= 4:
            head = h
    head = re.sub(r'\s*\([^)]*\)', '', head).strip().rstrip('.')
    parts = [x for x in re.split(r';|,(?![^()]*\))', head) if x.strip()]
    out, miss = [], 0
    syn = [k for k in TH.get(word, []) if (not POSMAP.get(pos) or k.endswith('-' + POSMAP[pos]))]
    pool = []
    for k in TH.get(word, []):
        for z in CM.get(k, []):
            if z not in pool: pool.append(z)
    for p in parts:
        p = re.sub(r'^\s*(?:as|e\.g\.|such as|esp\.|especially|usually|i\.e\.)\s+', '', p.strip(), flags=re.I)
        if len(p.split()) > 4:
            miss += 1; continue
        z = ''
        ks = keys_of(p)
        hit = [k for k in syn if any(x in EN.get(k, []) for x in ks)]
        zz = []
        for k in hit:
            for c in CM.get(k, []):
                if c not in zz: zz.append(c)
        if zz:
            z = '、'.join(zz[:3]); stats2['wn'] += 1
        else:
            z = look(p)
            if z and pool:
                agree = [x for x in z.split('、') if x in pool]
                if agree: z = '、'.join(agree); stats2['agree'] += 1
                else: stats2['ec'] += 1
            elif z: stats2['ec'] += 1
        if z:
            for piece in z.split('、'):
                if piece not in out:
                    out.append(piece)
        else:
            miss += 1
    if not out:
        return '', False
    full = miss == 0
    return lab + pre + '、'.join(out[:4]) + tail, full

d = json.load(open(D + '/dictin/thai_dict.json', encoding='utf-8'))
W = d['words']
freq = {}
for line in open(D + '/dl/pythainlp/pythainlp/corpus/tnc_freq.txt', encoding='utf-8'):
    a = line.rstrip('\n').split('\t')
    if len(a) == 2:
        freq[a[0]] = int(a[1])
cache = {}
stats2 = collections.Counter()
stats = collections.Counter()
wstat = collections.Counter()
missing = collections.Counter()
for w, ents in W.items():
    anyzh = False
    for e in ents:
        zs = []
        for g in e[3]:
            ck = (g, w, e[0])
            if ck not in cache:
                cache[ck] = zh_of(g, w, e[0])
            z, full = cache[ck]
            zs.append(z)
            stats['full' if (z and full) else ('part' if z else 'none')] += 1
            if not z:
                missing[g] += freq.get(w, 0) + 1
            anyzh = anyzh or bool(z)
        while len(e) < 4:
            e.append([])
        e[4:] = [zs]
    wstat['has' if anyzh else 'no'] += 1
    if freq.get(w, 0) >= 200:
        wstat['common_has' if anyzh else 'common_no'] += 1
print(stats, wstat, stats2)
d['zh_source'] = 'ECDICT (MIT) 英漢對照 + OpenCC 繁體（自動對照，僅供參考）'
d['format'] = 'word: [[pos, romanization, ipa, [glosses], [zh glosses]]]'
json.dump(d, open(D + '/dictin/thai_dict_zh.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump([[g, n] for g, n in missing.most_common()], open(D + '/dictin/zh_missing.json', 'w', encoding='utf-8'), ensure_ascii=False)
samp = ['ไต้หวัน', 'เตือน', 'ระวัง', 'อิทธิพล', 'จีน', 'มีนาคม', 'เนี่ย', 'บันเทิง', 'เศรษฐกิจ', 'ขึ้น', 'แฟชั่น', 'ยก', 'ที่', 'ได้', 'ไป', 'กิน', 'สวย', 'ความ', 'ภาษา', 'วัด']
for w in samp:
    if w in W:
        print(w, ' | '.join(' / '.join(z for z in e[4] if z) or '-' for e in W[w])[:160])

# ---- 人工翻譯（最常用的詞）覆蓋自動對照
man = {}
for fn in ('zh_manual1.txt', 'zh_manual2.txt', 'zh_manual3.txt'):
    for line in open(D + '/dictin/' + fn, encoding='utf-8'):
        line = line.strip()
        if '|' in line:
            k, v = line.split('|', 1)
            man[k] = v
used = 0
for w, ents in W.items():
    for i, e in enumerate(ents):
        k = w + '#' + str(i)
        if k in man:
            e[4:] = [[man[k]], 1]
            used += 1
print('manual entries', len(man), 'applied', used)
json.dump(d, open(D + '/dictin/thai_dict_zh.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
import os
print('size', os.path.getsize(D + '/dictin/thai_dict_zh.json'))
