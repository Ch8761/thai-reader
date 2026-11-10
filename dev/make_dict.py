"""
把 kaikki.org 下載的泰文字典（英文版維基詞典的資料）整理成 App 用的小字典檔。

用法：
  1. 把這個檔案，和從 kaikki.org 下載的泰文字典檔（檔名通常含有 Thai，副檔名 .jsonl）
     放在同一個資料夾。
  2. 在這個資料夾打開終端機，輸入：
       Windows： python make_dict.py
       Mac：     python3 make_dict.py
  3. 完成後，同一個資料夾會多一個 thai_dict.json，把它傳給 Claude。

只用到 Python 內建的功能，不需要另外安裝任何套件。
資料來源：Wiktionary（CC BY-SA 授權），經 kaikki.org（wiktextract）整理。
"""

import glob
import gzip
import json
import os
import sys

MAX_SENSES = 4      # 每個詞性最多保留幾個詞義
MAX_ENTRIES = 4     # 每個詞最多保留幾個詞性
OUTPUT_NAME = "thai_dict.json"


def find_input(folder):
    """在資料夾裡找下載的字典檔；有好幾個時選最大的那個。"""
    patterns = ["*.jsonl", "*.jsonl.gz", "*.json.gz"]
    files = []
    for pattern in patterns:
        files.extend(glob.glob(os.path.join(folder, pattern)))
    files = [f for f in files if os.path.basename(f) != OUTPUT_NAME]
    if not files:
        return None
    return max(files, key=os.path.getsize)


def open_text(path):
    if path.endswith(".gz"):
        return gzip.open(path, "rt", encoding="utf-8")
    return open(path, "r", encoding="utf-8")


def romanization_of(entry):
    for form in entry.get("forms") or []:
        if "romanization" in (form.get("tags") or []) and form.get("form"):
            return form["form"]
    return ""


def ipa_of(entry):
    for sound in entry.get("sounds") or []:
        if sound.get("ipa"):
            return sound["ipa"]
    return ""


def glosses_of(entry):
    out = []
    for sense in entry.get("senses") or []:
        tags = sense.get("tags") or []
        if "no-gloss" in tags:
            continue
        glosses = sense.get("glosses") or sense.get("raw_glosses") or []
        if not glosses:
            continue
        text = glosses[-1].strip()
        if text and text not in out:
            out.append(text)
        if len(out) >= MAX_SENSES:
            break
    return out


def main():
    folder = os.path.dirname(os.path.abspath(__file__))
    source = find_input(folder)
    if source is None:
        print("找不到字典檔。請把從 kaikki.org 下載的 .jsonl 檔，放到和 make_dict.py 同一個資料夾：")
        print("  " + folder)
        sys.exit(1)

    print("讀取中：" + os.path.basename(source))
    words = {}
    lines = 0
    skipped_other_language = 0
    bad_lines = 0

    with open_text(source) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            lines += 1
            try:
                entry = json.loads(line)
            except ValueError:
                bad_lines += 1
                continue
            if entry.get("lang_code") not in (None, "th"):
                skipped_other_language += 1
                continue
            word = (entry.get("word") or "").strip()
            glosses = glosses_of(entry)
            if not word or not glosses:
                continue
            item = [entry.get("pos") or "", romanization_of(entry), ipa_of(entry), glosses]
            bucket = words.setdefault(word, [])
            if len(bucket) < MAX_ENTRIES:
                bucket.append(item)
            if lines % 5000 == 0:
                print("  已讀 {} 行，整理出 {} 個詞".format(lines, len(words)))

    if not words:
        print("讀完了，但沒有整理出任何泰文詞。")
        print("可能下載到的不是英文版維基詞典的泰文字典。請把這段訊息截圖給 Claude。")
        sys.exit(1)

    output = os.path.join(folder, OUTPUT_NAME)
    with open(output, "w", encoding="utf-8") as fh:
        json.dump(
            {"source": "Wiktionary (CC BY-SA) via kaikki.org / wiktextract", "format": "word: [[pos, romanization, ipa, [glosses]]]", "words": words},
            fh, ensure_ascii=False, separators=(",", ":"),
        )

    size_mb = os.path.getsize(output) / 1024 / 1024
    print("")
    print("完成！")
    print("  共整理出 {} 個泰文詞".format(len(words)))
    print("  檔案：{}（{:.1f} MB）".format(OUTPUT_NAME, size_mb))
    if bad_lines:
        print("  有 {} 行讀不懂，已略過".format(bad_lines))
    if skipped_other_language:
        print("  有 {} 行不是泰文，已略過".format(skipped_other_language))
    print("")
    print("抽查三個詞：")
    for sample in ["อากาศ", "กิน", "ไป"]:
        if sample in words:
            first = words[sample][0]
            print("  {}：{}，{}".format(sample, first[1] or "（無拼音）", "；".join(first[3][:2])))
        else:
            print("  {}：字典裡沒有".format(sample))


if __name__ == "__main__":
    main()
