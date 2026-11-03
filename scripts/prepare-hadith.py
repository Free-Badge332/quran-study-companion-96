#!/usr/bin/env python3
"""Build bundled, offline Hadith data from a pinned fawazahmed0/hadith-api commit.

Output: public/hadith/collections.json and public/hadith/<collection>/<book>.json
Nothing is translated or edited: Arabic and English text are copied verbatim.
"""
import json, os, urllib.request

SHA = "df57907be35291c91ad6a6691180e22ca9920784"
BASE = f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@{SHA}/editions"
COLLECTIONS = {"bukhari": "Sahih al-Bukhari", "muslim": "Sahih Muslim"}
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "hadith")

def get(name):
    with urllib.request.urlopen(f"{BASE}/{name}.min.json", timeout=120) as r:
        return json.load(r)

summary = []
for cid, title in COLLECTIONS.items():
    en, ar = get(f"eng-{cid}"), get(f"ara-{cid}")
    arabic = {h["hadithnumber"]: h["text"] for h in ar["hadiths"]}
    books = {}
    for h in en["hadiths"]:
        a = (arabic.get(h["hadithnumber"]) or "").strip()
        e = (h["text"] or "").strip()
        if not a and not e:
            continue
        b = h["reference"]["book"]
        books.setdefault(b, []).append({
            "n": h["hadithnumber"], "an": h.get("arabicnumber"), "ar": a, "en": e,
            "book": b, "inBook": h["reference"]["hadith"],
            "grades": [{"grade": g["grade"], "by": g["name"]} for g in h.get("grades", [])],
        })
    os.makedirs(os.path.join(OUT, cid), exist_ok=True)
    meta = []
    for b in sorted(books):
        items = books[b]
        with open(os.path.join(OUT, cid, f"{b}.json"), "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, separators=(",", ":"))
        meta.append({"id": b, "name": en["metadata"]["sections"].get(str(b)) or "Introduction",
                     "count": len(items), "first": items[0]["n"], "last": items[-1]["n"]})
    summary.append({"id": cid, "name": title, "total": sum(m["count"] for m in meta), "books": meta})
    print(cid, len(meta), "books", summary[-1]["total"], "hadith")

with open(os.path.join(OUT, "collections.json"), "w", encoding="utf-8") as f:
    json.dump({"source": "fawazahmed0/hadith-api", "commit": SHA,
               "url": f"https://github.com/fawazahmed0/hadith-api/tree/{SHA}",
               "collections": summary}, f, ensure_ascii=False, indent=1)
