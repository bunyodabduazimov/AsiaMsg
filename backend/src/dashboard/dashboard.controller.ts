import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { dashboardService } from './dashboard.service';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const data = await dashboardService.getDashboard(req.authUser.id);
  res.json(data);
});
