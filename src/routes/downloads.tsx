import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Download, Pause, Play, RefreshCw, Trash2, X, HardDrive, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHAPTER_LIST, READERS } from '@/lib/quran';
import { auditDownloads, controlDownloads, deleteRecitations, deleteRecording, enqueueRecitations, useOfflineAudio } from '@/lib/offline-audio';

export const Route = createFileRoute('/downloads')({
  head: () => ({ meta: [
    { title: 'Downloads — My Quran' },
    { name: 'description', content: 'Manage saved Quran recitations, download queues and offline audio on this device.' },
    { property: 'og:title', content: 'Downloads — My Quran' },
    { property: 'og:description', content: 'Saved Quran recitations and download queues on this device.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: DownloadsPage,
});
const size = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
function DownloadsPage() {
  const { records, online, storage, message } = useOfflineAudio();
  const [reader, setReader] = useState(READERS[0]?.id ?? 'Alafasy_128kbps');
  const [reciterFilter, setReciterFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<number[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const single = selection.length === 1 ? CHAPTER_LIST.find(c => c.id === selection[0]) : undefined;
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const run = (task: Promise<unknown>) => { setError(''); void task.catch(e => setError(e instanceof Error ? e.message : 'Please retry.')); };
  useEffect(() => { run(auditDownloads()); }, []);
  const visible = records.filter(r => (reciterFilter === 'all' || r.reader === reciterFilter) && (status === 'all' || (status === 'queue' ? ['queued', 'downloading', 'paused'].includes(r.status) : r.status === status)) && `${r.chapter} ${CHAPTER_LIST.find(c => c.id === r.chapter)?.transliterationName ?? ''} ${r.verse}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);
  const used = records.filter(r => r.status === 'downloaded').reduce((sum, r) => sum + r.bytes, 0);
  const filterClasses = 'min-h-11 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground';
  return <main className="mx-auto max-w-4xl px-4 pb-24">
    <header className="flex items-center gap-3 py-8"><Download className="text-primary" /><h1 className="font-display text-3xl text-foreground">Downloads</h1></header>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-2"><HardDrive size={16} />Saved audio · {size(used)}</span>
      {storage.quota !== undefined && <span>Available · {size(Math.max(0, storage.quota - (storage.usage ?? 0)))}</span>}
      <span>{online ? 'Online' : 'Offline'}</span>
      {storage.persisted === false && <span>Browser may clear storage under pressure.</span>}
    </div>
    <section className="border-b border-border py-5">
      <h2 className="mb-3 font-medium text-foreground">Add surahs</h2>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Download reciter" value={reader} onChange={e => setReader(e.target.value)} className={filterClasses}>{READERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        {single && <>
          <input type="number" aria-label="From ayah" min={1} max={single.totalVerses} placeholder="From ayah 1" value={from} onChange={e => setFrom(e.target.value)} className={`${filterClasses} w-32`} />
          <input type="number" aria-label="To ayah" min={1} max={single.totalVerses} placeholder={`To ayah ${single.totalVerses}`} value={to} onChange={e => setTo(e.target.value)} className={`${filterClasses} w-32`} />
        </>}
        <Button disabled={!selection.length} onClick={() => run((async () => {
          if (single) {
            const a = from ? Number(from) : 1; const b = to ? Number(to) : single.totalVerses;
            if (!(a >= 1 && b <= single.totalVerses && a <= b)) throw new Error(`Choose ayahs between 1 and ${single.totalVerses}.`);
            await enqueueRecitations(reader, single.id, Array.from({ length: b - a + 1 }, (_, i) => a + i));
          } else for (const id of selection) { const c = CHAPTER_LIST.find(c => c.id === id); if (c) await enqueueRecitations(reader, id, Array.from({ length: c.totalVerses }, (_, i) => i + 1)); }
          setSelection([]); setFrom(''); setTo('');
        })())}><Download size={16} />Queue {selection.length || ''}</Button>
      </div>
      {single && <p className="mt-2 text-xs text-muted-foreground">Leave the ayah boxes empty to download the whole surah.</p>}
      <div className="mt-3 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
        {CHAPTER_LIST.map(c => <label key={c.id} className="flex min-h-11 items-center gap-2 text-sm text-foreground"><input type="checkbox" aria-label={`Select ${c.transliterationName}`} checked={selection.includes(c.id)} onChange={e => setSelection(e.target.checked ? [...selection, c.id] : selection.filter(id => id !== c.id))} />{c.id}. {c.transliterationName}</label>)}
      </div>
    </section>
    <section className="py-5">
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input aria-label="Search downloads" placeholder="Search surah or ayah" value={query} onChange={e => setQuery(e.target.value)} className={filterClasses} />
        <select aria-label="Filter reciter" value={reciterFilter} onChange={e => setReciterFilter(e.target.value)} className={filterClasses}><option value="all">All reciters</option>{READERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        <select aria-label="Filter status" value={status} onChange={e => setStatus(e.target.value)} className={filterClasses}>{[['all', 'All statuses'], ['downloaded', 'Downloaded'], ['queue', 'Queue & paused'], ['error', 'Needs attention'], ['cancelled', 'Cancelled']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => run(controlDownloads('pause'))}><Pause size={16} />Pause all</Button>
        <Button variant="outline" size="sm" disabled={!online} onClick={() => run(controlDownloads('resume'))}><Play size={16} />Resume all</Button>
        <Button variant="outline" size="sm" disabled={!online} onClick={() => run(controlDownloads('retry'))}><RefreshCw size={16} />Retry errors</Button>
        <Button variant="ghost" size="sm" disabled={checking} onClick={() => { setChecking(true); run(auditDownloads().finally(() => setChecking(false))); }}><ShieldCheck size={16} />{checking ? 'Checking…' : 'Check files'}</Button>
        {reciterFilter !== 'all' && <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete all recordings and queued downloads for this reciter?')) run(deleteRecitations(reciterFilter)); }}><Trash2 size={16} />Delete reciter</Button>}
      </div>
      {(error || message) && <p role={error ? 'alert' : 'status'} className="mb-4 break-words text-sm text-muted-foreground">{error || message}</p>}
      <ul className="divide-y divide-border">
        {visible.map(r => {
          const name = CHAPTER_LIST.find(c => c.id === r.chapter)?.transliterationName ?? `Surah ${r.chapter}`;
          return <li key={r.key} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1 basis-44"><Link to="/chapter/$id" params={{ id: String(r.chapter) }} search={{ source: 'downloaded', verse: r.verse, reciter: r.reader }} className="font-medium text-primary">{name} · {r.chapter}:{r.verse}</Link><p className="text-xs text-muted-foreground">{READERS.find(reader => reader.id === r.reader)?.name} · {r.status} · {size(r.bytes)}{r.total_bytes && r.status === 'downloading' ? ` / ${size(r.total_bytes)}` : ''}</p>{r.error && <p className="mt-1 break-words text-xs text-destructive">{r.error}</p>}{r.status === 'downloading' && <progress aria-label={`Download progress ${r.chapter}:${r.verse}`} max={r.total_bytes ?? 1} value={r.total_bytes ? r.bytes : undefined} className="mt-2 h-1 w-full accent-primary" />}</div>
            <div className="flex shrink-0 gap-1">
              {r.status === 'downloaded' ? <Button variant="outline" size="icon" asChild title="Play downloaded ayah"><Link aria-label={`Play downloaded ${r.chapter}:${r.verse}`} to="/chapter/$id" params={{ id: String(r.chapter) }} search={{ source: 'downloaded', verse: r.verse, play: 1, reciter: r.reader }}><Play size={16} /></Link></Button> : <>
                {['queued', 'downloading'].includes(r.status) && <Button variant="ghost" size="icon" title="Pause download" aria-label={`Pause ${r.chapter}:${r.verse}`} onClick={() => run(controlDownloads('pause', [r.key]))}><Pause size={16} /></Button>}
                {['paused', 'cancelled', 'error'].includes(r.status) && <Button variant="ghost" size="icon" disabled={!online} title={r.status === 'error' ? 'Retry download' : 'Resume download'} aria-label={`Resume ${r.chapter}:${r.verse}`} onClick={() => run(controlDownloads(r.status === 'error' ? 'retry' : 'resume', [r.key]))}><RefreshCw size={16} /></Button>}
                {r.status !== 'cancelled' && <Button variant="ghost" size="icon" title="Cancel download" aria-label={`Cancel ${r.chapter}:${r.verse}`} onClick={() => run(controlDownloads('cancel', [r.key]))}><X size={16} /></Button>}
              </>}
              <Button variant="ghost" size="icon" title="Delete recording" aria-label={`Delete ${r.chapter}:${r.verse}`} onClick={() => { if (window.confirm('Delete this recording?')) run(deleteRecording(r.key)); }}><Trash2 size={16} /></Button>
            </div>
          </li>;
        })}
      </ul>
      {!visible.length && <p className="py-8 text-center text-muted-foreground">No downloads {records.length ? 'match these filters.' : 'yet.'}</p>}
    </section>
  </main>;
}
