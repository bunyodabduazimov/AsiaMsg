import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../middleware/error-handler';
import { mediaService } from './media.service';

const getInstanceId = (req: Request) => {
  const instanceId =
    (typeof req.body?.instanceId === 'string' ? req.body.instanceId : undefined) ??
    (typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined);

  if (!instanceId) {
    throw new AppError('instanceId is required', 400);
  }

  return instanceId;
};

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const fileUrl = String(req.body?.fileUrl ?? '').trim();
  const result = await mediaService.upload(req.authUser.id, getInstanceId(req), fileUrl);
  res.json(result);
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const mediaId = String(req.body?.mediaId ?? '').trim();
  const result = await mediaService.deleteById(req.authUser.id, getInstanceId(req), mediaId);
  res.json(result);
});

export const deleteMediaByDate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const date = String(req.body?.date ?? '').trim();
  const result = await mediaService.deleteByDate(req.authUser.id, getInstanceId(req), date);
  res.json(result);
});
