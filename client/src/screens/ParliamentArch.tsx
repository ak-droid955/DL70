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
 *  half-rings, with `label` in the middle. Purely decorative for now. */
export default function ParliamentArch({ seats, label }: { seats: number; label: string }) {
  const dots = useMemo(() => {
    const radii = Array.from({ length: ROWS }, (_, i) => INNER + ((1 - INNER) * i) / (ROWS - 1));
    const counts = seatsPerRow(seats, radii);
    return radii.flatMap((r, row) => {
      const n = counts[row];
      return Array.from({ length: n }, (_, k) => {
        const angle = Math.PI - (Math.PI * k) / (n - 1 || 1);
        return { key: `${row}-${k}`, x: r * Math.cos(angle), y: -r * Math.sin(angle) };
      });
    });
  }, [seats]);

  return (
    <svg className={styles.arch} viewBox="-1.08 -1.08 2.16 1.16" role="img" aria-label={`${label}, arch of ${seats} seats`}>
      {dots.map((d) => (
        <circle key={d.key} className={styles.dot} cx={d.x} cy={d.y} r={DOT} />
      ))}
      <text className={styles.label} x="0" y="-0.02" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}
