import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeStorage, loadLocalChapter, getValue, setValue } from '@/lib/offline-store';
import { deleteRecitations, downloadRecitations, resolveAudio, stopDownloads } from '@/lib/offline-audio';
import { CHAPTER_LIST, LANGUAGES, READERS, stripTashkeel } from '@/lib/quran';
import { initializeProgress, toggleBookmark } from '@/lib/progress';
const read = (id: number) => JSON.parse(readFileSync(`public/quran/${id}.json`, 'utf8'));
beforeEach(() => { vi.restoreAllMocks(); vi.stubGlobal('Blob', NodeBlob); Object.defineProperty(navigator,'onLine',{value:true,configurable:true}); });
describe('Bundled Quran completeness', () => {
  it('contains exactly 114 surahs and all 6236 Arabic ayahs', () => {
    expect(CHAPTER_LIST).toHaveLength(114);
    let total=0;
    for (const c of CHAPTER_LIST) {
      const bundled=read(c.id); expect(bundled.verses).toHaveLength(c.totalVerses);
      for (let i=0;i<bundled.verses.length;i++) { expect(bundled.verses[i].id).toBe(i+1); expect(bundled.verses[i].text.trim().length).toBeGreaterThan(0); }
      total+=bundled.verses.length;
    }
    expect(total).toBe(6236);
  });
  for (const lang of LANGUAGES.filter(l=>l.id!=='ar')) it(`preserves all 6236 ${lang.id} translations offline`, () => {
    let total=0;
    for(let id=1;id<=114;id++) for(const v of read(id).verses) { expect(v.translations[lang.id].trim().length).toBeGreaterThan(0); total++; }
    expect(total).toBe(6236);
  });
  it('preserves all three existing reciters', () => { expect(READERS.map(r=>r.id)).toEqual(['Abdul_Basit_Mujawwad_128kbps','Yasser_Ad-Dussary_128kbps','Alafasy_128kbps']); });
});
describe('Durable device data and offline reading', () => {
  it('imports legacy bookmarks once without overwriting newer saved data', async () => {
    localStorage.setItem('quran-progress-v1',JSON.stringify({read:{},minutes:{},bookmarks:[{chapterId:1,verseId:1,text:'legacy',savedAt:1}]}));
    await Promise.all([initializeStorage(),initializeStorage()]);
    expect((await getValue<{bookmarks:unknown[]}>('quran-progress-v1'))?.bookmarks).toHaveLength(1);
    await initializeProgress(); toggleBookmark(1,2,'saved');
    await vi.waitFor(async()=>expect((await getValue<{bookmarks:unknown[]}>('quran-progress-v1'))?.bookmarks).toHaveLength(2));
    localStorage.setItem('quran-progress-v1','{}'); await initializeStorage();
    expect((await getValue<{bookmarks:unknown[]}>('quran-progress-v1'))?.bookmarks).toHaveLength(2);
  });
  it('loads every surah from local assets and then reads cached content without any request', async () => {
    const network=vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(JSON.stringify(read(Number(String(input).match(/(\d+)\.json/)?.[1])))));
    for(let id=1;id<=114;id++) expect((await loadLocalChapter(id,'am')).verses).toHaveLength(CHAPTER_LIST[id-1]?.totalVerses ?? 0);
    network.mockRejectedValue(new Error('offline'));
    for(let id=1;id<=114;id++) expect((await loadLocalChapter(id,'om')).id).toBe(id);
    expect(network).toHaveBeenCalledTimes(114);
  });
  it('searches cached Arabic text offline', async () => { const c=await loadLocalChapter(1,'ar'); expect(c.verses.filter(v=>stripTashkeel(v.text).includes('ٱلرحمن')).map(v=>v.id)).toEqual([1,3]); });
  it('persists preferences and last-read position', async () => { await setValue('preference:speed',1.5); await setValue('last-read',{chapterId:114,verseId:6}); expect(await getValue('preference:speed')).toBe(1.5); expect(await getValue('last-read')).toEqual({chapterId:114,verseId:6}); });
  it('rejects invalid surah ids', async()=>{ await expect(loadLocalChapter(115,'en')).rejects.toThrow('Invalid surah'); });
});
describe('Audio download reliability', () => {
  it('stops an interrupted web download and retries only the incomplete verse', async () => {
    const network=vi.spyOn(globalThis,'fetch').mockImplementation((_url,options)=>new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted')))));
    const task=downloadRecitations('Alafasy_128kbps',1,[3]);
    await vi.waitFor(()=>expect(network).toHaveBeenCalledTimes(1));
    stopDownloads(); await task;
    network.mockResolvedValue(new Response(new Uint8Array([73,68,51,3])));
    await downloadRecitations('Alafasy_128kbps',1,[3]);
    expect(network).toHaveBeenCalledTimes(2);
    await deleteRecitations('Alafasy_128kbps',1);
  });
  it('reports storage failure without marking audio as downloaded', async () => {
    const store=await import('@/lib/offline-store');
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([73,68,51])));
    vi.spyOn(store,'putAudio').mockRejectedValueOnce(new DOMException('Storage full','QuotaExceededError'));
    await downloadRecitations('Alafasy_128kbps',1,[4]);
    expect((await store.listDownloads()).find(r=>r.key==='Alafasy_128kbps/1/4')?.status).toBe('error');
    await deleteRecitations('Alafasy_128kbps',1);
  });

  it('saves audio, plays it offline, skips duplicate downloads, retries failed verses and deletes files', async () => {
    const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([73,68,51,1]),{headers:{'content-type':'audio/mpeg'}}));
    vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=> 'blob:offline-verse'),revokeObjectURL:vi.fn()}));
    await downloadRecitations(READERS[0]?.id ?? '',1,[1]);
    Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
    expect((await resolveAudio(READERS[0]?.id ?? '',1,1)).url).toBe('blob:offline-verse');
    const requests=network.mock.calls.length;
    await expect(resolveAudio(READERS[0]?.id ?? '',1,2)).rejects.toThrow('not downloaded'); expect(network).toHaveBeenCalledTimes(requests);
    Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
    await downloadRecitations(READERS[0]?.id ?? '',1,[1]); expect(network).toHaveBeenCalledTimes(requests);
    network.mockRejectedValueOnce(new Error('interrupted'));
    await downloadRecitations(READERS[0]?.id ?? '',1,[2]);
    network.mockResolvedValue(new Response(new Uint8Array([73,68,51,2])));
    await downloadRecitations(READERS[0]?.id ?? '',1,[1,2]);
    expect(network).toHaveBeenCalledTimes(requests+2);
    await deleteRecitations(READERS[0]?.id ?? '',1);
    Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
    await expect(resolveAudio(READERS[0]?.id ?? '',1,1)).rejects.toThrow('not downloaded');
  });
  it('cancels a queued ayah and resume downloads it later', async () => {
    const { enqueueRecitations, controlDownloads } = await import('@/lib/offline-audio');
    const store=await import('@/lib/offline-store');
    Object.defineProperty(navigator,'onLine',{value:false,configurable:true});
    await enqueueRecitations('Alafasy_128kbps',2,[5]);
    await controlDownloads('cancel',['Alafasy_128kbps/2/5']);
    expect((await store.listDownloads()).find(r=>r.key==='Alafasy_128kbps/2/5')?.status).toBe('cancelled');
    Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([73,68,51,5])));
    await controlDownloads('resume',['Alafasy_128kbps/2/5']);
    await downloadRecitations('Alafasy_128kbps',2,[5]);
    expect((await store.listDownloads()).find(r=>r.key==='Alafasy_128kbps/2/5')?.status).toBe('downloaded');
    await deleteRecitations('Alafasy_128kbps',2);
  });
  it('flags a missing recording and never streams it when downloaded playback is chosen', async () => {
    const store=await import('@/lib/offline-store');
    const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([73,68,51,6])));
    await downloadRecitations('Alafasy_128kbps',3,[1]);
    await store.deleteAudio('Alafasy_128kbps/3/1');
    const calls=network.mock.calls.length;
    await expect(resolveAudio('Alafasy_128kbps',3,1,'downloaded')).rejects.toThrow('missing');
    expect(network).toHaveBeenCalledTimes(calls);
    expect((await store.listDownloads()).find(r=>r.key==='Alafasy_128kbps/3/1')?.status).toBe('error');
    await deleteRecitations('Alafasy_128kbps',3);
  });
  it('rejects a corrupted (non-MP3) download', async () => {
    const store=await import('@/lib/offline-store');
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(new Uint8Array([60,104,116,109])));
    await downloadRecitations('Alafasy_128kbps',4,[1]);
    expect((await store.listDownloads()).find(r=>r.key==='Alafasy_128kbps/4/1')?.status).toBe('error');
    await deleteRecitations('Alafasy_128kbps',4);
  });
  it('deletes every recording for one reciter only', async () => {
    const store=await import('@/lib/offline-store');
    vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(new Uint8Array([73,68,51,7])));
    await downloadRecitations('Alafasy_128kbps',5,[1]);
    await downloadRecitations('Alafasy_128kbps',6,[1]);
    await downloadRecitations('Yasser_Ad-Dussary_128kbps',5,[1]);
    await deleteRecitations('Alafasy_128kbps');
    const left=(await store.listDownloads()).map(r=>r.key);
    expect(left.filter(k=>k.startsWith('Alafasy'))).toEqual([]);
    expect(left).toContain('Yasser_Ad-Dussary_128kbps/5/1');
    await deleteRecitations('Yasser_Ad-Dussary_128kbps');
  });
});
