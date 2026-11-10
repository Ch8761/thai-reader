# 聲調學習資料：把字典裡的詞拆成音節，標出起首子音、子音類別、活／死音節、聲調符號、實際聲調
# 輸出 tones.json：{ 詞: "音節~起首子音~類別活死符號聲調[*]|..." }
import json, os, re, unicodedata, sys
from collections import Counter
from pythainlp.tokenize import syllable_tokenize
D = os.path.dirname(os.path.abspath(__file__))
W = json.load(open(os.path.join(D, 'dictin', 'thai_dict_zh.json'), encoding='utf-8'))['words']
MID = set('กจฎฏดตบปอ'); HIGH = set('ขฃฉฐถผฝศษสห'); CONS = set(chr(c) for c in range(0x0E01, 0x0E2F))
LOW = CONS - MID - HIGH
SONOR = set('งญณนมยรลวฬ')
LEADV = set('เแโใไ')
MARKS = {'่': 1, '้': 2, '๊': 3, '๋': 4}
CLUSTERS = set('กร กล กว ขร ขล ขว คร คล คว ตร ปร ปล พร พล ผล บร บล ดร ฟร ฟล ทร จร ซร สร ศร'.split()) - {'ผล', 'ทร', 'จร', 'ซร', 'สร', 'ศร'}
def cls(c): return 'm' if c in MID else 'h' if c in HIGH else 'l'
def rom_tone(r):
    d = unicodedata.normalize('NFD', r)
    if '̀' in d: return 'L'
    if '́' in d: return 'H'
    if '̂' in d: return 'F'
    if '̌' in d: return 'R'
    return 'M'
def rom_plain(r): return ''.join(ch for ch in unicodedata.normalize('NFD', r) if not unicodedata.combining(ch)).lower()
LONGV = ('aa', 'ii', 'uu', 'ee', 'ɛɛ', 'oo', 'ɔɔ', 'əə', 'ʉʉ', 'ia', 'ʉa', 'ua')
def liveness(r):
    p = rom_plain(r).rstrip()
    if re.search(r'(p|t|k)$', p): 
        core = re.sub(r'^[^aeiouɛɔəʉ]+', '', p)[:-1]
        return 'D' if any(core.endswith(v) or v in core for v in LONGV) else 'S'
    if re.search(r'(m|n|ng|w|y|i|o|u)$', p) and not re.search(r'^[^aeiouɛɔəʉ]*[iuo]$', p): return 'L'
    if any(p.endswith(v) for v in LONGV): return 'L'
    if re.search(r'(ai|ao|am|ui|oi|iu|eo|ɛo|aai|aao|uai|ʉai|iao|əəi|ooi|ɔɔi)$', p): return 'L'
    return 'S'
def rule(c, lst, mark):
    if mark == 1: return 'F' if c == 'l' else 'L'
    if mark == 2: return 'H' if c == 'l' else 'F'
    if mark == 3: return 'H'
    if mark == 4: return 'R'
    if lst == 'L': return 'R' if c == 'h' else 'M'
    if c == 'l': return 'H' if lst == 'S' else 'F'
    return 'L'
def initial(part):
    s = [ch for ch in part if ch in CONS]
    i = 0
    while i < len(part) and part[i] in LEADV: i += 1
    first = next((ch for ch in part[i:] if ch in CONS), None)
    if not first: return None, None, False
    rest = part[part.index(first) + 1:]
    nxt = next((ch for ch in rest if ch in CONS), None)
    adjacent = rest[:1] == nxt if nxt else False
    if first == 'ห' and nxt in SONOR and adjacent: return nxt, 'h', True
    if first == 'อ' and nxt == 'ย' and adjacent: return 'ย', 'm', True
    return first, cls(first), False
def mark_of(part):
    for ch in part:
        if ch in MARKS: return MARKS[ch]
    return 0
def est(chunk):
    # 估計這個書寫音節唸成幾個音節（藏起來的 a 音，如 สนุก = สะ-หนุก）
    i = 0
    while i < len(chunk) and chunk[i] in LEADV: i += 1
    cs = chunk[i:]
    if len(cs) >= 3 and cs[0] in CONS and cs[1] in CONS and cs[0] + cs[1] not in CLUSTERS and not (cs[0] == 'ห' and cs[1] in SONOR) and not (cs[0] == 'อ' and cs[1] == 'ย') and cs[2] not in CONS:
        return 2
    return 1
out = {}; stat = Counter(); mism = Counter()
for w, es in W.items():
    if not re.fullmatch('[ก-๎]+', w) or len(w) > 20: continue
    rom = es[0][1] or ''
    if not rom or ' ' in rom or not re.fullmatch(r"[^\s,;/()]+", rom): stat['norom'] += 1; continue
    R = [x for x in rom.split('-') if x]
    try: T = syllable_tokenize(w)
    except Exception: stat['err'] += 1; continue
    # 把書寫音節對到唸的音節
    parts = []
    if len(T) == len(R):
        parts = [(t, False) for t in T]
    else:
        E = [est(t) for t in T]
        if sum(E) != len(R): stat['align'] += 1; continue
        for t, e in zip(T, E):
            if e == 1: parts.append((t, False))
            else:
                i = 0
                while i < len(t) and t[i] in LEADV: i += 1
                lead = t[i]
                parts.append((lead, False)); parts.append((t[:i] + t[i + 1:], lead))
    syl = []; ok = True
    for (p, led), r in zip(parts, R):
        ini, c, lead = initial(p)
        if not ini: ok = False; break
        if led:  # 前一個子音帶著（อักษรนำ）：低音的鼻音、流音跟著前面子音的類別
            if ini in SONOR and cls(led) in 'mh': c = cls(led); lead = True
        lst = liveness(r); mk = mark_of(p); act = rom_tone(r); prd = rule(c, lst, mk)
        if led is False and len(p) == 1 and p in CONS and len(parts) > 1:
            lst = 'S'; prd = rule(c, lst, mk)
        stat['syl'] += 1
        if prd != act: mism[(c, lst, mk, act)] += 1; stat['mismatch'] += 1
        syl.append(p + '~' + ini + '~' + c + lst + str(mk) + act + ('*' if lead else ''))
    if not ok: stat['noinit'] += 1; continue
    out[w] = '|'.join(syl); stat['words'] += 1
json.dump(out, open(os.path.join(D, 'tones.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(stat, 'bytes', os.path.getsize(os.path.join(D, 'tones.json')))
print('mismatch rate', round(stat['mismatch'] / max(1, stat['syl']), 3), mism.most_common(12))
for w in ['ส่งออก', 'ประชุม', 'เหนื่อย', 'สนุก', 'ตลาด', 'หน้า', 'อยาก', 'หมา', 'ไทย', 'ร้านอาหาร', 'มาก', 'ค่ะ', 'คะ', 'น้ำ', 'สวัสดี']:
    print(w, out.get(w))
