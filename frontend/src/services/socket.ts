import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL, {
      autoConnect: false,
      transports: ['websocket']
    });
  }

  return socket;
};

export const connectSocket = (token: string) => {
  const client = getSocket();
  client.auth = { token };
  if (!client.connected) {
    client.connect();
  }
  return client;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
