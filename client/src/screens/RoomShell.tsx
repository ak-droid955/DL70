import type { ReactNode } from 'react';
import { ArchFrieze, PageHeader } from '../components/Brand';
import { useGame } from '../state/GameProvider';
import styles from './RoomShell.module.css';

/** Page chrome shared by the join-room, setup and waiting-room views:
 *  fixed backdrop, header with a back link, and the arch frieze. */
export default function RoomShell({
  variant,
  showBack = true,
  children
}: {
  variant: 'stage' | 'join';
  showBack?: boolean;
  children: ReactNode;
}) {
  const { goHome } = useGame();
  return (
    <div className={styles.shell}>
      <div className={`${styles.backdrop} ${variant === 'stage' ? styles.backdropStage : styles.backdropJoin}`} />
      <PageHeader onBack={showBack ? goHome : undefined} />
      <ArchFrieze />
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export const shellStyles = styles;
