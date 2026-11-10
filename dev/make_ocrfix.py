import json, re, itertools
F = {}
for line in open('dl/pythainlp/pythainlp/corpus/tnc_freq.txt', encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) == 2 and re.fullmatch(r'[ก-๎]+', p[0]):
        F[p[0]] = F.get(p[0], 0) + int(p[1])
W = json.load(open('dictin/thai_dict_zh.json', encoding='utf-8'))['words']
TONES = '่้๊๋็์'
top = sorted(F, key=lambda w: -F[w])[:12000]
cand = {}
def errs(c):
    out = set()
    # remove one tone mark / thanthakhat / maitaikhu
    for i, ch in enumerate(c):
        if ch in TONES: out.add(c[:i] + c[i+1:])
    base = set(out) | {c}
    for b in base:
        for i, ch in enumerate(b):
            if ch == 'ึ': out.add(b[:i] + 'ื' + b[i+1:])
            if ch == 'ื': out.add(b[:i] + 'ึ' + b[i+1:])
    out.discard(c)
    return out
UPPER = '\u0e31\u0e34\u0e35\u0e36\u0e37'
def vowel_errs(c):
    out = set()
    for b in {c} | {c[:i] + c[i+1:] for i, ch in enumerate(c) if ch in TONES}:
        for i, ch in enumerate(b):
            if ch in UPPER: out.add(b[:i] + b[i+1:])
    out.discard(c)
    return out
for c in top:
    fc = F[c]
    if fc < 150 or len(c) < 3: continue
    for e in vowel_errs(c):
        if len(e) < 3 or F.get(e, 0) > 2 or e in W: continue
        cand.setdefault(e, []).append(c)
for c in top:
    fc = F[c]
    if fc < 150 or len(c) < 2: continue
    for e in errs(c):
        fe = F.get(e, 0)
        if fe and fc < 30 * fe: continue
        if e in W and fe * 30 > fc: continue
        cand.setdefault(e, []).append(c)
M = {}
for e, cs in cand.items():
    cs.sort(key=lambda w: -F[w])
    if len(cs) > 1 and F[cs[0]] < 5 * F[cs[1]]: continue
    M[e] = cs[0]
print(len(M), len(json.dumps(M, ensure_ascii=False).encode()))
for k in ['เตอน', 'แทรกซม', 'สือ', 'มันคง', 'ที', 'นี', 'เพิม', 'ทัง', 'กี', 'ขืน', 'แลว', 'ได', 'ไม', 'ปักกิง', 'กิง', 'ไห', 'ให']:
    print(k, M.get(k))
json.dump(M, open('dictin/ocrfix.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
