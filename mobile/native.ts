import { Capacitor } from '@capacitor/core';
import type { AnyRouter } from '@tanstack/react-router';

/** Oldest Android System WebView (Chromium) major version the app is tested against. */
export const MIN_WEBVIEW_MAJOR = 80;

export function webViewMajor(ua: string): number | null {
  const m = /Chrome\/(\d+)/.exec(ua);
  return m ? Number(m[1]) : null;
}

/** Android/iOS shell behaviour: back button, system bars, keyboard, lifecycle. */
export async function initNative(router: AnyRouter) {
  if (!Capacitor.isNativePlatform()) return;
  const android = Capacitor.getPlatform() === 'android';
  document.documentElement.classList.add('native', `native-${Capacitor.getPlatform()}`);
  const [{ App }, { StatusBar, Style }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
  ]);

  // Back: hide keyboard, then close open dialogs/sheets/menus, then go back, then leave from home.
  App.addListener('backButton', ({ canGoBack }) => {
    const active = document.activeElement as HTMLElement | null;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) && window.visualViewport && window.visualViewport.height < window.innerHeight * 0.85) {
      active.blur();
      return;
    }
    const overlay = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]');
    if (overlay) {
      (document.activeElement ?? document).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }
    const atHome = router.state.location.pathname === '/';
    if (!atHome && (canGoBack || window.history.length > 1)) router.history.back();
    else if (!atHome) router.navigate({ to: '/', replace: true });
    else void App.minimizeApp();
  });

  const syncStatusBar = async () => {
    try {
      const dark = document.documentElement.classList.contains('dark');
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
      if (android) {
        const hex = toHex(getComputedStyle(document.body).backgroundColor);
        if (hex) await StatusBar.setBackgroundColor({ color: hex });
      }
    } catch {
      /* status bar unavailable — keep system default */
    }
  };
  await syncStatusBar();
  new MutationObserver(() => void syncStatusBar()).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Keyboard: keep the focused field visible once the window has resized (adjustResize).
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
    window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'auto' }), 300);
  });

  // Lifecycle: re-read saved data (bookmarks, downloads) on return; resync bars after theme/system changes.
  App.addListener('resume', () => { void router.invalidate(); void syncStatusBar(); });

  // Old Android System WebView: warn once instead of failing silently.
  const major = webViewMajor(navigator.userAgent);
  if (android && major !== null && major < MIN_WEBVIEW_MAJOR) showWebViewNotice();
}

function showWebViewNotice() {
  const bar = document.createElement('div');
  bar.setAttribute('role', 'alert');
  bar.className = 'native-notice';
  bar.textContent = 'Your Android System WebView is out of date. Update it from Google Play for the best experience.';
  bar.addEventListener('click', () => bar.remove());
  document.body.appendChild(bar);
}

function toHex(color: string): string | null {
  const c = document.createElement('canvas').getContext('2d');
  if (!c) return null;
  c.fillStyle = color;
  const v = c.fillStyle;
  return typeof v === 'string' && v.startsWith('#') ? v : null;
}
