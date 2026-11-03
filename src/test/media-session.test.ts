import { describe, expect, it, beforeEach } from 'vitest';
import { isSystemInterruption, shouldAutoResume, setNowPlaying, setMediaPlaybackState, setMediaActionHandlers, clearMediaSession, mediaSessionSupported } from '@/lib/media-session';

type Handler = (() => void) | null;
function mockMediaSession() {
  const handlers = new Map<string, Handler>();
  const mock = {
    metadata: null as unknown,
    playbackState: 'none',
    setActionHandler: (action: string, handler: Handler) => { handlers.set(action, handler); },
  };
  Object.defineProperty(globalThis.navigator, 'mediaSession', { value: mock, configurable: true, writable: true });
  return { mock, handlers };
}

describe('Phone-call interruption classification', () => {
  it('treats an unrequested pause of an unfinished track as a system interruption', () => {
    expect(isSystemInterruption({ superseded: false, ended: false, userInitiated: false })).toBe(true);
  });
  it('does not treat a user pause as an interruption', () => {
    expect(isSystemInterruption({ superseded: false, ended: false, userInitiated: true })).toBe(false);
  });
  it('does not treat natural track end as an interruption', () => {
    expect(isSystemInterruption({ superseded: false, ended: true, userInitiated: false })).toBe(false);
  });
  it('does not treat a superseded playback request as an interruption', () => {
    expect(isSystemInterruption({ superseded: true, ended: false, userInitiated: false })).toBe(false);
  });
  it('only auto-resumes when an interruption is pending and the audio is still paused', () => {
    const now = 1_000_000;
    expect(shouldAutoResume(now - 1000, { paused: true, ended: false }, now)).toBe(true);
    expect(shouldAutoResume(now - 1000, { paused: false, ended: false }, now)).toBe(false);
    expect(shouldAutoResume(null, { paused: true, ended: false }, now)).toBe(false);
    expect(shouldAutoResume(now - 1000, null, now)).toBe(false);
    expect(shouldAutoResume(now - 1000, { paused: true, ended: true }, now)).toBe(false);
  });
  it('does not auto-resume after an interruption longer than 10 minutes', () => {
    const now = 10_000_000;
    expect(shouldAutoResume(now - 10 * 60 * 1000, { paused: true, ended: false }, now)).toBe(true);
    expect(shouldAutoResume(now - 10 * 60 * 1000 - 1, { paused: true, ended: false }, now)).toBe(false);
  });
});

describe('Lock-screen media controls', () => {
  beforeEach(() => { mockMediaSession(); });

  it('reports support when the platform exposes Media Session', () => {
    expect(mediaSessionSupported()).toBe(true);
  });

  it('publishes surah, reciter, and bundled artwork as now-playing metadata', () => {
    const { mock } = mockMediaSession();
    setNowPlaying({ title: 'Al-Fatihah · 1:1', artist: 'Abdul Basit', album: 'My Quran' });
    const metadata = mock.metadata as { title: string; artist: string; album: string; artwork: { src: string }[] };
    expect(metadata.title).toBe('Al-Fatihah · 1:1');
    expect(metadata.artist).toBe('Abdul Basit');
    expect(metadata.artwork[0]?.src).toBe('/logo.png');
  });

  it('registers play, pause, next, and previous handlers and clears them', () => {
    const { handlers } = mockMediaSession();
    const onPlay = () => {};
    setMediaActionHandlers({ onPlay });
    expect(handlers.get('play')).toBe(onPlay);
    expect(handlers.get('pause')).toBeNull();
    expect(handlers.get('nexttrack')).toBeNull();
    expect(handlers.get('previoustrack')).toBeNull();
    clearMediaSession();
    expect(handlers.get('play')).toBeNull();
  });

  it('updates playback state and resets it when cleared', () => {
    const { mock } = mockMediaSession();
    setMediaPlaybackState('playing');
    expect(mock.playbackState).toBe('playing');
    clearMediaSession();
    expect(mock.playbackState).toBe('none');
    expect(mock.metadata).toBeNull();
  });
});
