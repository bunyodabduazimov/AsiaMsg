import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../middleware/error-handler';
import { contactsService } from './contacts.service';

const getInstanceId = (req: Request) => {
  const instanceId =
    (typeof req.body?.instanceId === 'string' ? req.body.instanceId : undefined) ??
    (typeof req.query.instanceId === 'string' ? req.query.instanceId : undefined);

  if (!instanceId) {
    throw new AppError('instanceId is required', 400);
  }

  return instanceId;
};

const getContactId = (req: Request) => {
  const contactId = String(req.params.contactId ?? '').trim();
  if (!contactId) {
    throw new AppError('contactId is required', 400);
  }
  return contactId;
};

const getRemoteJid = (req: Request) => {
  const remoteJid =
    (typeof req.body?.remoteJid === 'string' ? req.body.remoteJid : undefined) ??
    (typeof req.query.remoteJid === 'string' ? req.query.remoteJid : undefined);

  if (!remoteJid) {
    throw new AppError('remoteJid is required', 400);
  }

  return remoteJid;
};

export const listContacts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.list(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const listContactIds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.ids(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const getContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.getById(req.authUser.id, getInstanceId(req), getContactId(req));
  res.json(result);
});

export const getBlockedContacts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.blocked(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const getInvalidContacts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.invalid(req.authUser.id, getInstanceId(req));
  res.json(result);
});

export const checkContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.check(req.authUser.id, getInstanceId(req), getRemoteJid(req));
  res.json(result);
});

export const getContactImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.image(req.authUser.id, getInstanceId(req), getRemoteJid(req));
  res.json(result);
});

export const blockContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.block(req.authUser.id, getInstanceId(req), getContactId(req));
  res.json(result);
});

export const unblockContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await contactsService.unblock(req.authUser.id, getInstanceId(req), getContactId(req));
  res.json(result);
});
