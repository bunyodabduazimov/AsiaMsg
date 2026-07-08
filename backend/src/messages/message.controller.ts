import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { createMessageSchema } from './message.schemas';
import { messageService } from './message.service';

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = createMessageSchema.parse(req.body);
  const item = await messageService.create(req.authUser.id, payload);
  res.status(201).json(item);
});
