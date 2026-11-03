import { Capacitor } from '@capacitor/core';
import { useSyncExternalStore } from 'react';
import { CHAPTER_LIST } from './quran';
import { recordingUrl, reciterById, WHOLE_SURAH } from './reciters';
import { deleteAudio, getAudio, listDownloads, putAudio, removeDownload, saveDownload, type DownloadRecord } from './offline-store';
import { verifyRecording } from './audio-integrity';

export const audioKey = (reader: string, chapter: number, verse: number) => `${reader}/${chapter}/${verse}`;
const listeners = new Set<() => void>();
let records: DownloadRecord[] = [];
let busy = false;
let progress = 0;
let message = '';
let online = true;
let storage: { usage?: number; quota?: number; persisted?: boolean } = {};
let controller: AbortController | undefined;
let activeKey: string | undefined;
let initialized: Promise<void> | undefined;
let mutations: Promise<unknown> = Promise.resolve();
const interventions = new Map<string, DownloadRecord['status'] | 'delete'>();
let snapshot = { records, busy, progress, message, online, storage };
const serverSnapshot = snapshot;
function emit() { snapshot = { records, busy, progress, message, online, storage }; listeners.forEach(fn => fn()); }
function serial<T>(fn: () => Promise<T>): Promise<T> { const task = mutations.then(fn); mutations = task.catch(() => {}); return task; }
export function useOfflineAudio() { return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => snapshot, () => serverSnapshot); }
export async function refreshDownloads() { records = await listDownloads(); emit(); }
export async function refreshStorage() {
  if (!Capacitor.isNativePlatform() && navigator.storage) {
    const estimate = await navigator.storage.estimate?.();
    storage = { ...estimate, persisted: await navigator.storage.persisted?.() };
  } else storage = { usage: (await listDownloads()).filter(r => r.status === 'downloaded').reduce((sum, r) => sum + r.bytes, 0) };
  emit();
}
async function connected() {
  return Capacitor.isNativePlatform() ? (await (await import('@capacitor/network')).Network.getStatus()).connected : navigator.onLine;
}
export function initializeAudio() {
  if (!initialized) initialized = (async () => {
    online = await connected(); emit();
    const change = (value: boolean) => { online = value; if (!value) controller?.abort(); emit(); if (value) void pump(); };
    if (Capacitor.isNativePlatform()) {
      const { Network } = await import('@capacitor/network');
      await Network.addListener('networkStatusChange', status => change(status.connected));
    } else {
      window.addEventListener('online', () => change(true));
      window.addEventListener('offline', () => change(false));
    }
    await auditDownloads();
    await refreshStorage();
    void pump();
  })().catch(error => { initialized = undefined; throw error; });
  return initialized;
}
const pathFor = (key: string) => `recitations/${key.replaceAll('/', '-')}.mp3`;
async function readBytes(record: DownloadRecord) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const path = record.path ?? pathFor(record.key);
    const stat = await Filesystem.stat({ path, directory: Directory.Data });
    if (record.bytes && stat.size !== record.bytes) throw new Error('Incomplete audio file. Download again.');
    const result = await Filesystem.readFile({ path, directory: Directory.Data });
    if (typeof result.data !== 'string') return new Uint8Array(await result.data.arrayBuffer());
    return Uint8Array.from(atob(result.data), c => c.charCodeAt(0));
  }
  const blob = await getAudio(record.key);
  if (!blob) throw new Error('Audio file missing. Download again.');
  return new Uint8Array(await blob.arrayBuffer());
}
async function validate(record: DownloadRecord) {
  const checksum = verifyRecording(await readBytes(record), record.total_bytes || record.bytes, record.checksum);
  if (!record.checksum) await saveDownload({ ...record, checksum });
}
export async function markAudioInvalid(key: string, reason = 'Recording cannot be played. Download again.') {
  await serial(async () => {
    const record = (await listDownloads()).find(r => r.key === key);
    if (record?.status === 'downloaded') await saveDownload({ ...record, status: 'error', error: reason, updated_at: Date.now() });
  });
  await refreshDownloads();
}
export async function auditDownloads() {
  for (const record of await listDownloads()) {
    if (record.status === 'downloading' && record.key !== activeKey) await saveDownload({ ...record, status: 'paused', error: 'Download interrupted. Resume to continue.', updated_at: Date.now() });
    if (record.status === 'downloaded') {
      try { await validate(record); } catch (error) { await markAudioInvalid(record.key, error instanceof Error ? error.message : 'Audio file missing. Download again.'); }
    }
  }
  await refreshDownloads();
}
export async function resolveAudio(reader: string, chapter: number, verse: number, mode: 'auto' | 'downloaded' = 'auto'): Promise<{ url: string; release: () => void }> {
  const key = audioKey(reader, chapter, verse);
  const record = (await listDownloads()).find(row => row.key === key && row.status === 'downloaded');
  if (record) {
    try {
      await validate(record);
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const result = await Filesystem.getUri({ path: record.path ?? pathFor(key), directory: Directory.Data });
        return { url: Capacitor.convertFileSrc(result.uri), release: () => {} };
      }
      const blob = await getAudio(key);
      if (!blob) throw new Error('Audio file missing. Download again.');
      const url = URL.createObjectURL(blob);
      return { url, release: () => URL.revokeObjectURL(url) };
    } catch (error) {
      await markAudioInvalid(key, error instanceof Error ? error.message : 'Audio file missing. Download again.');
      // Never silently stream a recording that was selected from device storage.
      throw error;
    }
  }
  if (mode === 'downloaded' || !(await connected())) throw new Error('This verse is not downloaded. Connect to the internet to download it.');
  return { url: recordingUrl(reader, chapter, verse), release: () => {} };
}
async function transfer(record: DownloadRecord, signal: AbortSignal) {
  const response = await fetch(recordingUrl(record.reader, record.chapter, record.verse), { signal });
  if (!response.ok) throw new Error(response.status === 404 ? 'This ayah is unavailable from this reciter.' : `Audio download failed (${response.status}). Retry.`);
  const mime = response.headers.get('content-type') ?? '';
  if (/text|json|html/i.test(mime)) throw new Error('Source returned text instead of audio. Retry.');
  const total = Number(response.headers.get('content-length')) || undefined;
  if (total && storage.quota && storage.usage !== undefined && total > storage.quota - storage.usage) throw new Error('Not enough storage. Delete recordings and retry.');
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  let lastSave = 0;
  const stream = response.body?.getReader();
  if (stream) {
    while (true) {
      const { done, value } = await stream.read();
      if (signal.aborted) throw new DOMException('Interrupted', 'AbortError');
      if (done) break;
      chunks.push(new Uint8Array(value)); size += value.length;
      progress = total ? Math.min(99, size / total * 100) : 0;
      records = records.map(r => r.key === record.key ? { ...r, bytes: size, total_bytes: total } : r); emit();
      if (Date.now() - lastSave > 700) { await saveDownload({ ...record, bytes: size, total_bytes: total }); lastSave = Date.now(); }
    }
  } else { const bytes = new Uint8Array(await response.arrayBuffer()); chunks.push(bytes); size = bytes.length; }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const checksum = verifyRecording(bytes, total);
  if (signal.aborted) throw new DOMException('Interrupted', 'AbortError');
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const path = pathFor(record.key); const partial = `${path}.partial`;
    await Filesystem.mkdir({ path: 'recitations', directory: Directory.Data, recursive: true }).catch(() => {});
    let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    try {
      await Filesystem.writeFile({ path: partial, directory: Directory.Data, data: btoa(binary) });
      await Filesystem.deleteFile({ path, directory: Directory.Data }).catch(() => {});
      await Filesystem.rename({ from: partial, to: path, directory: Directory.Data, toDirectory: Directory.Data });
    } finally { await Filesystem.deleteFile({ path: partial, directory: Directory.Data }).catch(() => {}); }
    return { path, bytes: size, total_bytes: size, checksum };
  }
  await putAudio(record.key, new Blob(chunks, { type: 'audio/mpeg' }));
  return { bytes: size, total_bytes: size, checksum };
}
function reason(error: unknown) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'Not enough storage. Delete recordings and retry.';
  return error instanceof Error ? error.message : 'Download failed. Check network and storage, then retry.';
}
async function pump() {
  if (busy) return;
  busy = true; emit();
  try {
    while (true) {
      online = await connected(); if (!online) break;
      const record = await serial(async () => {
        const next = (await listDownloads()).filter(r => r.status === 'queued').sort((a, b) => (a.order ?? a.updated_at) - (b.order ?? b.updated_at))[0];
        if (!next) return;
        activeKey = next.key; controller = new AbortController();
        await saveDownload({ ...next, status: 'downloading', bytes: 0, error: undefined });
        return next;
      });
      if (!record || !controller) break;
      progress = 0; message = record.verse === WHOLE_SURAH ? `Downloading surah ${record.chapter}` : `Downloading ${record.chapter}:${record.verse}`; await refreshDownloads();
      let result: Awaited<ReturnType<typeof transfer>> | undefined;
      let failure: unknown;
      try { result = await transfer(record, controller.signal); } catch (error) { failure = error; }
      await serial(async () => {
        const intervention = interventions.get(record.key); interventions.delete(record.key);
        if (intervention === 'delete') { await eraseFile({ ...record, ...result }); await removeDownload(record.key); }
        else if (intervention) { if (result) await eraseFile({ ...record, ...result }); await saveDownload({ ...record, bytes: 0, status: intervention, error: intervention === 'paused' ? 'Resume restarts this ayah; completed ayahs are kept.' : undefined }); }
        else if (result) { await saveDownload({ ...record, ...result, status: 'downloaded', error: undefined, updated_at: Date.now() }); progress = 100; }
        else { online = await connected(); await saveDownload({ ...record, bytes: 0, status: online ? 'error' : 'paused', error: online ? reason(failure) : 'Connection lost. Resume when online.', updated_at: Date.now() }); message = reason(failure); }
        activeKey = undefined; controller = undefined;
      });
      await refreshDownloads();
    }
  } catch (error) { message = reason(error); }
  finally { busy = false; activeKey = undefined; controller = undefined; await refreshDownloads(); await refreshStorage().catch(() => {}); }
}
export async function enqueueRecitations(reader: string, chapter: number, verses: number[]) {
  const reciter = reciterById(reader);
  if (!reciter) throw new Error('Unsupported reciter.');
  const meta = CHAPTER_LIST.find(c => c.id === chapter);
  if (!meta) throw new Error('Invalid ayah selection.');
  // Whole-surah reciters have one file per surah (verse 0); verse-by-verse reciters need real ayah numbers.
  if (reciter.kind === 'surah') verses = [WHOLE_SURAH];
  else if (verses.some(v => !Number.isInteger(v) || v < 1 || v > meta.totalVerses)) throw new Error('Invalid ayah selection.');
  await serial(async () => {
    const existing = await listDownloads(); let order = Math.max(Date.now(), ...existing.map(r => r.order ?? 0));
    for (const verse of new Set(verses)) {
      const key = audioKey(reader, chapter, verse); let record = existing.find(r => r.key === key);
      if (record?.status === 'downloaded') { try { await validate(record); continue; } catch { record = { ...record, status: 'error' }; } }
      if (record && ['queued', 'downloading'].includes(record.status)) continue;
      await saveDownload({ key, reader, chapter, verse, status: 'queued', bytes: 0, updated_at: Date.now(), order: ++order });
    }
  });
  message = (await connected()) ? 'Added to download queue.' : 'Queued. Downloads start when connected.';
  await refreshDownloads();
  void pump();
}
// Compatibility: existing callers/tests can await completion; new UI uses enqueue directly.
export async function downloadRecitations(reader: string, chapter: number, verses: number[]) {
  await enqueueRecitations(reader, chapter, verses);
  while (busy) await new Promise(resolve => setTimeout(resolve, 20));
}
export async function controlDownloads(action: 'pause' | 'resume' | 'retry' | 'cancel', keys?: string[]) {
  await serial(async () => {
    for (const r of await listDownloads()) {
      if (keys && !keys.includes(r.key)) continue;
      const status = action === 'pause' ? 'paused' : action === 'cancel' ? 'cancelled' : 'queued';
      if (r.status === 'downloaded') continue;
      if (action === 'pause' && !['queued', 'downloading'].includes(r.status)) continue;
      if (action === 'resume' && !['paused', 'cancelled'].includes(r.status)) continue;
      if (action === 'retry' && r.status !== 'error') continue;
      if (r.key === activeKey) { interventions.set(r.key, status); controller?.abort(); }
      else await saveDownload({ ...r, status, bytes: 0, error: undefined, updated_at: Date.now() });
    }
  });
  await refreshDownloads();
  if (action === 'resume' || action === 'retry') void pump();
}
export function stopDownloads() { void controlDownloads('pause'); }
async function eraseFile(record: DownloadRecord) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    for (const path of [record.path ?? pathFor(record.key), `${pathFor(record.key)}.partial`]) {
      // Missing files are safe to delete; permission/storage failures remain visible.
      try { await Filesystem.stat({ path, directory: Directory.Data }); } catch (error) { if (/not exist|not found|enoent/i.test(reason(error))) continue; throw error; }
      await Filesystem.deleteFile({ path, directory: Directory.Data });
    }
  } else await deleteAudio(record.key);
}
export async function deleteRecording(key: string) {
  await serial(async () => {
    const record = (await listDownloads()).find(r => r.key === key); if (!record) return;
    if (activeKey === key) { interventions.set(key, 'delete'); controller?.abort(); return; }
    await eraseFile(record); await removeDownload(key);
  });
  await refreshDownloads(); await refreshStorage();
}
export async function deleteRecitations(reader: string, chapter?: number) {
  try {
    for (const record of (await listDownloads()).filter(r => r.reader === reader && (chapter === undefined || r.chapter === chapter))) await deleteRecording(record.key);
    message = 'Downloaded recitation deleted.';
  } catch (error) { message = reason(error); }
  await refreshDownloads();
}
