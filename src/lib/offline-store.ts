import { Capacitor } from '@capacitor/core';
import { openDB, type IDBPDatabase } from 'idb';
import type { Chapter, Lang } from './quran';

export type Bundle = Omit<Chapter, 'verses'> & { verses: { id: number; text: string; transliteration: string; translations: Record<string, string> }[] };
export type DownloadRecord = { key: string; reader: string; chapter: number; verse: number; status: 'queued' | 'downloading' | 'paused' | 'cancelled' | 'downloaded' | 'error'; path?: string | undefined; bytes: number; error?: string | undefined; updated_at: number; checksum?: string | undefined; total_bytes?: number | undefined; order?: number | undefined };
export const USER_MIGRATIONS = [
  { version: 1, sql: `CREATE TABLE IF NOT EXISTS kv(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS downloads(key TEXT PRIMARY KEY, reader TEXT NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, status TEXT NOT NULL, path TEXT, bytes INTEGER NOT NULL DEFAULT 0, error TEXT, updated_at INTEGER NOT NULL);` },
  { version: 2, sql: `CREATE INDEX IF NOT EXISTS downloads_by_surah ON downloads(reader, chapter, status);` },
  { version: 3, sql: `CREATE TABLE IF NOT EXISTS download_details(key TEXT PRIMARY KEY, checksum TEXT, total_bytes INTEGER, queue_order INTEGER NOT NULL DEFAULT 0);` },
];
let initialization: Promise<void> | undefined;
let web: IDBPDatabase | undefined;
let sqlite: typeof import('@capacitor-community/sqlite').CapacitorSQLite | undefined;
const pendingChapters = new Map<number, Promise<Bundle>>();
let nativeContent: Promise<boolean> | undefined;

// A missing content archive must not prevent opening bookmarks/preferences.
async function openNativeContent() {
  if (!nativeContent) nativeContent = (async () => {
    const api = (await import('@capacitor-community/sqlite')).CapacitorSQLite;
    try {
      await api.copyFromAssets({ overwrite: false });
      await api.closeConnection({ database: 'quran', readonly: true }).catch(() => {});
      await api.createConnection({ database: 'quran', version: 1, encrypted: false, mode: 'no-encryption', readonly: true });
      await api.open({ database: 'quran', readonly: true });
      return true;
    } catch (error) {
      console.warn('Bundled Quran SQLite unavailable; reading packaged chapter JSON instead.', error);
      await api.closeConnection({ database: 'quran', readonly: true }).catch(() => {});
      return false;
    }
  })();
  return nativeContent;
}

