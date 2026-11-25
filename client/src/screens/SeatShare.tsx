import styles from './SeatShare.module.css';

export type ShareParty = {
  id: string;
  short: string;
  name: string;
  symbol?: string | null;
  symbolLabel?: string;
  color: string;
  seats: number;
};

/** Alliance Mode seat sharing: your party's seats, then a slider for each
 *  alliance partner. A partner can't go below `min` seats, and your party
 *  keeps whatever the partners don't take. */
export default function SeatShare({
  total,
  min,
  minShare,
  you,
  partners,
  onChange
}: {
  total: number;
  min: number;
  minShare: number;
  you: ShareParty;
  partners: ShareParty[];
  onChange: (id: string, seats: number) => void;
}) {
  // Most a partner could ever get: everyone else (your party included) at
  // the minimum. The slider's track spans min..max; values past what's free
  // right now are clamped by the parent.
  const max = total - min * partners.length;
  return (
    <div className={styles.share}>
      <div className={`${styles.row} ${styles.youRow}`}>
        <Party p={you} />
        <span className={styles.youLabel}>Your party</span>
        <span className={styles.count}>{you.seats} seats</span>
      </div>
      {partners.map((p) => (
        <div key={p.id} className={styles.row}>
          <Party p={p} />
          <input
            type="range"
            className={styles.slider}
            min={min}
            max={max}
            step={1}
            value={p.seats}
            onChange={(e) => onChange(p.id, Number(e.target.value))}
            style={{ accentColor: p.color }}
            aria-label={`Seats for ${p.name}`}
          />
          <span className={styles.count}>{p.seats} seats</span>
        </div>
      ))}
      <p className={styles.note}>
        Each alliance partner must get at least {Math.round(minShare * 100)}% of the seats ({min} of {total}).
      </p>
    </div>
  );
}

function Party({ p }: { p: ShareParty }) {
  return (
    <span className={styles.party} title={p.name}>
      <span className={styles.swatch} style={{ background: p.color }} aria-hidden="true" />
      {p.symbol ? (
        <img className={styles.symbol} src={p.symbol} alt={`${p.symbolLabel ?? 'Party'} symbol`} />
      ) : (
        <span className={styles.symbol} aria-hidden="true" />
      )}
      <span className={styles.name}>{p.short}</span>
    </span>
  );
}
