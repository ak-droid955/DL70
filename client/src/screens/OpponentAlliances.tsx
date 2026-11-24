import { useState } from 'react';
import styles from './OpponentAlliances.module.css';

export type AllianceParty = {
  id: string;
  short: string;
  name: string;
  symbol?: string | null;
  symbolLabel?: string;
};

/** Alliances among your opponents: each is two or more of `parties`, and a
 *  party can be in only one. "Add alliance" opens tick boxes for the parties
 *  not yet in one; each alliance can be removed again. */
export default function OpponentAlliances({
  parties,
  alliances,
  onChange,
  hint
}: {
  parties: AllianceParty[];
  alliances: string[][];
  onChange: (next: string[][]) => void;
  /** Shown instead of the controls, e.g. while no opponents are picked. */
  hint?: string;
}) {
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const byId = new Map(parties.map((p) => [p.id, p]));
  const allied = new Set(alliances.flat());
  const free = parties.filter((p) => !allied.has(p.id));

  const toggle = (id: string) =>
    setDraft((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const create = () => {
    if (!draft || draft.size < 2) return;
    onChange([...alliances, parties.filter((p) => draft.has(p.id)).map((p) => p.id)]);
    setDraft(null);
  };

  return (
    <div className={styles.box}>
      <h2 className={styles.title}>Opponent Alliances</h2>
      {hint ? (
        <p className={styles.hint}>{hint}</p>
      ) : (
        <>
          {alliances.length === 0 && !draft && <p className={styles.hint}>No alliances yet: every opponent stands alone.</p>}
          {alliances.map((group, i) => (
            <div key={group.join('+')} className={styles.alliance}>
              <span className={styles.allianceLabel}>Alliance {i + 1}</span>
              <span className={styles.members}>
                {group.map((id, k) => {
                  const p = byId.get(id);
                  if (!p) return null;
                  return (
                    <span key={id} className={styles.member} title={p.name}>
                      {k > 0 && <span className={styles.plus}>+</span>}
                      {p.symbol && <img className={styles.symbol} src={p.symbol} alt={`${p.symbolLabel ?? 'Party'} symbol`} />}
                      {p.short}
                    </span>
                  );
                })}
              </span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(alliances.filter((_, j) => j !== i))}
                aria-label={`Remove alliance ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}

          {draft ? (
            <div className={styles.draft}>
              <p className={styles.hint}>Tick two or more parties to ally.</p>
              <div className={styles.grid}>
                {free.map((p) => {
                  const on = draft.has(p.id);
                  return (
                    <label key={p.id} className={`${styles.row} ${on ? styles.rowOn : ''}`} title={p.name}>
                      {p.symbol ? (
                        <img className={styles.symbol} src={p.symbol} alt={`${p.symbolLabel ?? 'Party'} symbol`} />
                      ) : (
                        <span className={styles.symbol} />
                      )}
                      <span className={styles.name}>{p.short}</span>
                      <input
                        type="checkbox"
                        className={styles.tick}
                        checked={on}
                        onChange={() => toggle(p.id)}
                        aria-label={`Add ${p.name} to the alliance`}
                      />
                    </label>
                  );
                })}
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btn} onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnMain}`}
                  disabled={draft.size < 2}
                  onClick={create}
                >
                  Create alliance
                </button>
              </div>
            </div>
          ) : free.length >= 2 ? (
            <button type="button" className={`${styles.btn} ${styles.add}`} onClick={() => setDraft(new Set())}>
              + Add alliance
            </button>
          ) : (
            alliances.length === 0 && <p className={styles.hint}>You need at least two opponents to form an alliance.</p>
          )}
        </>
      )}
    </div>
  );
}
