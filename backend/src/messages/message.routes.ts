import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
	clearMessages,
	createMessage,
	deleteMessage,
	getMessageStatistics,
	listMessages,
	resendMessageById,
	resendMessagesByStatus,
	sendReaction
} from './message.controller';

export const messageRouter = Router();

messageRouter.use(authenticate);
messageRouter.get('/', listMessages);
messageRouter.get('/statistics', getMessageStatistics);
messageRouter.post('/', createMessage);
messageRouter.post('/text', createMessage);
messageRouter.post('/image', createMessage);
messageRouter.post('/document', createMessage);
messageRouter.post('/audio', createMessage);
messageRouter.post('/voice', createMessage);
messageRouter.post('/video', createMessage);
messageRouter.post('/sticker', createMessage);
messageRouter.post('/contact', createMessage);
messageRouter.post('/location', createMessage);
messageRouter.post('/vcard', createMessage);
messageRouter.post('/delete', deleteMessage);
messageRouter.post('/reaction', sendReaction);
messageRouter.post('/resend-by-status', resendMessagesByStatus);
messageRouter.post('/resend-by-id', resendMessageById);
messageRouter.post('/clear', clearMessages);
