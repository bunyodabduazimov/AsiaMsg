import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../middleware/error-handler';
import { chatsService } from './chats.service';

const getInstanceId = (req: Request) => {
  const instanceId =
    (typeof req.body?.instanceId === 'string' ? req.body.instanceId : undefined) ??
    (typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined);

  if (!instanceId) {
    throw new AppError('instanceId is required', 400);
  }

  return instanceId;
};

const getChatId = (req: Request) => {
  const chatId = String(req.params.chatId ?? '').trim();
  if (!chatId) {
    throw new AppError('chatId is required', 400);
  }
  return chatId;
};

export const listChats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.list(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const listChatIds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.ids(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const listChatMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.messages(req.authUser.id, getInstanceId(req), getChatId(req));
  res.json(result);
});

export const archiveChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.archive(req.authUser.id, {
    instanceId: getInstanceId(req),
    chatId: getChatId(req)
  });
  res.json(result);
});

export const unarchiveChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.unarchive(req.authUser.id, {
    instanceId: getInstanceId(req),
    chatId: getChatId(req)
  });
  res.json(result);
});

export const clearChatMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.clearMessages(req.authUser.id, {
    instanceId: getInstanceId(req),
    chatId: getChatId(req)
  });
  res.json(result);
});

export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.delete(req.authUser.id, {
    instanceId: getInstanceId(req),
    chatId: getChatId(req)
  });
  res.json(result);
});

export const readChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await chatsService.read(req.authUser.id, {
    instanceId: getInstanceId(req),
    chatId: getChatId(req)
  });
  res.json(result);
});
