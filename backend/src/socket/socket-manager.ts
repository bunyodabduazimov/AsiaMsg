import type { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToInstance = (instanceId: string, event: string, payload: unknown) => {
  io?.to(`instance:${instanceId}`).emit(event, payload);
};
