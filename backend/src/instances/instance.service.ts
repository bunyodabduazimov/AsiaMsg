import { AppError } from '../middleware/error-handler';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { InstanceRepository } from './instance.repository';
import type {
  CreateInstanceInput,
  UpdateInstanceInput,
  UpdatePhoneNumberInput
} from './instance.types';

export class InstanceService {
  constructor(private readonly repository = new InstanceRepository()) {}

  list(userId: string) {
    return this.repository.listByUser(userId);
  }

  create(userId: string, input: CreateInstanceInput) {
    return this.repository.create(userId, {
      name: input.name,
      phoneNumber: input.phoneNumber ?? null
    });
  }

  async getById(userId: string, instanceId: string) {
    const instance = await this.repository.findByIdAndUser(instanceId, userId);
    if (!instance) {
      throw new AppError('Instance not found', 404);
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

  async connect(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    await this.repository.updateStatus(instanceId, 'CONNECTING', instance.qrCode);
    await baileysManager.connect(instance);
    return this.getById(userId, instanceId);
  }

  async disconnect(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.disconnect(instanceId);
    return this.repository.updateStatus(instanceId, 'DISCONNECTED');
  }

  getQr(userId: string, instanceId: string) {
    return this.getById(userId, instanceId);
  }

  restoreSessions() {
    return baileysManager.restoreActiveSessions();
  }
}

export const instanceService = new InstanceService();
