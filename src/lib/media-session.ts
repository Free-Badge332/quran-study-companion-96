/**
 * Lock-screen / notification media controls (Media Session API) and
 * phone-call interruption handling for the recitation player.
 *
 * On Android the WebView surfaces Media Session metadata and action
 * handlers on the lock screen and in the media notification, and the
 * system pauses the audio element when another app (e.g. a phone call)
 * takes audio focus. We classify that pause as an interruption and
 * resume only when the user returns to the app.
 */

export type NowPlaying = { title: string; artist: string; album: string };

type MediaSessionLike = {
  metadata: unknown;
  playbackState: string;
  setActionHandler: (action: string, handler: (() => void) | null) => void;
};

function session(): MediaSessionLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = navigator as Navigator & { mediaSession?: MediaSessionLike };
  return nav.mediaSession;
}

export function mediaSessionSupported(): boolean {
  return session() !== undefined;
}

export function setNowPlaying(info: NowPlaying | null, artworkUrl = '/logo.png'): void {
  const s = session();
  if (!s) return;
  if (!info) {
    s.metadata = null;
    s.playbackState = 'none';
    return;
  }
  const Metadata = (globalThis as { MediaMetadata?: new (init: unknown) => unknown }).MediaMetadata;
  const artwork = [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }];
  s.metadata = Metadata ? new Metadata({ ...info, artwork }) : ({ ...info, artwork } as unknown);
}

export function setMediaPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  const s = session();
  if (s) s.playbackState = state;
}

export type MediaActions = {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
};

export function setMediaActionHandlers(actions: MediaActions): void {
  const s = session();
  if (!s) return;
  const map: [string, (() => void) | undefined][] = [
    ['play', actions.onPlay],
    ['pause', actions.onPause],
    ['nexttrack', actions.onNext],
    ['previoustrack', actions.onPrevious],
  ];
  for (const [action, handler] of map) {
    try {
      s.setActionHandler(action, handler ?? null);
    } catch {
      /* action not supported on this platform */
    }
  }
}

export function clearMediaSession(): void {
  setNowPlaying(null);
  setMediaActionHandlers({});
}

/**
 * A pause is a system interruption (phone call, audio-focus loss) only when
 * it was not requested by the user, the track did not end naturally, and the
 * playback request was not superseded by a newer one.
 */
export function isSystemInterruption(args: { superseded: boolean; ended: boolean; userInitiated: boolean }): boolean {
  return !args.superseded && !args.ended && !args.userInitiated;
}

/** Longest interruption (e.g. a phone call) after which we still auto-resume. */
export const MAX_AUTO_RESUME_MS = 10 * 60 * 1000;

/**
 * Resume is safe only when an interruption is pending, recent enough that the
 * listener still expects it, and the element is still paused (nothing else,
 * such as the user or the system, has already resumed it).
 */
export function shouldAutoResume(
  interruptedAt: number | null,
  audio: Pick<HTMLAudioElement, 'paused' | 'ended'> | null,
  now: number = Date.now(),
  maxMs: number = MAX_AUTO_RESUME_MS,
): boolean {
  if (interruptedAt === null || audio === null) return false;
  if (!audio.paused || audio.ended) return false;
  return now - interruptedAt <= maxMs;
}
