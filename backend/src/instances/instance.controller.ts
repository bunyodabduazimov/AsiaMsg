import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  createInstanceSchema,
  updateInstanceSchema,
  updatePhoneNumberSchema
} from './instance.schemas';
import { instanceService } from './instance.service';

export const listInstances = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const items = await instanceService.list(req.authUser.id);
  res.json(items);
});

export const createInstance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = createInstanceSchema.parse(req.body);
  const item = await instanceService.create(req.authUser.id, payload);
  res.status(201).json(item);
});

export const getInstance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const instanceId = String(req.params.instanceId);
  const item = await instanceService.getById(req.authUser.id, instanceId);
  res.json(item);
});

export const updateInstance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = updateInstanceSchema.parse(req.body);
  const instanceId = String(req.params.instanceId);
  const item = await instanceService.update(req.authUser.id, instanceId, payload);
  res.json(item);
});

export const updateInstancePhoneNumber = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = updatePhoneNumberSchema.parse(req.body);
  const instanceId = String(req.params.instanceId);
  const item = await instanceService.updatePhoneNumber(req.authUser.id, instanceId, payload);
  res.json(item);
});

export const connectInstance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const instanceId = String(req.params.instanceId);
  const item = await instanceService.connect(req.authUser.id, instanceId);
  res.json(item);
});

export const disconnectInstance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const instanceId = String(req.params.instanceId);
  const item = await instanceService.disconnect(req.authUser.id, instanceId);
  res.json(item);
});

export const getInstanceQr = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const instanceId = String(req.params.instanceId);
  const item = await instanceService.getQr(req.authUser.id, instanceId);
  res.json(item);
});
