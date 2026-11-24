import styles from './SeatStats.module.css';

export type ContestParty = {
  id: string;
  short: string;
  name: string;
  symbol?: string | null;
  symbolLabel?: string;
  color: string;
};

export type ContestRow = {
  party: ContestParty;
  /** Shown with a tick box when set: whether this party contests the seat. */
  ticked?: boolean;
  /** Tick box can't be changed (e.g. the party is at its seat minimum). */
  locked?: boolean;
  onTick?: () => void;
};

/** One seat's contest, in the past-results table's style: the seat's name,
 *  then groups of parties, each with a colour bar, symbol and initials, and
 *  (for your side) a tick box to choose who contests it. */
export default function SeatContest({
  seat,
  groups,
  note
}: {
  seat: string;
  groups: { label: string; rows: ContestRow[] }[];
  note?: string;
}) {
  return (
    <div className={styles.stats}>
      <table className={`${styles.table} ${styles.contestTable}`}>
        <caption className={styles.seatCaption}>{seat}</caption>
        {groups
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <tbody key={g.label}>
              <tr>
                <th scope="colgroup" colSpan={3} className={styles.groupHead}>
                  {g.label}
                </th>
              </tr>
              {g.rows.map(({ party: p, ticked, locked, onTick }) => (
                <tr key={p.id} className={onTick && !ticked ? styles.rowOff : undefined}>
                  <td className={styles.bar} style={{ background: p.color }} />
                  <td className={styles.partyTd} title={p.name}>
                    <span className={styles.partyCell}>
                      {p.symbol && (
                        <img className={styles.symbol} src={p.symbol} alt={`${p.symbolLabel ?? 'Party'} symbol`} />
                      )}
                      {p.short}
                    </span>
                  </td>
                  <td className={styles.tickTd}>
                    {onTick && (
                      <input
                        type="checkbox"
                        className={styles.tick}
                        checked={!!ticked}
                        disabled={locked && !ticked}
                        onChange={onTick}
                        aria-label={`${p.name} contests ${seat}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
      </table>
      {note && <p className={styles.empty}>{note}</p>}
    </div>
  );
}
