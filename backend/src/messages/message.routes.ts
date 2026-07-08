import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { createMessage } from './message.controller';

export const messageRouter = Router();

messageRouter.use(authenticate);
messageRouter.post('/', createMessage);
messageRouter.post('/text', createMessage);
messageRouter.post('/image', createMessage);
messageRouter.post('/document', createMessage);
