import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { loadStaticSeats } from './gameData.js';
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
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN }
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Vidhan Sabha Showdown server listening on :${PORT}`);
});
