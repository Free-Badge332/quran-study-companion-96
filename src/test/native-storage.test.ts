import { beforeEach, describe, expect, it, vi } from 'vitest';
const api=vi.hoisted(()=>({copyFromAssets:vi.fn(),closeConnection:vi.fn().mockResolvedValue(undefined),createConnection:vi.fn(),open:vi.fn(),execute:vi.fn(),run:vi.fn(),query:vi.fn(async(options:{database:string;statement:string})=>{
 if(options.statement.includes('schema_migrations')) return {values:[{version:1},{version:2}]};
 if(options.statement.includes('metadata')) return {values:[{metadata:JSON.stringify({id:114,total_verses:6})}]};
 if(options.statement.includes('FROM ayahs')) return {values:Array.from({length:6},(_,i)=>({id:i+1,text:'Arabic',transliteration:'text',translation:'translation'}))};
 if(options.statement.includes('SELECT value')) return {values:[{value:'done'}]};
 return {values:[]};
})}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true}}));
vi.mock('@capacitor-community/sqlite',()=>({CapacitorSQLite:api}));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.spyOn(console, 'warn').mockImplementation(() => {}); });
describe('Native SQLite initialization',()=>{
 it('initializes user storage exactly once without requiring the Quran archive',async()=>{
  const { initializeStorage } = await import('@/lib/offline-store');
  const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('airplane mode'));
  await Promise.all([initializeStorage(),initializeStorage(),initializeStorage()]);
  expect(api.copyFromAssets).not.toHaveBeenCalled();
  expect(api.createConnection).toHaveBeenCalledTimes(1);
  expect(api.createConnection).toHaveBeenCalledWith(expect.objectContaining({database:'quran_user',readonly:false}));
  expect(network).not.toHaveBeenCalled();
 });
 it('reads a surah with parameterized SQLite queries while offline',async()=>{
  const { loadLocalChapter } = await import('@/lib/offline-store');
  const chapter=await loadLocalChapter(114,'om');
  expect(chapter.verses).toHaveLength(6);
  expect(api.query).toHaveBeenCalledWith(expect.objectContaining({database:'quran',readonly:true,values:['om',114]}));
  expect(api.copyFromAssets).toHaveBeenCalledWith({overwrite:false});
  expect(api.open).not.toHaveBeenCalledWith(expect.objectContaining({database:'quran_user'}));
 });
 it('preserves working user storage when the content archive copy fails',async()=>{
  api.copyFromAssets.mockRejectedValueOnce(new Error('Folder public/assets/databases does not exist or is empty'));
  const { initializeStorage, loadLocalChapter, setValue } = await import('@/lib/offline-store');
  const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({id:114,total_verses:1,verses:[{id:1,text:'Arabic',transliteration:'text',translations:{en:'translation'}}]})));
  await initializeStorage();
  expect((await loadLocalChapter(114,'en')).verses[0]?.translation).toBe('translation');
  await setValue('bookmark',{chapterId:114,verseId:1});
  expect(network).toHaveBeenCalledWith('/quran/114.json');
  expect(api.run).toHaveBeenCalledWith(expect.objectContaining({database:'quran_user',values:['bookmark',JSON.stringify({chapterId:114,verseId:1})]}));
 });
 it('falls back to packaged chapter text if the read-only database cannot open',async()=>{
  api.open.mockRejectedValueOnce(new Error('Local database could not be opened.'));
  const { loadLocalChapter } = await import('@/lib/offline-store');
  const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({id:1,total_verses:1,verses:[{id:1,text:'Arabic',transliteration:'text',translations:{om:'Oromoo'}}]})));
  expect((await loadLocalChapter(1,'om')).verses[0]?.translation).toBe('Oromoo');
  expect(network).toHaveBeenCalledWith('/quran/1.json');
  expect(api.copyFromAssets).toHaveBeenCalledWith({overwrite:false});
 });
 it('retries failed user storage without deleting data and still allows Quran reading',async()=>{
  const { initializeStorage, loadLocalChapter, setValue } = await import('@/lib/offline-store');
  api.open.mockRejectedValueOnce(new Error('Local database could not be opened.'));
  await expect(initializeStorage()).rejects.toThrow('Local database');
  expect((await loadLocalChapter(114,'en')).verses).toHaveLength(6);
  await initializeStorage();
  await setValue('preference:speed',1.5);
  expect(api.run).toHaveBeenCalledWith(expect.objectContaining({values:['preference:speed','1.5']}));
  expect(api.execute.mock.calls.every(([options])=>!String(options.statements).match(/DROP|DELETE/i))).toBe(true);
 });
});
