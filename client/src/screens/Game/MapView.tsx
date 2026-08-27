import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Room } from '../../lib/types';
import { useGame } from '../../state/GameProvider';
import styles from './MapView.module.css';

function styleForSeat(room: Room, acNo: string): L.PathOptions {
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

export default function MapView() {
  const { state, selectSeat } = useGame();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.GeoJSON>>({});
  const roomRef = useRef(state.room);
  roomRef.current = state.room;

  // Init the Leaflet map once static seat geometry is available; each constituency
  // polygon is click-selectable and hover-highlighted, colored by current leader/owner.
  useEffect(() => {
    if (!containerRef.current || !state.staticSeats || mapRef.current) return;
    const map = L.map(containerRef.current, { attributionControl: false, zoomControl: true }).setView([28.65, 77.12], 10);
    mapRef.current = map;
    const bounds: L.LatLngBounds[] = [];

    Object.values(state.staticSeats).forEach((seat) => {
      const feature = { type: 'Feature', geometry: seat.geometry, properties: {} } as GeoJSON.Feature;
      const layer = L.geoJSON(feature, {
        style: () => (roomRef.current ? styleForSeat(roomRef.current, seat.acNo) : {})
      }).addTo(map);
      layer.on('click', () => selectSeat(seat.acNo));
      layer.on('mouseover', (e) => (e.target as L.Path).setStyle({ weight: 2.5 }));
      layer.on('mouseout', () => {
        const l = layersRef.current[seat.acNo];
        if (l && roomRef.current) l.setStyle(styleForSeat(roomRef.current, seat.acNo));
      });
      layersRef.current[seat.acNo] = layer;
      try {
        bounds.push(layer.getBounds());
      } catch {
        /* invalid geometry, skip from bounds fit */
      }
    });

    if (bounds.length) {
      let b = bounds[0];
      bounds.forEach((x) => (b = b.extend(x)));
      map.fitBounds(b, { padding: [10, 10] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.staticSeats]);

  // Re-sync polygon fills whenever the authoritative room state changes.
  useEffect(() => {
    if (!state.room) return;
    Object.entries(layersRef.current).forEach(([acNo, layer]) => layer.setStyle(styleForSeat(state.room!, acNo)));
  }, [state.room]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
