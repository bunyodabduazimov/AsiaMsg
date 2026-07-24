import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { webhookDispatcher } from '../webhooks/webhook.dispatcher';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { createMessageSchema, deleteMessageSchema, listMessagesSchema, reactionSchema } from './message.schemas';

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
export type SendReactionInput = z.infer<typeof reactionSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

type StoredMessageRequest = {
  text?: string | null;
  type?: string | null;
  imageUrl?: string | null;
  documentUrl?: string | null;
  audioUrl?: string | null;
  voiceUrl?: string | null;
  videoUrl?: string | null;
  stickerUrl?: string | null;
  fileName?: string | null;
  phoneNumber?: string | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  vcard?: string | null;
  attachment?: {
    name?: string | null;
    type?: string | null;
    size?: number | null;
    dataBase64?: string | null;
  } | null;
};

export class MessageService {
  private readonly outboundQueue: Array<{
    messageRecordId: string;
    userId: string;
    instanceId: string;
    input: CreateMessageInput;
  }> = [];

  private processingOutboundQueue = false;

  async create(userId: string, input: CreateMessageInput) {
    const instance = await this.getInstanceByIdOrThrow(userId, input.instanceId);
    await this.ensureWhatsAppConnected(instance);
    const payload = this.buildQueuedPayload(input);

    const createdMessage = await prisma.message.create({
      data: {
        instanceId: instance.id,
        direction: 'outbound',
        remoteJid: this.normalizeRemoteJid(input.remoteJid),
        messageId: null,
        payload,
        status: 'queued',
        sentAt: null
      },
      include: {
        instance: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    this.enqueueOutboundMessage({
      messageRecordId: createdMessage.id,
      userId,
      instanceId: instance.id,
      input
    });

    return createdMessage;
  }

  async list(userId: string, query: ListMessagesInput) {
    const instance = await this.getInstanceByIdOrThrow(userId, query.instanceId);

    const where: Prisma.MessageWhereInput = {
      instanceId: instance.id,
      ...(query.remoteJid ? { remoteJid: this.normalizeRemoteJid(query.remoteJid) } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0
      }),
      prisma.message.count({ where })
    ]);

    return {
      success: true,
      data: items,
      meta: {
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0
      }
    };
  }

  async statistics(userId: string, instanceId: string) {
    const instance = await this.getInstanceByIdOrThrow(userId, instanceId);

    const [total, queued, sent, failed, outbound, inbound] = await Promise.all([
      prisma.message.count({ where: { instanceId: instance.id } }),
      prisma.message.count({ where: { instanceId: instance.id, status: 'queued' } }),
      prisma.message.count({ where: { instanceId: instance.id, status: 'sent' } }),
      prisma.message.count({ where: { instanceId: instance.id, status: 'failed' } }),
      prisma.message.count({ where: { instanceId: instance.id, direction: 'outbound' } }),
      prisma.message.count({ where: { instanceId: instance.id, direction: 'inbound' } })
    ]);

    return {
      success: true,
      data: {
        total,
        queued,
        sent,
        failed,
        outbound,
        inbound
      }
    };
  }

  async clear(userId: string, instanceId: string) {
    const instance = await this.getInstanceByIdOrThrow(userId, instanceId);
    const result = await prisma.message.deleteMany({ where: { instanceId: instance.id } });

    return {
      success: true,
      data: {
        deleted: result.count
      }
    };
  }

  async resendById(userId: string, instanceId: string, messageId: string) {
    const instance = await this.getInstanceByIdOrThrow(userId, instanceId);
    const sourceMessage = await prisma.message.findFirst({
      where: {
        instanceId: instance.id,
        direction: 'outbound',
        messageId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!sourceMessage) {
      throw new AppError('Message not found', 404);
    }

    const recreatedInput = this.buildCreateInputFromStoredMessage(instance.id, sourceMessage.remoteJid, sourceMessage.payload);
    await this.create(userId, recreatedInput);

    return {
      success: true,
      data: {
        status: 'queued',
        resent: 1
      }
    };
  }

  async resendByStatus(userId: string, instanceId: string, status: string) {
    const instance = await this.getInstanceByIdOrThrow(userId, instanceId);
    const sourceMessages = await prisma.message.findMany({
      where: {
        instanceId: instance.id,
        direction: 'outbound',
        status
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    let resent = 0;
    for (const sourceMessage of sourceMessages) {
      const recreatedInput = this.buildCreateInputFromStoredMessage(instance.id, sourceMessage.remoteJid, sourceMessage.payload);
      await this.create(userId, recreatedInput);
      resent += 1;
    }

    return {
      success: true,
      data: {
        status: 'queued',
        resent
      }
    };
  }

  async react(userId: string, input: SendReactionInput) {
    const instance = await this.getInstanceByIdOrThrow(userId, input.instanceId);
    await this.ensureWhatsAppConnected(instance);

    const remoteJid = this.normalizeRemoteJid(input.remoteJid);
    const sent = await baileysManager.sendMessage(instance.id, remoteJid, {
      react: {
        text: input.emoji,
        key: {
          remoteJid,
          fromMe: true,
          id: input.messageId
        }
      }
    });

    return {
      success: true,
      data: {
        status: 'sent',
        type: 'reaction',
        result: this.serializeWhatsAppResponse(sent)
      }
    };
  }

  async delete(userId: string, input: DeleteMessageInput) {
    const instance = await this.getInstanceByIdOrThrow(userId, input.instanceId);
    await this.ensureWhatsAppConnected(instance);

    const remoteJid = this.normalizeRemoteJid(input.remoteJid);
    const sent = await baileysManager.sendMessage(instance.id, remoteJid, {
      delete: {
        remoteJid,
        fromMe: true,
        id: input.messageId
      }
    });

    await prisma.message.updateMany({
      where: {
        instanceId: instance.id,
        messageId: input.messageId,
        direction: 'outbound'
      },
      data: {
        status: 'deleted'
      }
    });

    return {
      success: true,
      data: {
        status: 'deleted',
        result: this.serializeWhatsAppResponse(sent)
      }
    };
  }

  private async sendByType(instanceId: string, input: CreateMessageInput) {
    const attachment = input.attachment ?? null;

    if (input.messageType === 'file') {
      if (!attachment?.dataBase64) {
        throw new AppError('File content is required', 400);
      }

      const fileBuffer = Buffer.from(attachment.dataBase64, 'base64');
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        document: fileBuffer,
        fileName: input.fileName || attachment.name,
        mimetype: attachment.type,
        caption: input.messageText
      });
    }

    if (input.messageType === 'image') {
      const imageAsset = await this.downloadRemoteFile(input.imageUrl!);
      if (!imageAsset.mimeType.startsWith('image/')) {
        throw new AppError('Image URL must point to an image', 400);
      }

      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        image: imageAsset.buffer,
        mimetype: imageAsset.mimeType,
        caption: input.messageText
      });
    }

    if (input.messageType === 'document') {
      const documentAsset = await this.downloadRemoteFile(input.documentUrl!);
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        document: documentAsset.buffer,
        fileName: input.fileName || documentAsset.fileName,
        mimetype: documentAsset.mimeType,
        caption: input.messageText
      });
    }

    if (input.messageType === 'audio') {
      const audioAsset = await this.downloadRemoteFile(input.audioUrl!);
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        audio: audioAsset.buffer,
        mimetype: audioAsset.mimeType,
        ptt: false
      });
    }

    if (input.messageType === 'voice') {
      const voiceAsset = await this.downloadRemoteFile(input.voiceUrl!);

      if (!this.isLikelyOgg(voiceAsset.mimeType, voiceAsset.fileName)) {
        throw new AppError('voiceUrl must point to an OGG file (audio/ogg)', 400);
      }

      if (!this.isOpusAudio(voiceAsset.buffer)) {
        throw new AppError('voiceUrl must be OGG Opus audio for WhatsApp voice notes', 400);
      }

      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        audio: voiceAsset.buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      });
    }

    if (input.messageType === 'video') {
      const videoAsset = await this.downloadRemoteFile(input.videoUrl!);
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        video: videoAsset.buffer,
        mimetype: videoAsset.mimeType,
        caption: input.messageText
      });
    }

    if (input.messageType === 'sticker') {
      const stickerAsset = await this.downloadRemoteFile(input.stickerUrl!);
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        sticker: stickerAsset.buffer,
        mimetype: stickerAsset.mimeType
      });
    }

    if (input.messageType === 'contact') {
      const vcard = this.buildVcard(input.name!, input.phoneNumber!);
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        contacts: {
          displayName: input.name,
          contacts: [{ vcard }]
        }
      });
    }

    if (input.messageType === 'location') {
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        location: {
          degreesLatitude: input.latitude,
          degreesLongitude: input.longitude,
          name: input.messageText || undefined,
          address: input.messageText || undefined
        }
      });
    }

    if (input.messageType === 'vcard') {
      return baileysManager.sendMessage(instanceId, input.remoteJid, {
        contacts: {
          displayName: input.name || 'Contact',
          contacts: [{ vcard: input.vcard }]
        }
      });
    }

    return baileysManager.sendMessage(instanceId, input.remoteJid, {
      text: input.messageText || ''
    });
  }

  private enqueueOutboundMessage(job: {
    messageRecordId: string;
    userId: string;
    instanceId: string;
    input: CreateMessageInput;
  }) {
    this.outboundQueue.push(job);
    void this.processOutboundQueue();
  }

  private async processOutboundQueue() {
    if (this.processingOutboundQueue) {
      return;
    }

    this.processingOutboundQueue = true;

    try {
      while (this.outboundQueue.length > 0) {
        const job = this.outboundQueue.shift();
        if (!job) {
          continue;
        }

        await this.processOutboundJob(job);
      }
    } finally {
      this.processingOutboundQueue = false;
    }
  }

  private async processOutboundJob(job: {
    messageRecordId: string;
    userId: string;
    instanceId: string;
    input: CreateMessageInput;
  }) {
    try {
      const instance = await this.getInstanceByIdOrThrow(job.userId, job.instanceId);
      await this.ensureWhatsAppConnected(instance);

      const sentMessage = await this.sendByType(instance.id, job.input);
      const messageId = sentMessage?.key?.id || sentMessage?.messageId || `msg-${Date.now()}`;
      const whatsappRemoteJid = sentMessage?.key?.remoteJid || this.normalizeRemoteJid(job.input.remoteJid);
      const whatsappTimestamp = this.parseWhatsAppTimestamp(sentMessage?.messageTimestamp);

      const payload: Prisma.InputJsonValue = this.buildQueuedPayload(job.input, sentMessage);

      const updatedMessage = await prisma.message.update({
        where: { id: job.messageRecordId },
        data: {
          remoteJid: whatsappRemoteJid,
          messageId,
          payload,
          status: 'sent',
          sentAt: whatsappTimestamp ?? new Date()
        },
        include: {
          instance: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      await webhookDispatcher.dispatchMessageCreate({
        message: updatedMessage,
        settings: instance.settings
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await prisma.message.update({
        where: { id: job.messageRecordId },
        data: {
          status: 'failed',
          payload: {
            request: this.buildRequestPayload(job.input),
            error: message
          } as Prisma.InputJsonValue
        }
      });
      await this.logQueueFailure(job.instanceId, message);
    }
  }

  private buildQueuedPayload(input: CreateMessageInput, whatsappResponse?: unknown): Prisma.InputJsonValue {
    const payload: Record<string, unknown> = {
      request: this.buildRequestPayload(input)
    };

    if (typeof whatsappResponse !== 'undefined') {
      payload.whatsappResponse = this.serializeWhatsAppResponse(whatsappResponse);
    }

    return payload as Prisma.InputJsonValue;
  }

  private buildRequestPayload(input: CreateMessageInput) {
    const attachment = input.attachment ?? null;

    return {
      text: input.messageText ?? null,
      type: input.messageType,
      imageUrl: input.imageUrl ?? null,
      documentUrl: input.documentUrl ?? null,
      audioUrl: input.audioUrl ?? null,
      voiceUrl: input.voiceUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      stickerUrl: input.stickerUrl ?? null,
      fileName: input.fileName ?? null,
      phoneNumber: input.phoneNumber ?? null,
      name: input.name ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      vcard: input.vcard ?? null,
      attachment: attachment
        ? {
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            dataBase64: attachment.dataBase64 ?? null
          }
        : null
    };
  }

  private async logQueueFailure(instanceId: string, message: string) {
    try {
      await prisma.instanceLog.create({
        data: {
          instance: { connect: { id: instanceId } },
          level: 'error',
          message: 'Failed to process outbound message queue item',
          meta: { message } as Prisma.InputJsonValue
        }
      });
    } catch {
      // Ignore logging failures so the queue keeps moving.
    }
  }

  private buildCreateInputFromStoredMessage(instanceId: string, remoteJid: string, payload: Prisma.JsonValue): CreateMessageInput {
    const request = this.extractStoredRequest(payload);

    return createMessageSchema.parse({
      instanceId,
      remoteJid,
      messageText: request.text ?? undefined,
      messageType: request.type ?? 'text',
      imageUrl: request.imageUrl ?? undefined,
      documentUrl: request.documentUrl ?? undefined,
      audioUrl: request.audioUrl ?? undefined,
      voiceUrl: request.voiceUrl ?? undefined,
      videoUrl: request.videoUrl ?? undefined,
      stickerUrl: request.stickerUrl ?? undefined,
      fileName: request.fileName ?? undefined,
      phoneNumber: request.phoneNumber ?? undefined,
      name: request.name ?? undefined,
      latitude: request.latitude ?? undefined,
      longitude: request.longitude ?? undefined,
      vcard: request.vcard ?? undefined,
      attachment: request.attachment
        ? {
            name: request.attachment.name ?? 'file',
            type: request.attachment.type ?? 'application/octet-stream',
            size: request.attachment.size ?? 0,
            dataBase64: request.attachment.dataBase64 ?? undefined
          }
        : undefined
    });
  }

  private extractStoredRequest(payload: Prisma.JsonValue): StoredMessageRequest {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return {};
    }

    const root = payload as Record<string, unknown>;
    const request = root.request;
    if (typeof request !== 'object' || request === null || Array.isArray(request)) {
      return {};
    }

    return request as StoredMessageRequest;
  }

  private buildVcard(name: string, phoneNumber: string) {
    const digits = phoneNumber.replace(/\D/g, '');
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `TEL;type=CELL;type=VOICE;waid=${digits}:${phoneNumber}`,
      'END:VCARD'
    ].join('\n');
  }

  private async getInstanceByIdOrThrow(userId: string, instanceId: string) {
    const instance = await instanceService.getById(userId, instanceId);

    if (!instance) {
      throw new AppError('Instance not found', 404);
    }

    return instance;
  }

  private async ensureWhatsAppConnected(instance: NonNullable<Awaited<ReturnType<typeof instanceService.getById>>>) {
    const canRestoreSession = Boolean(instance.session) || ['CONNECTED', 'RECONNECTING'].includes(instance.status);

    if (!baileysManager.isRunning(instance.id) && canRestoreSession) {
      await baileysManager.connect(instance, { resetAuth: false });
      await baileysManager.waitForConnected(instance.id, 60000);
    }

    if (baileysManager.isRunning(instance.id) && baileysManager.getRuntimeStatus(instance.id) !== 'CONNECTED') {
      await baileysManager.waitForConnected(instance.id, 60000);
    }

    if (baileysManager.isRunning(instance.id) && baileysManager.getRuntimeStatus(instance.id) !== 'CONNECTED' && canRestoreSession) {
      await baileysManager.disconnect(instance.id, { suppressReconnect: true });
      await baileysManager.connect(instance, { resetAuth: false });
      await baileysManager.waitForConnected(instance.id, 60000);
    }

    if (!baileysManager.isRunning(instance.id) || baileysManager.getRuntimeStatus(instance.id) !== 'CONNECTED') {
      throw new AppError('WhatsApp instance is not connected', 409);
    }
  }

  private async downloadRemoteFile(url: string) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new AppError('File URL is invalid', 400);
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new AppError('File URL must use http or https', 400);
    }

    const response = await fetch(parsedUrl);
    if (!response.ok) {
      throw new AppError(`Failed to download file (${response.status})`, 400);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new AppError('File download returned empty content', 400);
    }

    return {
      buffer,
      mimeType: contentType.split(';')[0] || 'application/octet-stream',
      fileName: this.getFileNameFromUrl(parsedUrl)
    };
  }

  private getFileNameFromUrl(url: URL) {
    const lastSegment = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    return lastSegment || `document-${Date.now()}`;
  }

  private isLikelyOgg(mimeType: string, fileName: string) {
    const mime = mimeType.toLowerCase();
    const name = fileName.toLowerCase();

    return mime.includes('audio/ogg')
      || mime.includes('application/ogg')
      || name.endsWith('.ogg')
      || name.endsWith('.opus');
  }

  private isOpusAudio(buffer: Buffer) {
    return buffer.includes(Buffer.from('OpusHead'));
  }

  private normalizeRemoteJid(value: string) {
    const trimmed = value.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }

    return `${trimmed.replace(/\D/g, '')}@s.whatsapp.net`;
  }

  private parseWhatsAppTimestamp(value: unknown) {
    if (!value) return null;

    const raw = typeof value === 'object' && value !== null && 'low' in value
      ? Number((value as { low?: number }).low)
      : Number(value);

    if (!Number.isFinite(raw) || raw <= 0) return null;
    return new Date(raw * 1000);
  }

  private serializeWhatsAppResponse(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') {
        return item.toString();
      }

      if (Buffer.isBuffer(item)) {
        return item.toString('base64');
      }

      return item;
    })) as Prisma.InputJsonValue;
  }
}

export const messageService = new MessageService();
