import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const googleLoginSchema = z.object({
  code: z.string().min(1).optional(),
  idToken: z.string().min(1).optional()
}).refine(input => Boolean(input.code || input.idToken), {
  message: 'Either code or idToken is required'
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1)
});
