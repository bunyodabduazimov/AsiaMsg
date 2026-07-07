import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: token ? { token } : undefined
    });
  }

  if (token) {
    socket.auth = { token };
  }

  return socket;
};
