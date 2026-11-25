import { useMemo } from 'react';
import { projectSeats } from '../lib/seatPaths';
import type { StaticSeat } from '../lib/types';
import styles from './ConstituencyMap.module.css';

// Flag-echoing bands: the northern third of the map is saffron, the middle
// paper-white, the south green — the same north/middle/south latitude banding
// the design's Leaflet map uses.
const BAND_FILL = ['oklch(68% 0.19 48)', 'oklch(97% 0.01 75)', 'oklch(50% 0.14 145)'];
const BAND_STROKE = ['oklch(48% 0.17 48)', 'oklch(75% 0.01 75)', 'oklch(32% 0.12 145)'];

/** Decorative, non-interactive map of the 70 assembly constituencies, drawn
 *  as inline SVG from the seat geometry the app already loads. The design
 *  iframes a Leaflet map here; an SVG needs no tiles, no second document and
 *  no map interaction — the map is purely illustrative. */
export default function ConstituencyMap({ seats }: { seats: StaticSeat[] }) {
  const { paths, viewBox } = useMemo(() => {
    const { paths: projected, viewBox } = projectSeats(seats);
    const seatLatMin = Math.min(...projected.map((p) => p.meanLat));
    const seatLatMax = Math.max(...projected.map((p) => p.meanLat));
    const span = seatLatMax - seatLatMin || 1;
    const paths = projected.map((p) => {
      const t = (p.meanLat - seatLatMin) / span;
      const band = t > 0.62 ? 0 : t > 0.36 ? 1 : 2;
      return { ...p, fill: BAND_FILL[band], stroke: BAND_STROKE[band] };
    });
    return { paths, viewBox };
  }, [seats]);

  return (
    <svg className={styles.map} viewBox={viewBox} role="img" aria-label="Map of Delhi's 70 assembly constituencies">
      {paths.map((p) => (
        <path key={p.acNo} className={styles.seat} d={p.d} fill={p.fill} stroke={p.stroke}>
          <title>{p.name}</title>
        </path>
      ))}
    </svg>
  );
}
