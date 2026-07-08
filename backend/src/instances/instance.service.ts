import { AppError } from '../middleware/error-handler';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { InstanceRepository } from './instance.repository';
import type {
  CreateInstanceInput,
  UpdateInstanceStatusInput,
  UpdateInstanceInput,
  UpdateInstanceSettingsInput,
  UpdatePhoneNumberInput
} from './instance.types';

export class InstanceService {
  constructor(private readonly repository = new InstanceRepository()) {}

  async list(userId: string) {
    const instances = await this.repository.listByUser(userId);

    return Promise.all(instances.map(async instance => {
      const hasSavedSession = Boolean(instance.session);
      const hasRuntimeSession = baileysManager.isRunning(instance.id);
      const runtimeStatus = baileysManager.getRuntimeStatus(instance.id);
      const runtimeQr = baileysManager.getRuntimeQr(instance.id);
      const isStaleConnectedState =
        !hasRuntimeSession &&
        !hasSavedSession &&
        ['CONNECTED', 'CONNECTING', 'RECONNECTING'].includes(instance.status);

      if (runtimeStatus && runtimeStatus !== instance.status) {
        return this.repository.updateStatus(instance.id, runtimeStatus, runtimeQr ?? instance.qrCode);
      }

      if (isStaleConnectedState) {
        return this.repository.updateStatus(instance.id, 'DISCONNECTED', null);
      }

      if (instance.status === 'CONNECTED' && !hasRuntimeSession && hasSavedSession) {
        return this.repository.updateStatus(instance.id, 'RECONNECTING', instance.qrCode);
      }

      return instance;
    }));
  }

  async create(userId: string, input: CreateInstanceInput) {
    const instance = await this.repository.create(userId, {
      name: input.name,
      phoneNumber: input.phoneNumber ?? null
    });
    await this.repository.createLog(instance.id, 'info', 'WhatsApp instance created. Waiting for QR scan.');
    return instance;
  }

  async getById(userId: string, instanceId: string) {
    const instance = await this.repository.findByIdAndUser(instanceId, userId);
    if (!instance) {
      throw new AppError('Instance not found', 404);
    }
    if (
      !baileysManager.isRunning(instance.id) &&
      !instance.session &&
      ['CONNECTED', 'CONNECTING', 'RECONNECTING'].includes(instance.status)
    ) {
      return this.repository.updateStatus(instance.id, 'DISCONNECTED', null);
    }
    return instance;
  }

  async update(userId: string, instanceId: string, input: UpdateInstanceInput) {
    await this.getById(userId, instanceId);
    return this.repository.update(instanceId, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {})
    });
  }

  async updatePhoneNumber(userId: string, instanceId: string, input: UpdatePhoneNumberInput) {
    await this.getById(userId, instanceId);
    return this.repository.updatePhoneNumber(instanceId, input.phoneNumber);
  }

  async updateSettings(userId: string, instanceId: string, input: UpdateInstanceSettingsInput) {
    await this.getById(userId, instanceId);
    return this.repository.updateSettings(instanceId, input);
  }

  async updateStatus(userId: string, instanceId: string, input: UpdateInstanceStatusInput) {
    await this.getById(userId, instanceId);
    if (input.status === 'CONNECTED') {
      throw new AppError('Use /connect and scan WhatsApp QR before marking an instance as connected', 400);
    }
    return this.repository.updateStatus(instanceId, input.status, input.qrCode ?? undefined);
  }

  async connect(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    if (baileysManager.isRunning(instanceId)) {
      await baileysManager.disconnect(instanceId);
    }

    await this.repository.updateStatus(instanceId, 'CONNECTING', null);
    await baileysManager.connect(instance);
    await baileysManager.waitForQr(instanceId, 60000);
    const updated = await this.repository.findByIdAndUser(instanceId, userId);
    if (!updated) {
      throw new AppError('Instance not found', 404);
    }
    if (updated.status === 'DISCONNECTED' && !updated.qrCode) {
      throw new AppError('WhatsApp QR was not generated. Baileys disconnected before receiving QR refs. Check instance logs for statusCode.', 502);
    }
    return updated;
  }

  async disconnect(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.disconnect(instanceId);
    return this.repository.updateStatus(instanceId, 'DISCONNECTED');
  }

  async delete(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.remove(instanceId);
    await this.repository.deleteSession(instanceId);
    await this.repository.softDelete(instanceId);
  }

  async getQr(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    if (instance.status !== 'CONNECTED') {
      if (baileysManager.isRunning(instanceId)) {
        await baileysManager.disconnect(instanceId);
      }

      await this.repository.deleteSession(instanceId);
      await this.repository.updateStatus(instanceId, 'CONNECTING', null);
      await baileysManager.connect({ ...instance, session: null });
      await baileysManager.waitForQr(instanceId, 60000);
    }
    const updated = await this.repository.findByIdAndUser(instanceId, userId);
    if (!updated) {
      throw new AppError('Instance not found', 404);
    }
    if (updated.status === 'DISCONNECTED' && !updated.qrCode) {
      throw new AppError('WhatsApp QR was not generated. Baileys disconnected before receiving QR refs. Check instance logs for statusCode.', 502);
    }
    return updated;
  }

  restoreSessions() {
    return baileysManager.restoreActiveSessions();
  }
}

export const instanceService = new InstanceService();
