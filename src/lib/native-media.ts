/**
 * Android foreground media service bridge (MediaPlaybackPlugin.java).
 * Keeps recitation playing with the screen locked, shows notification and
 * lock-screen controls, and reports audio-focus changes. No-op on the web,
 * where the Media Session API in media-session.ts is used instead.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type MediaAction = 'play' | 'pause' | 'next' | 'previous';

type MediaPlaybackPlugin = {
  update(o: { title: string; artist: string; playing: boolean; position: number; duration: number }): Promise<void>;
  stop(): Promise<void>;
  addListener(event: 'action', cb: (e: { action: MediaAction }) => void): Promise<PluginListenerHandle>;
};

const native = () => Capacitor.getPlatform() === 'android';
const plugin = registerPlugin<MediaPlaybackPlugin>('MediaPlayback');

export function nativeMediaUpdate(o: { title: string; artist: string; playing: boolean; position?: number | undefined; duration?: number | undefined }) {
  if (!native()) return;
  void plugin.update({ ...o, position: o.position ?? 0, duration: Number.isFinite(o.duration) ? (o.duration ?? 0) : 0 }).catch(() => {});
}

export function nativeMediaStop() {
  if (!native()) return;
  void plugin.stop().catch(() => {});
}

export function onNativeMediaAction(cb: (a: MediaAction) => void): () => void {
  if (!native()) return () => {};
  let handle: PluginListenerHandle | undefined;
  let gone = false;
  void plugin.addListener('action', (e) => cb(e.action)).then((h) => { if (gone) void h.remove(); else handle = h; }).catch(() => {});
  return () => { gone = true; void handle?.remove(); };
}
