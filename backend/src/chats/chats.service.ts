import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';

type ChatActionInput = {
  instanceId: string;
  chatId: string;
};

export class ChatsService {
  async list(userId: string, instanceId: string) {
    const instance = await instanceService.getById(userId, instanceId);

    // Live data from WhatsApp via in-memory store
    const liveChats = baileysManager.getChats(instance.id);
    if (liveChats.length > 0) {
      return { success: true, data: liveChats, source: 'whatsapp' };
    }

    // Fallback: derive unique chats from stored messages
    const rows = await prisma.message.groupBy({
      by: ['remoteJid'],
      where: { instanceId: instance.id },
      _count: { id: true },
      _max: { sentAt: true, createdAt: true }
    });

    const data = rows.map(row => ({
      id: row.remoteJid,
      messageCount: row._count.id,
      lastMessageAt: row._max.sentAt ?? row._max.createdAt
    }));

    return { success: true, data, source: 'database' };
  }

  async ids(userId: string, instanceId: string) {
    const result = await this.list(userId, instanceId);
    const ids = result.data
      .map((chat: any) => chat?.id ?? chat?.jid)
      .filter((id: unknown): id is string => typeof id === 'string');

    return { success: true, data: ids };
  }

  async messages(userId: string, instanceId: string, chatId: string) {
    const instance = await instanceService.getById(userId, instanceId);
    const normalizedChatId = String(chatId).trim();

    const liveMessages = baileysManager.getChatMessages(instance.id, normalizedChatId, 50);
    if (liveMessages.length > 0) {
      return { success: true, data: liveMessages, source: 'whatsapp' };
    }

    const items = await prisma.message.findMany({
      where: {
        instanceId: instance.id,
        remoteJid: normalizedChatId
      },
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    return { success: true, data: items, source: 'database' };
  }

  async archive(userId: string, input: ChatActionInput) {
    return this.modifyChat(userId, input, { archive: true });
  }

  async unarchive(userId: string, input: ChatActionInput) {
    return this.modifyChat(userId, input, { archive: false });
  }

  async clearMessages(userId: string, input: ChatActionInput) {
    const instance = await instanceService.getById(userId, input.instanceId);
    const chatId = String(input.chatId).trim();

    const result = await prisma.message.deleteMany({
      where: { instanceId: instance.id, remoteJid: chatId }
    });

    return { success: true, data: { chatId, deleted: result.count } };
  }

  async delete(userId: string, input: ChatActionInput) {
    return this.modifyChat(userId, input, { delete: true });
  }

  async read(userId: string, input: ChatActionInput) {
    return this.modifyChat(userId, input, { markRead: true });
  }

  private async modifyChat(userId: string, input: ChatActionInput, patch: Record<string, unknown>) {
    await instanceService.getById(userId, input.instanceId);
    const chatId = String(input.chatId).trim();

    const managed = (baileysManager as any).instances?.get(input.instanceId);
    const socket = managed?.socket;
    if (socket && typeof socket.chatModify === 'function') {
      try {
        await socket.chatModify(patch, chatId, []);
      } catch {
        // best-effort
      }
    }

    return { success: true, data: { chatId, ...patch } };
  }
}

export const chatsService = new ChatsService();
