import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useLang } from '@/lib/lang';
import { initializeStorage } from '@/lib/offline-store';
import { initializeProgress } from '@/lib/progress';
import { initializeAudio, useOfflineAudio } from '@/lib/offline-audio';
import { useQueryClient } from '@tanstack/react-query';
let started: Promise<void> | undefined;
export function OfflineStatus() {
  const queryClient = useQueryClient();
  const { online } = useOfflineAudio();
  const { t } = useLang();
  const [error, setError] = useState<'' | 'storageError' | 'saveError'>('');
  const [ready, setReady] = useState(false);
  const start = () => {
    setError('');
    if (!started) started = initializeStorage().then(initializeProgress).then(initializeAudio).catch(error => { started = undefined; throw error; });
    void started.then(() => {
      setReady(true);
      void queryClient.invalidateQueries({ queryKey: ['chapter'] });
    }).catch(error => {
      console.error('Device storage initialization failed', error);
      setReady(false);
      setError('storageError');
    });
  };
  useEffect(() => {
    start();
    const onError = () => setError('saveError');
    window.addEventListener('quran-storage-error', onError);
    return () => window.removeEventListener('quran-storage-error', onError);
  }, []);
  // Only speak up when something needs attention: an error, or no internet.
  if (!error && (!ready || online)) return null;
  return <div role="status" className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2 px-4 py-2 text-xs text-muted-foreground">
    {error ? <><span className="text-destructive">{t(error)}</span><Button variant="ghost" size="sm" onClick={start}><RefreshCw />{t('retry')}</Button></> : <><WifiOff size={13} />{t('offlineAvailable')}</>}
  </div>;
}
