import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  clearMessagesSchema,
  createMessageSchema,
  deleteMessageSchema,
  listMessagesSchema,
  messageStatisticsSchema,
  reactionSchema,
  resendByIdSchema,
  resendByStatusSchema
} from './message.schemas';
import { messageService } from './message.service';

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const aliasTypeMap: Record<string, string> = {
    '/text': 'text',
    '/image': 'image',
    '/document': 'document',
    '/audio': 'audio',
    '/voice': 'voice',
    '/video': 'video',
    '/sticker': 'sticker',
    '/contact': 'contact',
    '/location': 'location',
    '/vcard': 'vcard'
  };

  const body = req.body as Record<string, unknown>;
  const messageType = typeof body.messageType === 'string'
    ? body.messageType
    : aliasTypeMap[req.path] ?? 'text';

  const payload = createMessageSchema.parse({
    ...body,
    messageType
  });
  const item = await messageService.create(req.authUser.id, payload);
  res.status(201).json(item);
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const query = listMessagesSchema.parse(req.query);
  const item = await messageService.list(req.authUser.id, query);
  res.json(item);
});

export const listAllMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const item = await messageService.listAll(req.authUser.id);
  res.json(item);
});

export const getMessageStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const query = messageStatisticsSchema.parse(req.query);
  const item = await messageService.statistics(req.authUser.id, query.instanceId);
  res.json(item);
});

export const clearMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = clearMessagesSchema.parse(req.body);
  const item = await messageService.clear(req.authUser.id, payload.instanceId);
  res.json(item);
});

export const resendMessagesByStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = resendByStatusSchema.parse(req.body);
  const item = await messageService.resendByStatus(req.authUser.id, payload.instanceId, payload.status);
  res.json(item);
});

export const resendMessageById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = resendByIdSchema.parse(req.body);
  const item = await messageService.resendById(req.authUser.id, payload.instanceId, payload.messageId);
  res.json(item);
});

export const sendReaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = reactionSchema.parse(req.body);
  const item = await messageService.react(req.authUser.id, payload);
  res.json(item);
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = deleteMessageSchema.parse(req.body);
  const item = await messageService.delete(req.authUser.id, payload);
  res.json(item);
});
