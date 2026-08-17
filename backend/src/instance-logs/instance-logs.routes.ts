import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listInstanceLogs } from './instance-logs.controller';

export const instanceLogsRouter = Router();

instanceLogsRouter.use(authenticate);
instanceLogsRouter.get('/', listInstanceLogs);