export function initializeStorage() {
  if (!initialization) initialization = initialize().catch(error => { initialization = undefined; throw error; });
  return initialization;
}
async function initialize() {
  if (Capacitor.isNativePlatform()) {
    sqlite = (await import('@capacitor-community/sqlite')).CapacitorSQLite;
    await sqlite.closeConnection({ database: 'quran_user', readonly: false }).catch(() => {});
    await sqlite.createConnection({ database: 'quran_user', version: 1, encrypted: false, mode: 'no-encryption', readonly: false });
    await sqlite.open({ database: 'quran_user', readonly: false });
    const db = sqlite;
    const runEach = async (sql: string) => {
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) {
        await db.run({ database: 'quran_user', statement, values: [], transaction: false });
      }
    };
    await runEach('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY)');
    const applied = await sqlite.query({ database: 'quran_user', statement: 'SELECT version FROM schema_migrations', values: [] });
    // Every migration is idempotent (IF NOT EXISTS), so re-running them repairs databases
    // where an earlier version was recorded but its tables were never created.
    for (const migration of USER_MIGRATIONS) {
      await runEach(migration.sql);
      if (!applied.values?.some(row => Number(row.version) === migration.version)) {
        await runEach(`INSERT OR IGNORE INTO schema_migrations VALUES(${migration.version})`);
      }
    }
    await sqlite.run({ database: 'quran_user', statement: "UPDATE downloads SET status='paused', error='Download interrupted. Resume to continue.' WHERE status='downloading'", values: [] });
  } else {
    // Version 3 only adds the read-only 'hadith' cache; existing stores are never touched.
    web = await openDB('my-quran-offline', 3, { upgrade(db) {
      for (const name of ['chapters', 'kv', 'downloads', 'audio', 'hadith']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
    } });
    const interrupted: DownloadRecord[] = await web.getAll('downloads');
    for (const record of interrupted) if (record.status === 'downloading') await web.put('downloads', { ...record, status: 'paused', error: 'Download interrupted. Resume to continue.' }, record.key);
    await navigator.storage?.persist?.().catch(() => false);
  }
  // One-time non-destructive migration; legacy values are never removed.
  const rawGet = async (key: string) => {
    if (sqlite) return (await sqlite.query({ database: 'quran_user', statement: 'SELECT value FROM kv WHERE key=?', values: [key] })).values?.[0]?.value as string | undefined;
    return web?.get('kv', key) as Promise<string | undefined>;
  };
  const rawPut = async (key: string, value: string) => {
    if (sqlite) await sqlite.run({ database: 'quran_user', statement: 'INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', values: [key, value] });
    else await web?.put('kv', value, key);
  };
  if (!(await rawGet('legacy-import-v1'))) {
    for (const key of ['quran-progress-v1', 'quran-lang']) {
      let value: string | null = null;
      try { value = localStorage.getItem(key); } catch { /* Legacy storage may be unavailable on a fresh native install. */ }
      if (value && !(await rawGet(key))) await rawPut(key, value);
    }
    await rawPut('legacy-import-v1', 'done');
  }
}
export async function getValue<T>(key: string): Promise<T | undefined> {
  await initializeStorage();
  const raw = sqlite ? (await sqlite.query({ database: 'quran_user', statement: 'SELECT value FROM kv WHERE key=?', values: [key] })).values?.[0]?.value : await web?.get('kv', key);
  if (raw === undefined) return undefined;
  try { return JSON.parse(raw) as T; } catch { return raw as T; }
}
export async function setValue(key: string, value: unknown) {
  await initializeStorage();
  const raw = JSON.stringify(value);
  if (sqlite) await sqlite.run({ database: 'quran_user', statement: 'INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', values: [key, raw] });
  else await web?.put('kv', raw, key);
}
export async function loadLocalChapter(id: number, lang: Lang): Promise<Chapter> {
  if (!Number.isInteger(id) || id < 1 || id > 114) throw new Error('Invalid surah');
  if (Capacitor.isNativePlatform()) {
    if (await openNativeContent()) {
      try {
        const api = (await import('@capacitor-community/sqlite')).CapacitorSQLite;
        const metadata = (await api.query({ database: 'quran', readonly: true, statement: 'SELECT metadata FROM chapters WHERE id=?', values: [id] })).values?.[0]?.metadata;
        if (!metadata) throw new Error('Bundled Quran database is missing this surah.');
        const result = await api.query({ database: 'quran', readonly: true, statement: 'SELECT a.verse_id AS id,a.text,a.transliteration,t.text AS translation FROM ayahs a LEFT JOIN translations t ON t.chapter_id=a.chapter_id AND t.verse_id=a.verse_id AND t.lang=? WHERE a.chapter_id=? ORDER BY a.verse_id', values: [lang, id] });
        const chapter = { ...JSON.parse(metadata), verses: result.values ?? [] } as Chapter;
        if (chapter.verses.length !== chapter.total_verses) throw new Error('Bundled Quran database is incomplete.');
        return chapter;
      } catch (error) {
        console.warn('Bundled Quran query failed; reading packaged chapter JSON instead.', error);
      }
    }
  } else {
    await initializeStorage();
  }
  let bundle = await web?.get('chapters', id) as Bundle | undefined;
  if (!bundle) {
    let task = pendingChapters.get(id);
    if (!task) {
      task = fetch(`/quran/${id}.json`).then(async response => {
        if (!response.ok) throw new Error('Local Quran content could not be opened.');
        const data = await response.json() as Bundle;
        if (!Capacitor.isNativePlatform()) await web?.put('chapters', data, id);
        return data;
      }).finally(() => pendingChapters.delete(id));
      pendingChapters.set(id, task);
    }
    bundle = await task;
  }
  return { ...bundle, verses: bundle.verses.map(v => ({ id: v.id, text: v.text, transliteration: v.transliteration, translation: lang === 'ar' ? undefined : v.translations[lang] })) };
}
export async function listDownloads(): Promise<DownloadRecord[]> {
  await initializeStorage();
  if (sqlite) return (await sqlite.query({ database: 'quran_user', statement: 'SELECT d.*, x.checksum, x.total_bytes, x.queue_order AS "order" FROM downloads d LEFT JOIN download_details x ON d.key=x.key ORDER BY d.updated_at DESC', values: [] })).values as DownloadRecord[] ?? [];
  return await web?.getAll('downloads') ?? [];
}
export async function saveDownload(r: DownloadRecord) {
  await initializeStorage();
  if (sqlite) {
    await sqlite.run({ database: 'quran_user', statement: 'INSERT INTO downloads(key,reader,chapter,verse,status,path,bytes,error,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET status=excluded.status,path=excluded.path,bytes=excluded.bytes,error=excluded.error,updated_at=excluded.updated_at', values: [r.key,r.reader,r.chapter,r.verse,r.status,r.path ?? null,r.bytes,r.error ?? null,r.updated_at] });
    await sqlite.run({ database: 'quran_user', statement: 'INSERT INTO download_details(key,checksum,total_bytes,queue_order) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET checksum=excluded.checksum,total_bytes=excluded.total_bytes,queue_order=excluded.queue_order', values: [r.key,r.checksum ?? null,r.total_bytes ?? null,r.order ?? 0] });
  }
  else await web?.put('downloads', r, r.key);
}
export async function removeDownload(key: string) {
  await initializeStorage();
  if (sqlite) {
    await sqlite.run({ database: 'quran_user', statement: 'DELETE FROM downloads WHERE key=?', values: [key] });
    await sqlite.run({ database: 'quran_user', statement: 'DELETE FROM download_details WHERE key=?', values: [key] });
  }
  else await web?.delete('downloads', key);
}
export async function putAudio(key: string, blob: Blob) { await initializeStorage(); await web?.put('audio', blob, key); }
export async function getAudio(key: string): Promise<Blob | undefined> { await initializeStorage(); return web?.get('audio', key); }
export async function deleteAudio(key: string) { await initializeStorage(); await web?.delete('audio', key); }
/** Bundled read-only content (hadith). Native reads the packaged file directly; web caches it in IndexedDB. */
const pendingContent = new Map<string, Promise<unknown>>();
export async function loadBundledJson<T>(path: string): Promise<T> {
  // Read-only content must still open even if user storage fails.
  await initializeStorage().catch(error => console.warn('User storage unavailable; reading bundled content directly.', error));
  const cached = web ? await web.get('hadith', path) as T | undefined : undefined;
  if (cached !== undefined) return cached;
  let task = pendingContent.get(path) as Promise<T> | undefined;
  if (!task) {
    task = fetch(path).then(async response => {
      if (!response.ok) throw new Error('Local content could not be opened.');
      const data = await response.json() as T;
      await web?.put('hadith', data, path);
      return data;
    }).finally(() => pendingContent.delete(path));
    pendingContent.set(path, task);
  }
  return task;
}
