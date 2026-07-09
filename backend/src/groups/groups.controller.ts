import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../middleware/error-handler';
import { groupsService } from './groups.service';

const getInstanceId = (req: Request) => {
  const instanceId =
    (typeof req.body?.instanceId === 'string' ? req.body.instanceId : undefined) ??
    (typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined);

  if (!instanceId) {
    throw new AppError('instanceId is required', 400);
  }

  return instanceId;
};

const getGroupId = (req: Request) => {
  const groupId = String(req.params.groupId ?? '').trim();
  if (!groupId) {
    throw new AppError('groupId is required', 400);
  }
  return groupId;
};

export const listGroups = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await groupsService.list(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const listGroupIds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await groupsService.ids(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await groupsService.getById(req.authUser.id, getInstanceId(req), getGroupId(req));
  res.json(result);
});
