import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { webhooksService } from './webhooks.service';

export const listWebhooks = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const data = await webhooksService.list(req.authUser.id);
  res.json(data);
});
