import { DISTRICTS } from '../lib/districts';
import type { StaticSeat } from '../lib/types';
import styles from './DistrictList.module.css';

/** Delhi's districts, each a dropdown listing its assembly constituencies as
 *  tickable boxes. Names come from the loaded seat data, so they match the
 *  map; which seats are ticked is held by the parent. */
export default function DistrictList({
  seats,
  ticked,
  onToggle
}: {
  seats: StaticSeat[];
  ticked: ReadonlySet<string>;
  onToggle: (acNo: string) => void;
}) {
  const byAcNo = new Map(seats.map((s) => [s.acNo, s]));
  return (
    <div className={styles.list}>
      {DISTRICTS.map((d) => {
        const members = d.acNos.map((n) => byAcNo.get(n)).filter((s): s is StaticSeat => Boolean(s));
        const tickedHere = members.filter((s) => ticked.has(s.acNo)).length;
        return (
          <details key={d.name} className={styles.district}>
            <summary className={styles.summary}>
              <span>{d.name}</span>
              <span className={styles.count}>
                {tickedHere > 0 ? `${tickedHere}/${members.length}` : members.length}
              </span>
            </summary>
            <div className={styles.seats}>
              {members.map((s) => {
                const on = ticked.has(s.acNo);
                return (
                  <label key={s.acNo} className={`${styles.seat} ${on ? styles.seatOn : ''}`}>
                    <input
                      type="checkbox"
                      className={styles.tick}
                      checked={on}
                      onChange={() => onToggle(s.acNo)}
                    />
                    <span>{s.name}</span>
                  </label>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
