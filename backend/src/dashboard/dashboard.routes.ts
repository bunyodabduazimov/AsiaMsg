import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboard } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/', getDashboard);
