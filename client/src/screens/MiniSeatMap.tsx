import { useMemo, useState } from 'react';
import { projectSeats } from '../lib/seatPaths';
import type { StaticSeat } from '../lib/types';
import styles from './MiniSeatMap.module.css';
import SeatStats from './SeatStats';

/** Small, uncoloured map of the 70 assembly constituencies. Seats in
 *  `highlighted` fill with `highlightColor`. Clicking (or pressing
 *  Enter/Space on) a seat selects it and shows its name and past election
 *  results below the map.
 *  Separate from the landing page's coloured ConstituencyMap. */
export default function MiniSeatMap({
  seats,
  highlighted,
  highlightColor
}: {
  seats: StaticSeat[];
  highlighted: ReadonlySet<string>;
  highlightColor: string;
}) {
  const { paths, viewBox } = useMemo(() => projectSeats(seats), [seats]);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedSeat = paths.find((p) => p.acNo === selected);

  return (
    <div className={styles.wrap}>
      <svg className={styles.map} viewBox={viewBox} aria-label="Map of Delhi's 70 assembly constituencies">
        {paths.map((p) => {
          const isSelected = p.acNo === selected;
          return (
            <path
              key={p.acNo}
              className={`${styles.seat} ${isSelected ? styles.seatSelected : ''}`}
              style={highlighted.has(p.acNo) && !isSelected ? { fill: highlightColor } : undefined}
              d={p.d}
              role="button"
              tabIndex={0}
              aria-label={p.name}
              aria-pressed={isSelected}
              onClick={() => setSelected(p.acNo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(p.acNo);
                }
              }}
            />
          );
        })}
      </svg>
      <p className={`${styles.label} ${selectedSeat ? '' : styles.labelHint}`} aria-live="polite">
        {selectedSeat ? selectedSeat.name : 'Click a constituency'}
      </p>
      {selectedSeat && <SeatStats acNo={selectedSeat.acNo} />}
    </div>
  );
}
