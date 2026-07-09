import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  archiveChat,
  clearChatMessages,
  deleteChat,
  listChatIds,
  listChatMessages,
  listChats,
  readChat,
  unarchiveChat
} from './chats.controller';

export const chatsRouter = Router();

chatsRouter.use(authenticate);
chatsRouter.get('/', listChats);
chatsRouter.get('/ids', listChatIds);
chatsRouter.get('/:chatId/messages', listChatMessages);
chatsRouter.post('/:chatId/archive', archiveChat);
chatsRouter.post('/:chatId/unarchive', unarchiveChat);
chatsRouter.post('/:chatId/clear-messages', clearChatMessages);
chatsRouter.post('/:chatId/delete', deleteChat);
chatsRouter.post('/:chatId/read', readChat);
