import { z } from 'zod';

export const createInstanceSchema = z.object({
  name: z.string().min(2).max(120),
  phoneNumber: z.string().min(3).max(32).optional()
});

export const updateInstanceSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phoneNumber: z.string().min(3).max(32).nullable().optional()
});

export const updatePhoneNumberSchema = z.object({
  phoneNumber: z.string().min(3).max(32).nullable()
});
