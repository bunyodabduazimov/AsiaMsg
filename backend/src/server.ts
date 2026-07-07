import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { instanceService } from './instances';
import { createSocketServer } from './socket';
import { setSocketServer } from './socket/socket-manager';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

const io = createSocketServer(server);
setSocketServer(io);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'AsiaMsg backend is running');
});

void instanceService.restoreSessions();
