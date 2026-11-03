import { Download, Trash2, Pause, Play, RefreshCw, Check } from 'lucide-react';
import { Button } from './ui/button';
import { deleteRecitations, enqueueRecitations, controlDownloads, useOfflineAudio } from '@/lib/offline-audio';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useLang } from '@/lib/lang';
import { refreshDownloads } from '@/lib/offline-audio';
export function AudioDownloads({ reader, chapter, count }: { reader: string; chapter: number; count: number }) {
  const { t } = useLang();
  const { records, busy, progress, message, online } = useOfflineAudio();
  const saved = records.filter(r => r.reader === reader && r.chapter === chapter && r.status === 'downloaded');
  const retry = records.some(r => r.reader === reader && r.chapter === chapter && r.status === 'error');
  const chapterRecords = records.filter(r => r.reader === reader && r.chapter === chapter);
  const queued = chapterRecords.some(r => ['queued', 'downloading'].includes(r.status));
  const paused = chapterRecords.some(r => r.status === 'paused');
  const keys = chapterRecords.map(r => r.key);
  const bytes = saved.reduce((n,r) => n + r.bytes,0);
  useEffect(() => { void refreshDownloads().catch(() => {}); }, []);
  return <section aria-label="Offline recitation" className="mb-6 border-y border-border py-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{saved.length === count ? <Check size={16} className="text-primary" /> : <Download size={16} />}{t('versesDownloaded', { a: saved.length, b: count })} · {(bytes / 1048576).toFixed(1)} MB</span>
      <div className="flex flex-wrap gap-2">
        {queued ? <Button variant="outline" size="sm" className="min-h-11" onClick={() => void controlDownloads('pause', keys)}><Pause />Pause downloads</Button> : <Button variant="outline" size="sm" className="min-h-11" disabled={!online || saved.length === count} onClick={() => void enqueueRecitations(reader,chapter,Array.from({ length: count },(_,i) => i + 1)).catch(() => {})}>{paused ? <Play /> : retry ? <RefreshCw /> : <Download />}{paused ? 'Resume downloads' : retry ? t('retryDownload') : t('downloadSurah')}</Button>}
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={t('deleteAudio')} title={t('deleteAudio')} disabled={!chapterRecords.length} onClick={() => { if (window.confirm(t('deleteConfirm'))) void deleteRecitations(reader,chapter); }}><Trash2 /></Button>
        <Button variant="ghost" size="sm" asChild><Link to="/downloads">Downloads</Link></Button>
      </div>
    </div>
    {busy && chapterRecords.some(r => r.status === 'downloading') && <progress className="mt-2 h-1 w-full accent-primary" value={progress} max={100} aria-label="Audio download progress" />}
    {message && <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>}
  </section>;
}
