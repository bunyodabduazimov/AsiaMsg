import { z } from 'zod';

const baseMessageSchema = z.object({
  instanceId: z.string().min(1),
  remoteJid: z.string().min(3).max(64)
});

export const createMessageSchema = z.object({
  instanceId: z.string().min(1),
  remoteJid: z.string().min(3).max(64),
  messageText: z.string().min(1).max(4000).optional(),
  messageType: z.enum([
    'text',
    'file',
    'image',
    'document',
    'audio',
    'voice',
    'video',
    'sticker',
    'contact',
    'location',
    'vcard'
  ]),
  imageUrl: z.string().url().max(2048).optional(),
  documentUrl: z.string().url().max(2048).optional(),
  audioUrl: z.string().url().max(2048).optional(),
  voiceUrl: z.string().url().max(2048).optional(),
  videoUrl: z.string().url().max(2048).optional(),
  stickerUrl: z.string().url().max(2048).optional(),
  fileName: z.string().min(1).max(255).optional(),
  phoneNumber: z.string().min(3).max(32).optional(),
  name: z.string().min(1).max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  vcard: z.string().min(5).max(3000).optional(),
  attachment: z
    .object({
      name: z.string().min(1).max(255),
      type: z.string().min(1).max(120),
      size: z.number().int().nonnegative(),
      dataBase64: z.string().min(1).optional()
    })
    .nullable()
    .optional()
}).superRefine((data, ctx) => {
  if (data.messageType === 'text' && !data.messageText) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['messageText'], message: 'messageText is required for text' });
  }

  if (data.messageType === 'image' && !data.imageUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['imageUrl'], message: 'imageUrl is required for image' });
  }

  if (data.messageType === 'document' && !data.documentUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['documentUrl'], message: 'documentUrl is required for document' });
  }

  if (data.messageType === 'audio' && !data.audioUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['audioUrl'], message: 'audioUrl is required for audio' });
  }

  if (data.messageType === 'voice' && !data.voiceUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['voiceUrl'], message: 'voiceUrl is required for voice' });
  }

  if (data.messageType === 'video' && !data.videoUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['videoUrl'], message: 'videoUrl is required for video' });
  }

  if (data.messageType === 'sticker' && !data.stickerUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stickerUrl'], message: 'stickerUrl is required for sticker' });
  }

  if (data.messageType === 'contact') {
    if (!data.name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'name is required for contact' });
    }

    if (!data.phoneNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phoneNumber'], message: 'phoneNumber is required for contact' });
    }
  }

  if (data.messageType === 'location') {
    if (typeof data.latitude !== 'number') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['latitude'], message: 'latitude is required for location' });
    }

    if (typeof data.longitude !== 'number') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['longitude'], message: 'longitude is required for location' });
    }
  }

  if (data.messageType === 'vcard' && !data.vcard) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vcard'], message: 'vcard is required for vcard' });
  }

  if (data.messageType === 'file' && !data.attachment?.dataBase64) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['attachment', 'dataBase64'], message: 'attachment.dataBase64 is required for file' });
  }
});

export const listMessagesSchema = z.object({
  instanceId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  remoteJid: z.string().min(3).max(64).optional(),
  status: z.string().min(1).max(64).optional()
});

export const messageStatisticsSchema = z.object({
  instanceId: z.string().min(1)
});

export const clearMessagesSchema = z.object({
  instanceId: z.string().min(1)
});

export const resendByStatusSchema = z.object({
  instanceId: z.string().min(1),
  status: z.string().min(1).max(64)
});

export const resendByIdSchema = z.object({
  instanceId: z.string().min(1),
  messageId: z.string().min(1).max(128)
});

export const reactionSchema = baseMessageSchema.extend({
  messageId: z.string().min(1).max(128),
  emoji: z.string().min(1).max(16)
});

export const deleteMessageSchema = baseMessageSchema.extend({
  messageId: z.string().min(1).max(128)
});
