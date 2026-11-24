import styles from './SeatStats.module.css';

export type ContestParty = {
  id: string;
  short: string;
  name: string;
  symbol?: string | null;
  symbolLabel?: string;
  color: string;
};

/** The parties contesting one seat, in the past-results table's style:
 *  a colour bar, the party's symbol and initials, and its full name. */
export default function SeatContest({ seat, parties }: { seat: string; parties: ContestParty[] }) {
  return (
    <div className={styles.stats}>
      <table className={styles.table}>
        <caption className={styles.caption}>{seat}: contesting</caption>
        <thead>
          <tr>
            <th scope="col" colSpan={2}>
              Party
            </th>
            <th scope="col">Name</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => (
            <tr key={p.id}>
              <td className={styles.bar} style={{ background: p.color }} />
              <td className={styles.partyTd}>
                <span className={styles.partyCell}>
                  {p.symbol && (
                    <img className={styles.symbol} src={p.symbol} alt={`${p.symbolLabel ?? 'Party'} symbol`} />
                  )}
                  {p.short}
                </span>
              </td>
              <td>{p.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
