import { Router } from 'express';
import { dashboardRouter } from '../dashboard';
import { authRouter } from '../auth';
import { instanceRouter } from '../instances';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/instances', instanceRouter);
