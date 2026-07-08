import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';
import { logger } from './utils/logger';

export const createApp = () => {
  const app = express();
  const allowedOrigins = new Set([
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);

  app.use(
    pinoHttp({
      logger
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/', (_req, res) => {
    res.json({ name: 'AsiaMsg API', version: '0.1.0' });
  });

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
