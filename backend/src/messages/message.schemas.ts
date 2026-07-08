import { z } from 'zod';

export const createMessageSchema = z.object({
  instanceId: z.string().min(1),
  remoteJid: z.string().min(3).max(64),
  messageText: z.string().min(1).max(4000),
  messageType: z.enum(['text', 'file', 'image', 'document']),
  imageUrl: z.string().url().max(2048).optional(),
  documentUrl: z.string().url().max(2048).optional(),
  fileName: z.string().min(1).max(255).optional(),
  attachment: z
    .object({
      name: z.string().min(1).max(255),
      type: z.string().min(1).max(120),
      size: z.number().int().nonnegative(),
      dataBase64: z.string().min(1).optional()
    })
    .nullable()
    .optional()
});
