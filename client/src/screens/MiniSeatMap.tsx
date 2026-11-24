import { useMemo } from 'react';
import { projectSeats } from '../lib/seatPaths';
import type { StaticSeat } from '../lib/types';
import styles from './MiniSeatMap.module.css';

/** Small, uncoloured map of the 70 assembly constituencies. Seats in
 *  `highlighted` fill with `highlightColor`; `seatColors` (seat number to
 *  colour) fills seats individually instead.
 *  Separate from the landing page's coloured ConstituencyMap. */
export default function MiniSeatMap({
  seats,
  highlighted,
  highlightColor,
  seatColors
}: {
  seats: StaticSeat[];
  highlighted?: ReadonlySet<string>;
  highlightColor?: string;
  seatColors?: Readonly<Record<string, string>>;
}) {
  const { paths, viewBox } = useMemo(() => projectSeats(seats), [seats]);

  return (
    <div className={styles.wrap}>
      <svg className={styles.map} viewBox={viewBox} aria-label="Map of Delhi's 70 assembly constituencies">
        {paths.map((p) => (
          <path
            key={p.acNo}
            className={styles.seat}
            style={
              seatColors?.[p.acNo]
                ? { fill: seatColors[p.acNo] }
                : highlighted?.has(p.acNo) && highlightColor
                  ? { fill: highlightColor }
                  : undefined
            }
            d={p.d}
          />
        ))}
      </svg>
    </div>
  );
}
