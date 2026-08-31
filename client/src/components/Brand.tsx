import styles from './Brand.module.css';

const FRIEZE_BARS = 14;

/** Decorative striped band that sits under the header on every page.
 *  `arched` is the landing-page variant with the rounded bottoms. */
export function ArchFrieze({ arched = false }: { arched?: boolean }) {
  const colors = arched ? ['var(--saffron)', 'var(--paper)'] : ['var(--saffron)', 'var(--ink)'];
  return (
    <div className={`${styles.frieze} ${arched ? styles.friezeArched : ''}`} aria-hidden="true">
      {Array.from({ length: FRIEZE_BARS }, (_, i) => (
        <div key={i} className={styles.friezeBar} style={{ background: colors[i % 2] }} />
      ))}
    </div>
  );
}

/** DL-70 lockup. The design's logo PNGs aren't part of this repo, so the
 *  wordmark is drawn in CSS at the same sizes/placement. */
export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={styles.wordmark}>
      <span className={`${styles.mark} ${size === 'sm' ? styles.markSm : styles.markMd}`}>70</span>
      <span className={styles.wordmarkText}>
        <span className={styles.wordmarkName}>DL-70</span>
        <span className={styles.wordmarkTag}>Vidhan Sabha Showdown</span>
      </span>
    </span>
  );
}

/** Header for the create-room / join-room pages. Omit `onBack` in the lobby,
 *  where the player is already in a room and leaving isn't a client-side
 *  action. */
export function PageHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className={styles.header}>
      {onBack ? (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <span className={styles.backArrow}>←</span> Back to DL-70
        </button>
      ) : (
        <span />
      )}
      <Wordmark />
    </div>
  );
}
