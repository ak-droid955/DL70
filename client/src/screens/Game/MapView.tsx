import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { VOTE_BANK_PRIMARY_MIN, VOTE_BANK_STRONG_MIN } from '../../lib/types';
import type { Room, StaticSeat, VoteBankId } from '../../lib/types';
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

// With a Vote Bank open in the panel, the map becomes a map of that bank: the
// seats where it is primary read strongest, its secondary seats sit a step
// back, and everywhere it only carries a baseline is dimmed out — the seat's
// own ownership colours are kept, just re-weighted.
function styleForSeat(
  room: Room,
  acNo: string,
  voteBankId: VoteBankId | null,
  staticSeat: StaticSeat | undefined
): L.PathOptions {
  const base = baseStyleForSeat(room, acNo);
  if (!voteBankId) return base;
  const strength = staticSeat?.voteBankStrength?.[voteBankId] ?? 0;
  const fillOpacity = base.fillOpacity ?? 0.5;
  if (strength >= VOTE_BANK_PRIMARY_MIN) {
    return { ...base, color: 'oklch(30% 0.02 80)', weight: 2, fillOpacity: Math.min(1, fillOpacity + 0.45) };
  }
  if (strength >= VOTE_BANK_STRONG_MIN) {
    return { ...base, color: '#8f8a80', weight: 1.25, fillOpacity: Math.min(1, fillOpacity + 0.2) };
  }
  return { ...base, color: '#cdc8be', weight: 0.75, fillOpacity: fillOpacity * 0.3 };
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
      layer.on('mouseover', (e) => (e.target as L.Path).setStyle({ weight: 2.5 }));
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
    Object.entries(layersRef.current).forEach(([acNo, layer]) =>
      layer.setStyle(styleForSeat(state.room!, acNo, state.selectedVoteBankId, state.staticSeats?.[acNo]))
    );
  }, [state.room, state.selectedVoteBankId, state.staticSeats]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
