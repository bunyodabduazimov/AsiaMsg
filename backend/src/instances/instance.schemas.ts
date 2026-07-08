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

export const updateInstanceStatusSchema = z.object({
  status: z.enum(['WAITING_QR', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'RECONNECTING']),
  qrCode: z.string().min(1).nullable().optional()
});

export const updateInstanceSettingsSchema = z.object({
  webhookUrl: z.string().url().max(2048).nullable().optional(),
  webhookSecret: z.string().max(255).nullable().optional(),
  webhookRetryCount: z.number().int().min(0).max(10).optional(),
  webhookOnReceived: z.boolean().optional(),
  webhookOnCreate: z.boolean().optional(),
  webhookOnAck: z.boolean().optional(),
  webhookDownloadMedia: z.boolean().optional(),
  webhookOnReaction: z.boolean().optional(),
  autoReconnect: z.boolean().optional(),
  storeIncomingMessages: z.boolean().optional(),
  storeOutgoingMessages: z.boolean().optional()
});
