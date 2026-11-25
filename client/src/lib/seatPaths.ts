import type { StaticSeat } from './types';

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

export interface SeatPath {
  acNo: string;
  name: string;
  /** SVG path data for the seat's outline(s), in viewBox units. */
  d: string;
  /** Average latitude of the seat's outline points. */
  meanLat: number;
}

/** Projects the seats' GeoJSON outlines to SVG paths plus a viewBox that
 *  fits them all with a small margin. Equirectangular, with longitude
 *  squeezed by cos(latitude) so Delhi doesn't come out stretched sideways. */
export function projectSeats(seats: StaticSeat[]): { paths: SeatPath[]; viewBox: string } {
  const all = seats.map((seat) => ({ seat, rings: ringsOf(seat.geometry) })).filter((s) => s.rings.length > 0);
  if (all.length === 0) return { paths: [], viewBox: '0 0 100 100' };

  const lats = all.flatMap(({ rings }) => rings.flat().map((c) => c[1]));
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const project = (c: number[]): [number, number] => [c[0] * kx, -c[1]];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const paths = all.map(({ seat, rings }) => {
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

  const pad = (maxX - minX) * 0.02;
  return {
    paths,
    viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
  };
}
