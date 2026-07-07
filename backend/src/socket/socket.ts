import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

  io.on('connection', socket => {
    const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.join(`user:${payload.sub}`);
      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };
    } catch {
      socket.disconnect(true);
      return;
    }

    socket.emit('socket:ready', {
      connectedAt: new Date().toISOString()
    });
  });

  return io;
};
