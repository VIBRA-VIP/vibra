import { io, type Socket } from 'socket.io-client';

function resolveWsUrl(): string {
  const raw = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && raw.startsWith('http:')) {
    return window.location.origin;
  }
  if (!raw) {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }
  return raw;
}

let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  return socket;
}

export function connectChatSocket(accessToken: string | null | undefined): Socket | null {
  disconnectChatSocket();
  if (!accessToken) return null;

  socket = io(`${resolveWsUrl()}/realtime`, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
