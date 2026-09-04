import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { VOTE_BANK_PRIMARY_MIN, VOTE_BANK_STRONG_MIN } from '../../lib/types';
import type { Room, StaticSeat, VoteBankId } from '../../lib/types';
import { voteBankArt } from '../../lib/voteBankArt';
import { useGame } from '../../state/GameProvider';
import styles from './MapView.module.css';

function baseStyleForSeat(room: Room, acNo: string): L.PathOptions {
  const seat = room.seats[acNo];
  if (!seat) return { color: '#999', weight: 1, fillColor: 'oklch(93% 0.005 80)', fillOpacity: 0.7 };
  if (seat.locked === 'INDEPENDENT') return { color: '#999', weight: 1, fillColor: '#cfcfcf', fillOpacity: 0.6 };
  if (seat.locked) {
    const p = room.players[seat.locked];
    return { color: 'white', weight: 1.5, fillColor: p ? p.color : '#999', fillOpacity: 0.9 };
  }
  const entries = Object.entries(seat.progress || {});
  if (!entries.length) return { color: '#b8b3a8', weight: 1, fillColor: '#ffffff', fillOpacity: 0.4 };
  entries.sort((a, b) => b[1] - a[1]);
  const leader = room.players[entries[0][0]];
  return { color: '#b8b3a8', weight: 1, fillColor: leader ? leader.color : 'oklch(93% 0.005 80)', fillOpacity: 0.35 };
}

// A seat only carries a player colour once someone has locked it or put
// influence into it; until then its fill is blank and there is nothing for a
// highlight to lean on.
function isClaimed(room: Room, acNo: string): boolean {
  const seat = room.seats[acNo];
  if (!seat) return false;
  return Boolean(seat.locked) || Object.keys(seat.progress || {}).length > 0;
}

// With a Vote Bank open in the panel the map becomes a map of that bank. Its
// primary seats are flooded with the bank's own colour, its secondary seats
// carry a light wash of the same hue, and every other seat is faded almost to
// the paper so the bank's footprint reads at a glance. Seats a player already
// holds keep that player's colour — the bank highlight is carried there by a
// thick accent ring instead, so the map never lies about who holds what.
function styleForSeat(
  room: Room,
  acNo: string,
  voteBankId: VoteBankId | null,
  staticSeat: StaticSeat | undefined
): L.PathOptions {
  const base = baseStyleForSeat(room, acNo);
  if (!voteBankId) return base;
  const accent = voteBankArt(voteBankId).accent;
  const strength = staticSeat?.voteBankStrength?.[voteBankId] ?? 0;
  const claimed = isClaimed(room, acNo);

  if (strength >= VOTE_BANK_PRIMARY_MIN) {
    return claimed
      ? { ...base, color: accent, weight: 3.5, opacity: 1, fillOpacity: 1 }
      : { ...base, color: 'white', weight: 1.5, opacity: 1, fillColor: accent, fillOpacity: 0.92 };
  }
  if (strength >= VOTE_BANK_STRONG_MIN) {
    return claimed
      ? { ...base, color: accent, weight: 2, opacity: 0.9, fillOpacity: Math.min(1, (base.fillOpacity ?? 0.5) + 0.2) }
      : { ...base, color: accent, weight: 1, opacity: 0.5, fillColor: accent, fillOpacity: 0.32 };
  }
  // Out of the bank's reach: pushed back to a faint outline on near-paper so it
  // never competes with the highlighted seats.
  return { ...base, color: '#ded9cf', weight: 0.75, opacity: 1, fillColor: '#faf8f4', fillOpacity: 1 };
}

export default function MapView() {
  const { state, selectSeat } = useGame();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.GeoJSON>>({});
  const roomRef = useRef(state.room);
  roomRef.current = state.room;
  const voteBankRef = useRef(state.selectedVoteBankId);
  voteBankRef.current = state.selectedVoteBankId;
  const staticSeatsRef = useRef(state.staticSeats);
  staticSeatsRef.current = state.staticSeats;

  // Init the Leaflet map once static seat geometry is available; each constituency
  // polygon is click-selectable and hover-highlighted, colored by current leader/owner.
  useEffect(() => {
    if (!containerRef.current || !state.staticSeats || mapRef.current) return;
    // Static view: the whole of Delhi is always framed to fit the container, and
    // every zoom/pan interaction is off — the map is a fixed board, not a viewer.
    const map = L.map(containerRef.current, {
      attributionControl: false,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomSnap: 0,
      zoomDelta: 0
    }).setView([28.65, 77.12], 10);
    mapRef.current = map;
    const bounds: L.LatLngBounds[] = [];

    Object.values(state.staticSeats).forEach((seat) => {
      const feature = { type: 'Feature', geometry: seat.geometry, properties: {} } as GeoJSON.Feature;
      const layer = L.geoJSON(feature, {
        style: () =>
          roomRef.current
            ? styleForSeat(roomRef.current, seat.acNo, voteBankRef.current, staticSeatsRef.current?.[seat.acNo])
            : {}
      }).addTo(map);
      layer.on('click', () => selectSeat(seat.acNo));
      // Hover always thickens rather than thins, so hovering a primary seat of the
      // open Vote Bank never shrinks its highlight outline.
      layer.on('mouseover', (e) => (e.target as L.Path).setStyle({ weight: 3.5 }));
      layer.on('mouseout', () => {
        const l = layersRef.current[seat.acNo];
        if (l && roomRef.current) {
          l.setStyle(styleForSeat(roomRef.current, seat.acNo, voteBankRef.current, staticSeatsRef.current?.[seat.acNo]));
        }
      });
      layersRef.current[seat.acNo] = layer;
      try {
        bounds.push(layer.getBounds());
      } catch {
        /* invalid geometry, skip from bounds fit */
      }
    });

    let resizeObserver: ResizeObserver | undefined;
    if (bounds.length) {
      let b = bounds[0];
      bounds.forEach((x) => (b = b.extend(x)));
      const fit = () => {
        map.invalidateSize({ animate: false });
        map.fitBounds(b, { padding: [10, 10], animate: false });
      };
      fit();
      // Keep the whole map framed when the container resizes, since the user
      // can no longer zoom or pan to bring it back into view.
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.staticSeats]);

  // Re-sync polygon fills whenever the authoritative room state changes, or the
  // player opens a different Vote Bank in the panel.
  useEffect(() => {
    if (!state.room) return;
    Object.entries(layersRef.current).forEach(([acNo, layer]) => {
      layer.setStyle(styleForSeat(state.room!, acNo, state.selectedVoteBankId, state.staticSeats?.[acNo]));
      // Highlighted seats are lifted above their neighbours so a bordering
      // faded seat can never paint over their outline.
      const strength = state.selectedVoteBankId
        ? state.staticSeats?.[acNo]?.voteBankStrength?.[state.selectedVoteBankId] ?? 0
        : 0;
      if (strength >= VOTE_BANK_STRONG_MIN) layer.bringToFront();
      else layer.bringToBack();
    });
  }, [state.room, state.selectedVoteBankId, state.staticSeats]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
