import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { changePasswordSchema, googleLoginSchema, loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas';
import { AuthService } from './auth.service';

const authService = new AuthService();

const parseSchema = <T>(schema: { parse: (input: unknown) => T }, input: unknown) => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { error };
    }

    throw error;
  }
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(registerSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  const result = await authService.register(payload);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(loginSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  const result = await authService.login(payload);
  res.json(result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(changePasswordSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  const result = await authService.changePassword(req.authUser!.id, payload.currentPassword, payload.newPassword);
  res.json(result);
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(googleLoginSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  if (payload.code) {
    const origin = req.get('origin')?.trim();
    const requestedWith = req.get('x-requested-with');

    if (!origin) {
      res.status(400).json({ message: 'Google authorization origin is missing' });
      return;
    }

    if (requestedWith !== 'XMLHttpRequest') {
      res.status(400).json({ message: 'Google authorization request is missing required headers' });
      return;
    }

    const result = await authService.loginWithGoogleCode(payload.code, origin);
    res.json(result);
    return;
  }

  const result = await authService.loginWithGoogle(payload.idToken!);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(refreshSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  const result = await authService.refresh(payload);
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const parsed = parseSchema(logoutSchema, req.body);
  if ('error' in parsed) {
    res.status(400).json({ message: parsed.error.issues });
    return;
  }

  const payload = parsed;
  await authService.logout(payload.refreshToken);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.me(req.authUser!.id);
  res.json(result);
});
