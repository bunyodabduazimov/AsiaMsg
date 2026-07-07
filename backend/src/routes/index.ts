import { Router } from 'express';
import { authRouter } from '../auth';
import { instanceRouter } from '../instances';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/instances', instanceRouter);
