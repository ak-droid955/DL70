import { useEffect, useState } from 'react';
import styles from './LandscapeGuard.module.css';

/** Width, in CSS pixels, that phones and tablets lay the page out at in
 *  landscape: the desktop layout, scaled down by the browser to fit the
 *  screen, so the game looks the same on every device. */
const DESIGN_WIDTH = 1280;

const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1.0';

/** A phone or tablet: its main pointer is a finger. */
function isTouchDevice() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

function isPortrait() {
  return window.matchMedia('(orientation: portrait)').matches;
}

/** Point the viewport meta tag at the desktop width in landscape on a touch
 *  device whose long side is narrower than it; the normal device width
 *  otherwise. */
function applyViewport() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  const longSide = Math.max(window.screen.width, window.screen.height);
  const wanted =
    isTouchDevice() && !isPortrait() && longSide < DESIGN_WIDTH ? `width=${DESIGN_WIDTH}` : DEFAULT_VIEWPORT;
  if (meta.content !== wanted) meta.setAttribute('content', wanted);
}

// Fullscreen + orientation lock only exist on some browsers (Android
// Chrome); iOS has neither, so there the player turns the device by hand.
type LockableOrientation = ScreenOrientation & { lock?: (o: 'landscape') => Promise<void> };
function isIOS() {
  // iPadOS reports itself as a Mac, but with touch points.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}
function canLockLandscape() {
  if (isIOS()) return false;
  const o = window.screen.orientation as LockableOrientation | undefined;
  return !!(o && typeof o.lock === 'function' && document.documentElement.requestFullscreen);
}
async function lockLandscape() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    await (window.screen.orientation as LockableOrientation).lock?.('landscape');
  } catch {
    // Not allowed here; the rotate prompt stays up until the device turns.
  }
}

/**
 * Keeps the game in landscape on phones and tablets.
 * - Always: in landscape, lays the page out at the desktop width (see
 *   DESIGN_WIDTH) so the game UI is the same on every device.
 * - While `active` (playing): in portrait, covers the screen with a prompt
 *   to rotate the device (with a one-tap switch where the browser allows it).
 */
export default function LandscapeGuard({ active }: { active: boolean }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const update = () => {
      applyViewport();
      setBlocked(isTouchDevice() && isPortrait());
    };
    update();
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    portraitQuery.addEventListener('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      portraitQuery.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (!active || !blocked) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="rotate-title">
      <div className={styles.phone} aria-hidden="true">
        <span className={styles.screen} />
      </div>
      <h2 id="rotate-title" className={styles.title}>
        Rotate your device
      </h2>
      <p className={styles.text}>DL-70 is played in landscape. Turn your phone or tablet sideways to continue.</p>
      {canLockLandscape() && (
        <button type="button" className={styles.button} onClick={lockLandscape}>
          Switch to landscape
        </button>
      )}
    </div>
  );
}
