import rallyStageAvif from '../assets/bg-rally-stage.avif';
import rallyStageWebp from '../assets/bg-rally-stage.webp';
import rallyTruckAvif from '../assets/bg-rally-truck-join.avif';
import rallyTruckWebp from '../assets/bg-rally-truck-join.webp';
import pollingBoothAvif from '../assets/bg-polling-booth.avif';
import pollingBoothWebp from '../assets/bg-polling-booth.webp';
import heroAvif from '../assets/hero-building.avif';
import heroWebp from '../assets/hero-building.webp';

// Background photos ship as AVIF (roughly half the bytes of the original
// JPEGs) with a WebP fallback. The choice is made once, synchronously, so the
// URL we put in inline styles is the same one the preload in index.html
// fetched (see the bg-preload plugin in vite.config.ts, which uses this exact
// test).
const supportsAvif =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('background-image', 'image-set(url("x.avif") type("image/avif"))');

const pick = (avif: string, webp: string) => (supportsAvif ? avif : webp);

export const heroBg = pick(heroAvif, heroWebp);
export const rallyStageBg = pick(rallyStageAvif, rallyStageWebp);
export const rallyTruckBg = pick(rallyTruckAvif, rallyTruckWebp);
export const pollingBoothBg = pick(pollingBoothAvif, pollingBoothWebp);

/** Fetch and decode the room backdrops in idle time, so Join/Create show
 *  their photo immediately instead of popping it in after navigation. */
export function warmRoomBackgrounds() {
  const run = () => {
    [rallyStageBg, rallyTruckBg, pollingBoothBg].forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  };
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (ric) ric(run);
  else setTimeout(run, 1500);
}
