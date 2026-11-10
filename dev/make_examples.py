# 生字卡的生活化例句：從 scb-mt-en-th-2020（CC BY-SA 4.0，VISTEC/SCB）挑短句，依字典的詞建索引
import csv, json, os, re, sys
from collections import defaultdict
D = os.path.dirname(os.path.abspath(__file__))
SRC = [('task_master_1', 3.0), ('nus_sms', 2.0), ('generated_reviews_crowd', 1.2), ('mozilla_common_voice', 1.0)]
W = json.load(open(os.path.join(D, 'dictin', 'thai_dict_zh.json'), encoding='utf-8'))['words']
slang = [l.split('|')[0] for l in open(os.path.join(D, 'dictin', 'slang.txt'), encoding='utf-8') if l.strip() and not l.startswith('#')]
TARGET = set(w for w in W if any(e[4] and e[4][0] for e in W[w]) and re.fullmatch('[ก-๎]+', w)) | set(slang)
print('target words', len(TARGET))
from pythainlp.tokenize import word_tokenize, Tokenizer
from pythainlp.corpus.common import thai_words
KNOWN = set(thai_words()) | TARGET | set(W)
tok = Tokenizer(custom_dict=KNOWN, engine='newmm')
sents = []
seen = set()
for name, wt in SRC:
    for r in csv.DictReader(open(os.path.join(D, 'dl', 'scb', 'scb-mt-en-th-2020', name + '.csv'), encoding='utf-8')):
        th = re.sub(r'\s+', ' ', r['th_text']).strip(); en = re.sub(r'\s+', ' ', r['en_text']).strip()
        if not (8 <= len(th) <= 70) or len(en) > 140 or not en or th in seen:
            continue
        if re.search(r'[A-Za-z]{2,}|[0-9]{3,}|[<>{}\[\]@#_|\\]', th) or re.search(r'[฀-๿]', en):
            continue
        if not re.search(r'[ก-ฮ]', th):
            continue
        seen.add(th)
        L = len(th); score = wt - abs(L - 28) / 30.0
        sents.append((th, en, score, name))
print('sentences', len(sents))
best = defaultdict(list)  # word -> [(score, idx)]
sub_join = set()
for k, (th, en, score, name) in enumerate(sents):
    toks = tok.word_tokenize(th)
    thai_toks = [t for t in toks if re.search('[\u0e01-\u0e2e]', t)]
    unk = sum(1 for t in thai_toks if t not in KNOWN or (len(t) == 1 and t not in ('ๆ',)))
    if unk > 1:
        continue
    score -= unk * 1.5
    pos = [0]
    for t in toks: pos.append(pos[-1] + len(t))
    found = set()
    for a in range(len(toks)):
        w = ''
        for b in range(a, min(a + 4, len(toks))):
            w += toks[b]
            if w in TARGET and w not in found:
                found.add(w)
                if b > a: sub_join.add((k, w))
    for w in found:
        lst = best[w]
        lst.append((score - (0.8 if (k, w) in sub_join else 0), k))
        if len(lst) > 12:
            lst.sort(reverse=True); del lst[6:]
    if k % 20000 == 0: print(k, flush=True)
PER = 2
used = {}
out_idx = {}
for w, lst in best.items():
    lst.sort(reverse=True)
    pick = []
    ens = set()
    for sc, k in lst:
        if len(pick) >= PER: break
        e = sents[k][1].lower().strip(' .!?')
        if e in ens: continue
        ens.add(e); pick.append(k)
    ids = []
    for k in pick:
        if k not in used: used[k] = len(used)
        ids.append(used[k])
    out_idx[w] = ids
S = [None] * len(used)
for k, i in used.items(): S[i] = [sents[k][0], sents[k][1]]
json.dump({'source': 'scb-mt-en-th-2020 (CC BY-SA 4.0, VISTEC & SCB)', 's': S, 'w': out_idx}, open(os.path.join(D, 'examples.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('words with examples', len(out_idx), 'sentences', len(S), 'bytes', os.path.getsize(os.path.join(D, 'examples.json')))
