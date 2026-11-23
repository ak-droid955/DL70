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

// Full names for the short party labels in the results data.
const PARTY_NAMES: Record<string, string> = {
  BJP: 'Bharatiya Janata Party',
  AAP: 'Aam Aadmi Party',
  INC: 'Indian National Congress',
  BSP: 'Bahujan Samaj Party',
  LJP: 'Lok Janshakti Party',
  'JD(U)': 'Janata Dal (United)',
  SAD: 'Shiromani Akali Dal',
  IND: 'Independent'
};

/** For a run of consecutive rows sharing the same key, returns the run's
 *  length at its first row and 0 at the rest, so the cell can be drawn once
 *  with that rowSpan (as election tables merge repeat winners). */
function runStarting<T>(rows: readonly T[], i: number, key: (r: T) => string): number {
  if (i > 0 && key(rows[i - 1]) === key(rows[i])) return 0;
  let n = 1;
  while (i + n < rows.length && key(rows[i + n]) === key(rows[i])) n += 1;
  return n;
}

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
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Name</th>
            <th scope="col" colSpan={2}>
              Party
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const partyRun = runStarting(rows, i, (x) => x.party);
            const nameRun = runStarting(rows, i, (x) => `${x.party}|${x.winner}`);
            return (
              <tr key={r.year}>
                <th scope="row" className={styles.year}>
                  {r.year}
                </th>
                {nameRun > 0 && <td rowSpan={nameRun}>{r.winner}</td>}
                {partyRun > 0 && (
                  <>
                    <td rowSpan={partyRun} className={styles.bar} style={{ background: colorOf(r.party) }} />
                    <td rowSpan={partyRun}>{PARTY_NAMES[r.party] ?? r.party}</td>
                  </>
                )}
              </tr>
            );
          })}
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
