import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import sadSymbol from '../assets/parties/sad.png';
import bspSymbol from '../assets/parties/bsp.png';
import { ELECTION_YEARS, HISTORY } from '../lib/electionHistory';
import styles from './SeatStats.module.css';

// Slice/legend colours: Wikipedia's party colours (Module:Political party).
// Any party not listed falls back to a neutral grey.
const PARTY_COLORS: Record<string, string> = {
  BJP: '#FF9933',
  AAP: '#0072B0',
  INC: '#00BFFF',
  SAD: '#0F204A',
  'CPI(M)': '#CC0D0D',
  BSP: '#22409A',
  'JD(U)': '#05472A',
  RJD: '#056D05',
  CJP: '#5A2F12',
  LJP: '#0093DD',
  IND: '#DCDCDC'
};
const OTHER_COLOR = '#9a948c';
const colorOf = (party: string) => PARTY_COLORS[party] ?? OTHER_COLOR;

// Election symbols for the parties the game has art for; others show just
// their short name.
const PARTY_SYMBOLS: Record<string, { src: string; alt: string }> = {
  BJP: { src: bjpSymbol, alt: 'Lotus' },
  AAP: { src: aapSymbol, alt: 'Broom' },
  INC: { src: incSymbol, alt: 'Hand' },
  BSP: { src: bspSymbol, alt: 'Elephant' },
  SAD: { src: sadSymbol, alt: 'Scales' }
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
                    <td rowSpan={partyRun} className={styles.partyTd}>
                      <span className={styles.partyCell}>
                        {PARTY_SYMBOLS[r.party] && (
                          <img
                            className={styles.symbol}
                            src={PARTY_SYMBOLS[r.party].src}
                            alt={`${PARTY_SYMBOLS[r.party].alt} symbol`}
                          />
                        )}
                        {r.party}
                      </span>
                    </td>
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
