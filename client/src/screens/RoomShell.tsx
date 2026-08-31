import type { CSSProperties, ReactNode } from 'react';
import bgRallyStage from '../assets/bg-rally-stage.jpg';
import bgRallyTruck from '../assets/bg-rally-truck-join.jpg';
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
  const photo = variant === 'stage' ? bgRallyStage : bgRallyTruck;
  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} style={{ '--shell-photo': `url(${photo})` } as CSSProperties} />
      <PageHeader onBack={showBack ? goHome : undefined} />
      <ArchFrieze />
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export const shellStyles = styles;
