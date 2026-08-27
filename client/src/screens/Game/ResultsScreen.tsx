import { useGame } from '../../state/GameProvider';
import styles from './ResultsScreen.module.css';

export default function ResultsScreen() {
  const { state, playAgain } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);

  const finalStandings = players
    .slice()
    .sort((a, b) => b.seatsWon - a.seatsWon)
    .map((p) => ({
      partyName: p.partyName,
      color: p.color,
      seatsWon: p.seatsWon,
      pct: Math.max(4, Math.round((p.seatsWon / 70) * 100))
    }));

  const top = finalStandings[0];
  let resultBannerText = '';
  let resultBannerBg = 'var(--navy)';
  if (top && top.seatsWon >= 36) {
    resultBannerText = `${top.partyName} wins a majority — forms the government`;
    resultBannerBg = top.color;
  } else if (top) {
    resultBannerText = `${top.partyName} leads with ${top.seatsWon} seats — coalition needed for government`;
    resultBannerBg = top.color;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.heading}>Final Result — 70 Seats</div>
      <div className={styles.banner} style={{ background: resultBannerBg }}>
        {resultBannerText}
      </div>
      <div className={styles.standings}>
        {finalStandings.map((f) => (
          <div className={styles.standingRow} key={f.partyName}>
            <div className={styles.standingName}>{f.partyName}</div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ background: f.color, width: `${f.pct}%` }}>
                <span className={styles.barValue}>{f.seatsWon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className={styles.newGameBtn} onClick={playAgain}>
        New Game
      </button>
    </div>
  );
}
