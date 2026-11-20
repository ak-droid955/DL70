import type { CSSProperties, ReactNode } from 'react';
import { ArchFrieze, PageHeader } from '../components/Brand';
import { rallyStageBg, rallyTruckBg } from '../lib/backgrounds';
import { useGame } from '../state/GameProvider';
import styles from './RoomShell.module.css';

/** Page chrome shared by the join-room, setup and waiting-room views: fixed
 *  backdrop, header with a back link (or, in the lobby, an exit link), and the
 *  arch frieze. */
export default function RoomShell({
  variant,
  showBack = true,
  onExit,
  children
}: {
  variant: 'stage' | 'join';
  showBack?: boolean;
  onExit?: () => void;
  children: ReactNode;
}) {
  const { goHome } = useGame();
  const photo = variant === 'stage' ? rallyStageBg : rallyTruckBg;
  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} style={{ '--shell-photo': `url(${photo})` } as CSSProperties} />
      <PageHeader onBack={showBack ? goHome : undefined} onExit={onExit} />
      <ArchFrieze />
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export const shellStyles = styles;
