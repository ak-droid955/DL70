// Where the Socket.IO/REST server lives. In dev, the client (Vite on :5173) and
// server (:8787) run separately, so default to localhost:8787. In a production
// build with no VITE_SERVER_URL set, assume the server is serving this very
// page (the single-service deploy: Express serves client/dist itself), so
// talk to the same origin the page was loaded from.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:8787' : window.location.origin);
