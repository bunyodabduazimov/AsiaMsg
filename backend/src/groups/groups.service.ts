import { AppError } from '../middleware/error-handler';
import { instanceService } from '../instances/instance.service';
import { baileysManager } from '../providers/whatsapp/baileys.manager';

export class GroupsService {
  async list(userId: string, instanceId: string) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocketOrThrow(instanceId);

    if (typeof socket.groupFetchAllParticipating !== 'function') {
      return { success: true, data: [] };
    }

    const groups = await socket.groupFetchAllParticipating();
    const asArray = groups && typeof groups === 'object' ? Object.values(groups) : [];

    return {
      success: true,
      data: asArray
    };
  }

  async ids(userId: string, instanceId: string) {
    const result = await this.list(userId, instanceId);
    const ids = result.data
      .map((group: any) => (group as any)?.id)
      .filter((groupId: unknown): groupId is string => typeof groupId === 'string');

    return {
      success: true,
      data: ids
    };
  }

  async getById(userId: string, instanceId: string, groupId: string) {
    await instanceService.getById(userId, instanceId);
    const socket = this.getSocketOrThrow(instanceId);

    if (typeof socket.groupMetadata !== 'function') {
      throw new AppError('Get group metadata is not supported by current WhatsApp provider', 400);
    }

    const metadata = await socket.groupMetadata(String(groupId).trim());
    return {
      success: true,
      data: metadata
    };
  }

  private getSocketOrThrow(instanceId: string) {
    const managed = (baileysManager as any).instances?.get(instanceId);
    const socket = managed?.socket;
    if (!socket) {
      throw new AppError('WhatsApp instance is not connected', 400);
    }
    return socket;
  }
}

export const groupsService = new GroupsService();
