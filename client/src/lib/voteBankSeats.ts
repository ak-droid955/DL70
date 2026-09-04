// Client-side view of the server's Vote Bank conquest rule (see
// seatsInVoteBank / the conquest block in supabase/functions/_shared/gameData.ts).
// A Vote Bank's constituencies are the seats it is strong in — where it is the
// primary bank or one of the listed secondaries — and the bank falls to
// whoever wins more than VOTE_BANK_CONQUEST_THRESHOLD of them. The panel reads
// this to show how far each campaign is from taking a bank; the server is
// still the only thing that awards the bonus.
import { VOTE_BANK_CONQUEST_THRESHOLD, VOTE_BANK_STRONG_MIN } from './types';
import type { Room, StaticSeat, VoteBankId } from './types';

export interface VoteBankStanding {
  /** Constituencies this Vote Bank is strong in. */
  total: number;
  /** Seats needed to conquer: the smallest count above the threshold share. */
  needed: number;
  /** Seats of this bank won so far, per player id. */
  heldByPlayer: Record<string, number>;
  /** Seats of this bank the viewing player has won. */
  mine: number;
}

export function voteBankStanding(
  room: Room,
  staticSeats: Record<string, StaticSeat> | null,
  id: VoteBankId,
  myPlayerId: string | null
): VoteBankStanding {
  const bankSeats = staticSeats
    ? Object.values(staticSeats).filter((s) => (s.voteBankStrength[id] ?? 0) >= VOTE_BANK_STRONG_MIN)
    : [];
  const heldByPlayer: Record<string, number> = {};
  bankSeats.forEach((s) => {
    const owner = room.seats[s.acNo]?.locked;
    if (!owner || !room.players[owner]) return;
    heldByPlayer[owner] = (heldByPlayer[owner] || 0) + 1;
  });
  const total = bankSeats.length;
  return {
    total,
    needed: Math.floor(total * VOTE_BANK_CONQUEST_THRESHOLD) + 1,
    heldByPlayer,
    mine: myPlayerId ? heldByPlayer[myPlayerId] || 0 : 0
  };
}
