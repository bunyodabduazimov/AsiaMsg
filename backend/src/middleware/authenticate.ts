import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { AuthRepository } from '../auth/auth.repository';
import { InstanceRepository } from '../instances/instance.repository';
import { hashToken, verifyAccessToken } from '../utils/jwt';

const instanceRepository = new InstanceRepository();
const authRepository = new AuthRepository();

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractInstanceId = (req: Request): { instanceId: string | null; hasMismatch: boolean } => {
  const fromParams = asNonEmptyString(req.params.instanceId);

  const queryValue = req.query.instanceId;
  const fromQuery = Array.isArray(queryValue)
    ? asNonEmptyString(queryValue[0])
    : asNonEmptyString(queryValue);

  const fromBody =
    req.body && typeof req.body === 'object'
      ? asNonEmptyString((req.body as Record<string, unknown>).instanceId)
      : null;

  const instanceId = fromParams ?? fromQuery ?? fromBody;
  const providedValues = [fromParams, fromQuery, fromBody].filter((value): value is string => Boolean(value));
  const hasMismatch = providedValues.some(value => value !== instanceId);

  return { instanceId, hasMismatch };
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);

    try {
      const payload = verifyAccessToken(token);
      req.authUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as UserRole
      };
      return next();
    } catch {
      // fallback to API key auth below
    }
  }

  const apiKey = asNonEmptyString(req.headers['x-api-key']);
  if (!apiKey) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { instanceId, hasMismatch } = extractInstanceId(req);
  if (!instanceId) {
    return res.status(401).json({ message: 'instanceId is required for API key auth' });
  }

  if (hasMismatch) {
    return res.status(400).json({ message: 'instanceId mismatch in request' });
  }

  try {
    const apiKeyHash = hashToken(apiKey);
    const instance = await instanceRepository.findByIdAndApiKeyHash(instanceId, apiKeyHash);

    if (!instance) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await authRepository.findUserById(instance.userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole
    };

    await instanceRepository.touchApiKeyLastUsed(instance.id);
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
