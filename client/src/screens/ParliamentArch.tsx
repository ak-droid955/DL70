import { useMemo } from 'react';
import styles from './ParliamentArch.module.css';

const ROWS = 5;
const INNER = 0.45; // inner row radius, as a share of the outer row's
const DOT = 0.052; // circle radius, same units

/** Spreads `total` seats over the rows in proportion to each row's radius
 *  (largest-remainder rounding), so outer rows hold more seats. */
function seatsPerRow(total: number, radii: number[]): number[] {
  const sum = radii.reduce((a, b) => a + b, 0);
  const exact = radii.map((r) => (total * r) / sum);
  const counts = exact.map(Math.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  exact
    .map((x, i) => ({ i, rem: x - Math.floor(x) }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => {
      if (left > 0) {
        counts[i] += 1;
        left -= 1;
      }
    });
  return counts;
}

/** Arch-style parliament diagram: `seats` white circles in concentric
 *  half-rings, with `label` in the middle. The first `filled` seats, counted
 *  from the left edge of the arch, are coloured `fillColor`. */
export default function ParliamentArch({
  seats,
  label,
  filled = 0,
  fillColor
}: {
  seats: number;
  label: string;
  filled?: number;
  fillColor?: string;
}) {
  const dots = useMemo(() => {
    const radii = Array.from({ length: ROWS }, (_, i) => INNER + ((1 - INNER) * i) / (ROWS - 1));
    const counts = seatsPerRow(seats, radii);
    return radii.flatMap((r, row) => {
      const n = counts[row];
      return Array.from({ length: n }, (_, k) => {
        const angle = Math.PI - (Math.PI * k) / (n - 1 || 1);
        return { key: `${row}-${k}`, angle, r, x: r * Math.cos(angle), y: -r * Math.sin(angle) };
      });
    })
      // Left to right across all rows (outer row first where they line up),
      // so filled seats sweep in from the arch's left edge as a wedge.
      .sort((a, b) => b.angle - a.angle || b.r - a.r);
  }, [seats]);

  return (
    <svg className={styles.arch} viewBox="-1.08 -1.08 2.16 1.16" role="img" aria-label={`${filled} of ${seats} seats picked`}>
      {dots.map((d, i) => (
        <circle
          key={d.key}
          className={styles.dot}
          style={i < filled && fillColor ? { fill: fillColor } : undefined}
          cx={d.x}
          cy={d.y}
          r={DOT}
        />
      ))}
      <text className={styles.label} x="0" y="-0.06" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}
