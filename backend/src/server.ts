import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { createSocketServer } from './socket';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);

createSocketServer(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'AsiaMsg backend is running');
});
