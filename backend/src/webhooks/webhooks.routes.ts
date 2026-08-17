import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { listWebhooks } from './webhooks.controller';

export const webhooksRouter = Router();

webhooksRouter.use(authenticate);
webhooksRouter.get('/', listWebhooks);
