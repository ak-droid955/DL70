import { useMemo } from 'react';
import type { StaticSeat } from '../lib/types';
import styles from './ConstituencyMap.module.css';

// Flag-echoing bands: the northern third of the map is saffron, the middle
// paper-white, the south green — the same north/middle/south latitude banding
// the design's Leaflet map uses.
const BAND_FILL = ['oklch(68% 0.19 48)', 'oklch(97% 0.01 75)', 'oklch(50% 0.14 145)'];
const BAND_STROKE = ['oklch(48% 0.17 48)', 'oklch(75% 0.01 75)', 'oklch(32% 0.12 145)'];

type Ring = number[][];

function ringsOf(geometry: GeoJSON.Geometry): Ring[] {
  if (geometry.type === 'Polygon') return geometry.coordinates as Ring[];
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as Ring[][]).flat();
  // Delhi Cantt (AC 38) is a GeometryCollection of two polygons in the source
  // data — without this it renders as a hole in the middle of the map. The
  // server's extractPolys() recurses the same way.
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(ringsOf);
  return [];
}

/** Decorative, non-interactive map of the 70 assembly constituencies, drawn
 *  as inline SVG from the seat geometry the app already loads. The design
 *  iframes a Leaflet map here; an SVG needs no tiles, no second document and
 *  no map interaction — the map is purely illustrative. */
export default function ConstituencyMap({ seats }: { seats: StaticSeat[] }) {
  const { paths, viewBox } = useMemo(() => {
    const all = seats.map((seat) => ({ seat, rings: ringsOf(seat.geometry) })).filter((s) => s.rings.length > 0);
    if (all.length === 0) return { paths: [], viewBox: '0 0 100 100' };

    // Equirectangular projection with the longitude squeezed by cos(latitude)
    // so Delhi doesn't come out stretched sideways.
    const lats = all.flatMap(({ rings }) => rings.flat().map((c) => c[1]));
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const project = (c: number[]): [number, number] => [c[0] * kx, -c[1]];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const projected = all.map(({ seat, rings }) => {
      const d = rings
        .map((ring) => {
          const pts = ring.map(project);
          pts.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
          return `M${pts.map(([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`).join('L')}Z`;
        })
        .join('');
      const seatLats = rings.flat().map((c) => c[1]);
      const meanLat = seatLats.reduce((a, b) => a + b, 0) / seatLats.length;
      return { acNo: seat.acNo, name: seat.name, d, meanLat };
    });

    const seatLatMin = Math.min(...projected.map((p) => p.meanLat));
    const seatLatMax = Math.max(...projected.map((p) => p.meanLat));
    const span = seatLatMax - seatLatMin || 1;
    const paths = projected.map((p) => {
      const t = (p.meanLat - seatLatMin) / span;
      const band = t > 0.62 ? 0 : t > 0.36 ? 1 : 2;
      return { ...p, fill: BAND_FILL[band], stroke: BAND_STROKE[band] };
    });

    const pad = (maxX - minX) * 0.02;
    return {
      paths,
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
    };
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
