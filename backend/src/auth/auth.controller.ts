import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas';
import { AuthService } from './auth.service';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const result = await authService.register(payload);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await authService.login(payload);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = refreshSchema.parse(req.body);
  const result = await authService.refresh(payload);
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const payload = logoutSchema.parse(req.body);
  await authService.logout(payload.refreshToken);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.authUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await authService.me(req.authUser.id);
  res.json(result);
});
