#!/usr/bin/env python3
"""Bundle non-Hafs riwayah verse text (KFGQPC, via github.com/thetruetruth/quran-data-kfgqpc)
into public/quran/riwayat/<key>/<chapter>.json and fonts into public/fonts/<key>.woff2,
so riwayah text needs no external requests at runtime."""
import json, os, re, urllib.request

BASE = "https://raw.githubusercontent.com/thetruetruth/quran-data-kfgqpc/main"
SETS = {
    "duri": ("doori/data/DooriData_v09.json", "doori/font/doori.9.woff2"),
    "warsh": ("warsh/data/warshData_v10.json", "warsh/font/warsh.10.woff2"),
    "qalun": ("qaloon/data/QaloonData_v10.json", "qaloon/font/qaloon.10.woff2"),
    "bazzi": ("bazzi/data/BazziData_v07.json", "bazzi/font/bazzi.7.woff2"),
}
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
TRAIL = re.compile(r"\s*[\u0660-\u0669]+\s*$")

for key, (data, font) in SETS.items():
    rows = json.load(urllib.request.urlopen(f"{BASE}/{data}"))
    out = os.path.join(ROOT, "quran", "riwayat", key)
    os.makedirs(out, exist_ok=True)
    chapters: dict[int, list] = {}
    for r in rows:
        chapters.setdefault(int(r["sura_no"]), []).append({"id": int(r["aya_no"]), "text": TRAIL.sub("", r["aya_text"].strip())})
    assert len(chapters) == 114, key
    for ch, verses in chapters.items():
        with open(os.path.join(out, f"{ch}.json"), "w", encoding="utf-8") as f:
            json.dump(sorted(verses, key=lambda v: v["id"]), f, ensure_ascii=False, separators=(",", ":"))
    os.makedirs(os.path.join(ROOT, "fonts"), exist_ok=True)
    with open(os.path.join(ROOT, "fonts", f"{key}.woff2"), "wb") as f:
        f.write(urllib.request.urlopen(f"{BASE}/{font}").read())
    print(key, len(rows), "verses")
