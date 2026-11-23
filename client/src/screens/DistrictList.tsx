import { DISTRICTS } from '../lib/districts';
import type { StaticSeat } from '../lib/types';
import styles from './DistrictList.module.css';

/** Delhi's districts, each a dropdown listing its assembly constituencies.
 *  Names come from the loaded seat data, so they match the map. */
export default function DistrictList({ seats }: { seats: StaticSeat[] }) {
  const byAcNo = new Map(seats.map((s) => [s.acNo, s]));
  return (
    <div className={styles.list}>
      {DISTRICTS.map((d) => {
        const members = d.acNos.map((n) => byAcNo.get(n)).filter((s): s is StaticSeat => Boolean(s));
        return (
          <details key={d.name} className={styles.district}>
            <summary className={styles.summary}>
              <span>{d.name}</span>
              <span className={styles.count}>{members.length}</span>
            </summary>
            <ul className={styles.seats}>
              {members.map((s) => (
                <li key={s.acNo}>{s.name}</li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
