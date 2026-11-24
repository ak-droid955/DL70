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
  seatColors,
  selected,
  onSelect
}: {
  seats: StaticSeat[];
  highlighted?: ReadonlySet<string>;
  highlightColor?: string;
  seatColors?: Readonly<Record<string, string>>;
  /** With `onSelect`, seats can be clicked (or picked with Enter/Space);
   *  `selected` gets a heavier outline. */
  selected?: string | null;
  onSelect?: (acNo: string) => void;
}) {
  const { paths, viewBox } = useMemo(() => projectSeats(seats), [seats]);

  return (
    <div className={styles.wrap}>
      <svg className={styles.map} viewBox={viewBox} aria-label="Map of Delhi's 70 assembly constituencies">
        {paths.map((p) => (
          <path
            key={p.acNo}
            className={`${styles.seat} ${onSelect ? styles.seatClickable : ''} ${p.acNo === selected ? styles.seatPicked : ''}`}
            style={
              seatColors?.[p.acNo]
                ? { fill: seatColors[p.acNo] }
                : highlighted?.has(p.acNo) && highlightColor
                  ? { fill: highlightColor }
                  : undefined
            }
            d={p.d}
            {...(onSelect && {
              role: 'button',
              tabIndex: 0,
              'aria-label': p.name,
              'aria-pressed': p.acNo === selected,
              onClick: () => onSelect(p.acNo),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p.acNo);
                }
              }
            })}
          />
        ))}
      </svg>
    </div>
  );
}
