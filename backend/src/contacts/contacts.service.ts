import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';

export class ContactsService {
  async list(userId: string, instanceId: string) {
    const instance = await instanceService.getById(userId, instanceId);

    // Live data from WhatsApp via in-memory store
    const liveContacts = baileysManager.getContacts(instance.id);
    if (liveContacts.length > 0) {
      return { success: true, data: liveContacts, source: 'whatsapp' };
    }

    // Fallback: unique remoteJids from DB (excluding groups)
    const rows = await prisma.message.findMany({
      where: { instanceId: instance.id },
      select: { remoteJid: true },
      distinct: ['remoteJid']
    });

    const data = rows
      .filter(r => !r.remoteJid.includes('@g.us'))
      .map(r => ({ id: r.remoteJid }));

    return { success: true, data, source: 'database' };
  }

  async ids(userId: string, instanceId: string) {
    const result = await this.list(userId, instanceId);
    const ids = result.data
      .map((c: any) => c?.id ?? c?.jid)
      .filter((id: unknown): id is string => typeof id === 'string');

    return { success: true, data: ids };
  }

  async getById(userId: string, instanceId: string, contactId: string) {
    await instanceService.getById(userId, instanceId);
    const normalized = this.normalizeJid(contactId);

    // Check in-memory store first
    const liveContacts = baileysManager.getContacts(instanceId);
    const found = liveContacts.find((c: any) => c?.id === normalized || c?.jid === normalized);
    if (found) return { success: true, data: found };

    // Try live WhatsApp check
    const socket = this.getSocket(instanceId);
    if (socket && typeof socket.onWhatsApp === 'function') {
      const result = await socket.onWhatsApp(normalized).catch(() => null);
      const first = Array.isArray(result) ? result[0] ?? null : result;
      return { success: true, data: first };
    }

    return { success: true, data: { id: normalized } };
  }

  async blocked(userId: string, instanceId: string) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocket(instanceId);

    if (socket && typeof socket.fetchBlocklist === 'function') {
      const blocklist = await socket.fetchBlocklist().catch(() => []);
      return { success: true, data: Array.isArray(blocklist) ? blocklist : [] };
    }

    return { success: true, data: [] };
  }

  async invalid(userId: string, instanceId: string) {
    await instanceService.getById(userId, instanceId);
    return { success: true, data: [] };
  }

  async check(userId: string, instanceId: string, remoteJid: string) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocket(instanceId);

    if (!socket || typeof socket.onWhatsApp !== 'function') {
      throw new AppError('WhatsApp instance is not connected', 400);
    }

    const normalized = this.normalizeJid(remoteJid);
    const result = await socket.onWhatsApp(normalized).catch(() => null);
    const first = Array.isArray(result) ? result[0] : result;

    return {
      success: true,
      data: { valid: Boolean(first?.exists), jid: first?.jid ?? normalized }
    };
  }

  async image(userId: string, instanceId: string, remoteJid: string) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocket(instanceId);

    if (!socket || typeof socket.profilePictureUrl !== 'function') {
      throw new AppError('WhatsApp instance is not connected', 400);
    }

    const normalized = this.normalizeJid(remoteJid);
    const imageUrl = await socket.profilePictureUrl(normalized, 'image').catch(() => null);
    return { success: true, data: { jid: normalized, imageUrl } };
  }

  async block(userId: string, instanceId: string, contactId: string) {
    return this.updateBlockStatus(userId, instanceId, contactId, 'block');
  }

  async unblock(userId: string, instanceId: string, contactId: string) {
    return this.updateBlockStatus(userId, instanceId, contactId, 'unblock');
  }

  private async updateBlockStatus(
    userId: string,
    instanceId: string,
    contactId: string,
    action: 'block' | 'unblock'
  ) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocket(instanceId);

    if (!socket || typeof socket.updateBlockStatus !== 'function') {
      throw new AppError('WhatsApp instance is not connected', 400);
    }

    const normalized = this.normalizeJid(contactId);
    await socket.updateBlockStatus(normalized, action);
    return { success: true, data: { contactId: normalized, action } };
  }

  private getSocket(instanceId: string) {
    return (baileysManager as any).instances?.get(instanceId)?.socket ?? null;
  }

  private normalizeJid(value: string) {
    const input = String(value ?? '').trim();
    if (!input) return input;
    if (input.includes('@')) return input;
    const digits = input.replace(/\D/g, '');
    return `${digits}@s.whatsapp.net`;
  }
}

export const contactsService = new ContactsService();
