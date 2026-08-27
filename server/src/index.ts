import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { loadStaticSeats } from './gameData.js';
import { roomStore } from './rooms.js';
import { registerSocketHandlers } from './socketHandlers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/seats', (_req, res) => {
  const seats = loadStaticSeats();
  res.json(Object.values(seats));
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Single-service deploy support: if the client's production build sits next to
// this one (../../client/dist), serve it directly so one host/URL covers the
// whole app. In local dev the client runs its own Vite server instead, so
// client/dist won't exist here and this is a no-op.
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  // Vite's JS/CSS filenames are content-hashed, so those are safe to cache
  // hard and long. index.html is not hashed, so it must never be cached —
  // otherwise a browser (or an intermediary proxy/CDN) that cached an old
  // index.html keeps requesting asset filenames a later deploy no longer has,
  // which is exactly what "the page sometimes won't load" looks like right
  // after a redeploy: a 404 on the JS bundle with a blank page behind it.
  app.use(
    express.static(clientDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
        else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    })
  );
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(join(clientDist, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN }
});

// Lets a turn timer that fires off any particular socket still push the updated
// room to everyone in that room's channel.
roomStore.setBroadcaster((room) => io.to(room.code).emit('room:update', room));

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

const ROOM_SWEEP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
setInterval(() => {
  const removed = roomStore.sweepStaleRooms();
  if (removed > 0) console.log(`Swept ${removed} stale room(s)`);
}, ROOM_SWEEP_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`Vidhan Sabha Showdown server listening on :${PORT}`);
});
