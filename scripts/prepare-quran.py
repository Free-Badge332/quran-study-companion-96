"""Reproducible complete text bundle. Requires Python 3; downloads pinned public sources."""
import json, sqlite3, pathlib, urllib.request, tarfile, tempfile, re, hashlib, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/quran'; OUT.mkdir(parents=True,exist_ok=True)
DBDIR=ROOT/'public/assets/databases'; DBDIR.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as temp:
 t=pathlib.Path(temp)
 urllib.request.urlretrieve('https://registry.npmjs.org/quran-json/-/quran-json-3.1.2.tgz',t/'package.tgz')
 with tarfile.open(t/'package.tgz') as archive: archive.extractall(t,filter='data')
 extra={}
 for lang,edition in [('am','amh-muhammedsadiqan'),('om','orm-ghaliapapurapag')]:
  with urllib.request.urlopen(f'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/{edition}.json') as response: rows=json.load(response)['quran']
  assert len(rows)==6236 and all(r['text'].strip() for r in rows)
  extra[lang]={(r['chapter'],r['verse']):r['text'] for r in rows}
 dbpath=DBDIR/'quran.db'; dbpath.unlink(missing_ok=True)
 db=sqlite3.connect(dbpath)
 db.executescript('''
 PRAGMA user_version=1;
 CREATE TABLE chapters(id INTEGER PRIMARY KEY, metadata TEXT NOT NULL);
 CREATE TABLE ayahs(chapter_id INTEGER NOT NULL, verse_id INTEGER NOT NULL, text TEXT NOT NULL, transliteration TEXT NOT NULL, search_text TEXT NOT NULL, PRIMARY KEY(chapter_id,verse_id));
 CREATE TABLE translations(chapter_id INTEGER NOT NULL, verse_id INTEGER NOT NULL, lang TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY(chapter_id,verse_id,lang));
 CREATE TABLE kv(key TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE downloads(key TEXT PRIMARY KEY, reader TEXT NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, status TEXT NOT NULL, path TEXT, bytes INTEGER NOT NULL DEFAULT 0, error TEXT, updated_at INTEGER NOT NULL);
 CREATE TABLE content_versions(name TEXT PRIMARY KEY, version INTEGER NOT NULL);
 INSERT INTO content_versions VALUES('quran',1);
 ''')
 total=0; hashes={}
 for cid in range(1,115):
  base=json.load(open(t/f'package/dist/chapters/en/{cid}.json'))
  meta={k:v for k,v in base.items() if k!='verses'}
  translations={lang:json.load(open(t/f'package/dist/chapters/{lang}/{cid}.json')) for lang in ['en','fr','tr','ru']}
  verses=[]
  for v in base['verses']:
   langtexts={lang:next(x['translation'] for x in chapter['verses'] if x['id']==v['id']) for lang,chapter in translations.items()}
   langtexts.update({lang:rows[(cid,v['id'])] for lang,rows in extra.items()})
   assert all(text.strip() for text in langtexts.values())
   verse={'id':v['id'],'text':v['text'],'transliteration':v['transliteration'],'translations':langtexts}; verses.append(verse)
   db.execute('INSERT INTO ayahs VALUES(?,?,?,?,?)',(cid,v['id'],v['text'],v['transliteration'],re.sub('[\u064B-\u065F\u0670\u06D6-\u06ED]','',v['text'])))
   db.executemany('INSERT INTO translations VALUES(?,?,?,?)',[(cid,v['id'],lang,text) for lang,text in langtexts.items()])
  assert len(verses)==base['total_verses']
  bundle={**meta,'verses':verses}; raw=json.dumps(bundle,ensure_ascii=False,separators=(',',':')).encode(); (OUT/f'{cid}.json').write_bytes(raw)
  hashes[str(cid)]=hashlib.sha256(raw).hexdigest()
  db.execute('INSERT INTO chapters VALUES(?,?)',(cid,json.dumps(meta,ensure_ascii=False)))
  total+=len(verses)
 assert total==6236
 db.commit(); db.close()
 with zipfile.ZipFile(DBDIR/'quran.zip','w',zipfile.ZIP_DEFLATED) as archive: archive.write(dbpath,dbpath.name)
 dbpath.unlink()
 (OUT/'manifest.json').write_text(json.dumps({'version':1,'chapters':114,'ayahs':total,'translations':['en','fr','tr','ru','am','om'],'sha256':hashes,'sources':['quran-json@3.1.2','fawazahmed0/quran-api@1:amh-muhammedsadiqan','fawazahmed0/quran-api@1:orm-ghaliapapurapag'],'tafsir':False},indent=2))
 print('Verified: 114 surahs, 6236 ayahs, 37416 translated ayahs; generated bundled SQLite and chapter JSON.')
