import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';
import { execFileSync } from 'node:child_process';
import { USER_MIGRATIONS } from '@/lib/offline-store';
describe('Native offline packaging',()=>{
  it('uses a local webDir without a remote server',()=>{ expect(config.webDir).toBe('dist-mobile'); expect(config.server?.url).toBeUndefined(); });
  it('opens the bundled SQLite archive and verifies complete Arabic and translations',()=>{
    const result=execFileSync('python3',['-c',`import zipfile,sqlite3,tempfile,json
with tempfile.TemporaryDirectory() as t:
 z=zipfile.ZipFile('public/assets/databases/quran.zip'); z.extractall(t)
 c=sqlite3.connect(t+'/quran.db')
 print(json.dumps([c.execute('select count(*) from chapters').fetchone()[0],c.execute('select count(*) from ayahs').fetchone()[0],c.execute('select count(*) from translations').fetchone()[0]]))`],{encoding:'utf8'});
    expect(JSON.parse(result)).toEqual([114,6236,37416]);
  });
  it('applies migrations transactionally while preserving saved user data',()=>{
    const result=execFileSync('python3',['-c',`import sqlite3,json
c=sqlite3.connect(':memory:')
migrations=json.loads(${JSON.stringify(JSON.stringify(USER_MIGRATIONS))})
for m in migrations: c.executescript(m['sql'])
c.execute('insert into kv values (?,?)',('bookmark','saved'))
c.commit()
for m in migrations: c.executescript(m['sql'])
print(c.execute('select value from kv where key=?',('bookmark',)).fetchone()[0])`],{encoding:'utf8'});
    expect(result.trim()).toBe('saved');
  });
});
