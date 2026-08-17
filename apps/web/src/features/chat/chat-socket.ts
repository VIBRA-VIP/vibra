import { io, type Socket } from 'socket.io-client';

function resolveWsUrl(): string {
  const raw = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    raw.startsWith('http:')
  ) {
    return window.location.origin;
  }
  if (!raw) {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }
  return raw;
}

let socket: Socket | null = null;
let connectedToken: string | null = null;

export function getChatSocket(): Socket | null {
  return socket;
}

/** Connect once per token; reuse existing socket if already connected. */
export function connectChatSocket(accessToken: string | null | undefined): Socket | null {
  if (!accessToken) {
    disconnectChatSocket();
    return null;
  }
  if (socket && connectedToken === accessToken && socket.connected) {
    return socket;
  }
  if (socket && connectedToken === accessToken) {
    return socket;
  }

  disconnectChatSocket();
  connectedToken = accessToken;
  socket = io(`${resolveWsUrl()}/realtime`, {
    auth: { token: accessToken },
    // Polling first: the HTTPS deploy proxies through Netlify, which cannot
    // forward a WebSocket upgrade. Socket.io upgrades later when possible.
    transports: ['polling', 'websocket'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectedToken = null;
}
