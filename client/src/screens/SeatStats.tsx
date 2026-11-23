import { ELECTION_YEARS, HISTORY } from '../lib/electionHistory';
import styles from './SeatStats.module.css';

// Slice/legend colours for the parties that have won Delhi seats; anything
// else (independents, small parties) shares a neutral grey.
const PARTY_COLORS: Record<string, string> = {
  BJP: '#f47c20',
  AAP: '#0f5fa8',
  INC: '#1a9ad6'
};
const OTHER_COLOR = '#9a948c';
const colorOf = (party: string) => PARTY_COLORS[party] ?? OTHER_COLOR;

/** One pie slice as an SVG path, angles in turns (0 = top, clockwise). */
function slicePath(start: number, end: number): string {
  const r = 1;
  const a0 = 2 * Math.PI * start - Math.PI / 2;
  const a1 = 2 * Math.PI * end - Math.PI / 2;
  const large = end - start > 0.5 ? 1 : 0;
  return `M0,0 L${r * Math.cos(a0)},${r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${r * Math.cos(a1)},${r * Math.sin(a1)} Z`;
}

/** A constituency's past results: winner and party for each election held on
 *  the current boundaries, and a pie chart of wins by party. */
export default function SeatStats({ acNo }: { acNo: string }) {
  const rows = HISTORY[acNo] ?? [];
  if (rows.length === 0) return <p className={styles.empty}>No past results for this seat.</p>;

  const wins = new Map<string, number>();
  rows.forEach((r) => wins.set(r.party, (wins.get(r.party) ?? 0) + 1));
  const tally = [...wins.entries()].sort((a, b) => b[1] - a[1]);
  let acc = 0;
  const slices = tally.map(([party, n]) => {
    const start = acc / rows.length;
    acc += n;
    return { party, n, start, end: acc / rows.length };
  });

  return (
    <div className={styles.stats}>
      <table className={styles.table}>
        <caption className={styles.caption}>Previous winners</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <th scope="row">{r.year}</th>
              <td>{r.winner}</td>
              <td>
                <span className={styles.party} style={{ background: colorOf(r.party) }}>
                  {r.party}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <figure className={styles.pieWrap}>
        <svg className={styles.pie} viewBox="-1.05 -1.05 2.1 2.1" aria-hidden="true">
          {slices.length === 1 ? (
            <circle r="1" fill={colorOf(slices[0].party)} />
          ) : (
            slices.map((s) => <path key={s.party} d={slicePath(s.start, s.end)} fill={colorOf(s.party)} />)
          )}
        </svg>
        <figcaption className={styles.legend}>
          <span className={styles.legendTitle}>
            Wins, {ELECTION_YEARS[0]}–{ELECTION_YEARS[ELECTION_YEARS.length - 1]}
          </span>
          {slices.map((s) => (
            <span key={s.party} className={styles.legendRow}>
              <span className={styles.swatch} style={{ background: colorOf(s.party) }} />
              {s.party} · {s.n}
            </span>
          ))}
        </figcaption>
      </figure>
    </div>
  );
}
