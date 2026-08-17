import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { instanceLogsService } from './instance-logs.service';

export const listInstanceLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const data = await instanceLogsService.list(req.authUser.id);
  res.json(data);
});
