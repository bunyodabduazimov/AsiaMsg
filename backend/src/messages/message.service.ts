import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { z } from 'zod';
import { createMessageSchema } from './message.schemas';

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export class MessageService {
  async create(userId: string, input: CreateMessageInput) {
    const instance = await instanceService.getById(userId, input.instanceId);

    if (!instance) {
      throw new AppError('Instance not found', 404);
    }

    if (!baileysManager.isRunning(instance.id) || instance.status !== 'CONNECTED') {
      throw new AppError('WhatsApp instance is not connected', 409);
    }

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
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        image: imageAsset.buffer,
        mimetype: imageAsset.mimeType,
        caption: input.messageText
      });
    } else {
      sentMessage = await baileysManager.sendMessage(instance.id, input.remoteJid, {
        text: input.messageText
      });
    }

    const messageId = sentMessage?.key?.id || sentMessage?.messageId || `msg-${Date.now()}`;
    const payload = {
      text: input.messageText,
      type: input.messageType,
      attachment: attachment
        ? {
            name: attachment.name,
            type: attachment.type,
            size: attachment.size
          }
        : null
    };

    return prisma.message.create({
      data: {
        instanceId: instance.id,
        direction: 'outbound',
        remoteJid: input.remoteJid,
        messageId,
        payload,
        status: 'sent',
        sentAt: new Date()
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
  }

  private async downloadRemoteFile(url: string) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new AppError('Image URL is invalid', 400);
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new AppError('Image URL must use http or https', 400);
    }

    const response = await fetch(parsedUrl);
    if (!response.ok) {
      throw new AppError(`Failed to download image (${response.status})`, 400);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new AppError('Image URL must point to an image', 400);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new AppError('Image download returned empty file', 400);
    }

    return {
      buffer,
      mimeType: contentType.split(';')[0] || 'image/jpeg'
    };
  }
}

export const messageService = new MessageService();
