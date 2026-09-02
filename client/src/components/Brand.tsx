import logoCombined from '../assets/dl70-logo-combined.png';
import logoSmall from '../assets/dl70-logo-small.png';
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

/** The DL-70 logo lockup used in the page headers. `lg` is the landing
 *  page's size, `md` the one on the create/join room headers. */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <img
      src={logoCombined}
      alt="DL-70"
      className={`${styles.logo} ${size === 'lg' ? styles.logoLg : styles.logoMd}`}
    />
  );
}

/** Footer mark: the icon-only logo beside the wordmark. */
export function FooterMark() {
  return (
    <span className={styles.footerMark}>
      <img src={logoSmall} alt="" className={styles.footerMarkIcon} />
      <span className={styles.footerMarkText}>DL-70</span>
    </span>
  );
}

/** Header for the create-room / join-room / lobby pages. The left slot holds
 *  `onBack` on the way into a room and `onExit` once the player is in one;
 *  pass neither and it stays empty, keeping the logo hard right. */
export function PageHeader({ onBack, onExit }: { onBack?: () => void; onExit?: () => void }) {
  return (
    <div className={styles.header}>
      {onBack ? (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <span className={styles.backArrow}>←</span> Back to DL-70
        </button>
      ) : onExit ? (
        <button type="button" className={styles.exitLink} onClick={onExit}>
          <span className={styles.backArrow}>←</span> Exit Match
        </button>
      ) : (
        <span />
      )}
      <Logo />
    </div>
  );
}
