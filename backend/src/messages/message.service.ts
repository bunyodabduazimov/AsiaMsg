import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { webhookDispatcher } from '../webhooks/webhook.dispatcher';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { createMessageSchema } from './message.schemas';

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export class MessageService {
  async create(userId: string, input: CreateMessageInput) {
    const instance = await instanceService.getById(userId, input.instanceId);

    if (!instance) {
      throw new AppError('Instance not found', 404);
    }

    await this.ensureWhatsAppConnected(instance);

    const attachment = input.attachment ?? null;
    let sentMessage: any;

    if (input.messageType === 'file') {
      if (!attachment?.dataBase64) {
        throw new AppError('File content is required', 400);
      }

      const fileBuffer = Buffer.from(attachment.dataBase64, 'base64');
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        document: fileBuffer,
        fileName: attachment.name,
        mimetype: attachment.type,
        caption: input.messageText
      });
    } else if (input.messageType === 'image') {
      if (!input.imageUrl) {
        throw new AppError('Image URL is required', 400);
      }

      const imageAsset = await this.downloadRemoteFile(input.imageUrl);
      if (!imageAsset.mimeType.startsWith('image/')) {
        throw new AppError('Image URL must point to an image', 400);
      }
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        image: imageAsset.buffer,
        mimetype: imageAsset.mimeType,
        caption: input.messageText
      });
    } else if (input.messageType === 'document') {
      if (!input.documentUrl) {
        throw new AppError('Document URL is required', 400);
      }

      const documentAsset = await this.downloadRemoteFile(input.documentUrl);
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        document: documentAsset.buffer,
        fileName: input.fileName || documentAsset.fileName,
        mimetype: documentAsset.mimeType,
        caption: input.messageText
      });
    } else {
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        text: input.messageText
      });
    }

    const messageId = sentMessage?.key?.id || sentMessage?.messageId || `msg-${Date.now()}`;
    const whatsappRemoteJid = sentMessage?.key?.remoteJid || this.normalizeRemoteJid(input.remoteJid);
    const whatsappTimestamp = this.parseWhatsAppTimestamp(sentMessage?.messageTimestamp);
    const payload: Prisma.InputJsonValue = {
      request: {
        text: input.messageText,
        type: input.messageType,
        imageUrl: input.imageUrl ?? null,
        documentUrl: input.documentUrl ?? null,
        fileName: input.fileName ?? null,
        attachment: attachment
          ? {
              name: attachment.name,
              type: attachment.type,
              size: attachment.size
            }
          : null
      },
      whatsappResponse: this.serializeWhatsAppResponse(sentMessage)
    };

    const createdMessage = await prisma.message.create({
      data: {
        instanceId: instance.id,
        direction: 'outbound',
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
      message: createdMessage,
      settings: instance.settings
    });

    return createdMessage;
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
      await baileysManager.disconnect(instance.id);
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
