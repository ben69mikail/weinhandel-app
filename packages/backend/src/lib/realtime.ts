// Socket.io-Halter.
// Auf Netlify Functions (Serverless) gibt es keine dauerhaften Verbindungen —
// dort bleibt der No-Op aktiv. Beim lokalen Server wird die echte Instanz gesetzt.

type Emitter = { emit: (event: string, payload?: unknown) => void };

const noop: Emitter = { emit: () => {} };

let instance: Emitter = noop;

export function setRealtime(server: Emitter) {
  instance = server;
}

export const io: Emitter = {
  emit: (event, payload) => instance.emit(event, payload),
};
