import { Router } from 'express';
import { dashboardRouter } from '../dashboard';
import { authRouter } from '../auth';
import { instanceRouter } from '../instances';
import { messageRouter } from '../messages';
import { chatsRouter } from '../chats';
import { contactsRouter } from '../contacts';
import { groupsRouter } from '../groups';
import { mediaRouter } from '../media';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/instances', instanceRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/chats', chatsRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/groups', groupsRouter);
apiRouter.use('/media', mediaRouter);
