import crypto from 'node:crypto';
import { prisma } from '../database';
import { AppError } from '../middleware/error-handler';
import { hashToken } from '../utils/jwt';
import { decryptApiKey, encryptApiKey } from '../utils/api-key-crypto';
import { baileysManager } from '../providers/whatsapp/baileys.manager';
import { webhookDispatcher } from '../webhooks/webhook.dispatcher';
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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const messagesTodayByInstance = await prisma.message.groupBy({
      by: ['instanceId'],
      where: {
        instance: {
          userId
        },
        createdAt: {
          gte: startOfDay
        }
      },
      _count: {
        instanceId: true
      }
    });

    const messagesTodayMap = new Map(messagesTodayByInstance.map(item => [item.instanceId, item._count.instanceId]));

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

      const displayInstance =
        !hasRuntimeSession && hasSavedSession && instance.status === 'CONNECTED'
          ? await this.repository.updateStatus(instance.id, 'RECONNECTING', instance.qrCode)
          : instance;

      const { apiKeyEncrypted, ...safeInstance } = displayInstance as typeof displayInstance & { apiKeyEncrypted?: string | null };
      return {
        ...safeInstance,
        apiKey: decryptApiKey(apiKeyEncrypted ?? null),
        messagesToday: messagesTodayMap.get(displayInstance.id) ?? 0
      };
    }));
  }

  async create(userId: string, input: CreateInstanceInput) {
    const instance = await this.repository.create(userId, {
      name: input.name,
      phoneNumber: input.phoneNumber ?? null
    });

    // Auto-generate API key on instance creation
    const apiKey = this.createApiKeyValue(instance.id);
    const apiKeyHash = hashToken(apiKey);
    const apiKeyEncrypted = encryptApiKey(apiKey);

    await this.repository.setApiKey(instance.id, apiKeyHash, apiKeyEncrypted);
    await this.repository.createLog(instance.id, 'info', 'WhatsApp instance created. Waiting for QR scan.');
    await this.repository.createLog(instance.id, 'info', 'API key auto-generated');

    // Return instance with full API key (only shown once at creation)
    return {
      instance,
      apiKey,
      message: 'Instance created. Save API key - it will not be shown again!'
    };
  }

  async getById(userId: string, instanceId: string) {
    const instance = await this.repository.findByIdAndUser(instanceId, userId);
    if (!instance) {
      throw new AppError('Instance not found', 404);
    }
    let resolvedInstance = instance;
    if (
      !baileysManager.isRunning(instance.id) &&
      !instance.session &&
      ['CONNECTED', 'CONNECTING', 'RECONNECTING'].includes(instance.status)
    ) {
      resolvedInstance = await this.repository.updateStatus(instance.id, 'DISCONNECTED', null);
    }

    if (
      !baileysManager.isRunning(instance.id) &&
      instance.session &&
      instance.status === 'CONNECTED'
    ) {
      resolvedInstance = await this.repository.updateStatus(instance.id, 'RECONNECTING', instance.qrCode);
    }

    const { apiKeyEncrypted, ...safeInstance } = resolvedInstance as typeof resolvedInstance & { apiKeyEncrypted?: string | null };
    return {
      ...safeInstance,
      apiKey: decryptApiKey(apiKeyEncrypted ?? null)
    };
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
    const hasSavedSession = Boolean(instance.session);

    if (baileysManager.isRunning(instanceId)) {
      await baileysManager.disconnect(instanceId, { suppressReconnect: true }); // Internal cleanup, not user-initiated
    }

    await this.repository.updateStatus(instanceId, 'CONNECTING', null);
    await baileysManager.connect(instance);

    const connected = await baileysManager.waitForConnected(instanceId, hasSavedSession ? 15000 : 5000);
    if (!connected) {
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

  async disconnect(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.disconnect(instanceId, { isUserInitiated: true }); // User-initiated disconnect
    return this.repository.updateStatus(instanceId, 'DISCONNECTED', null);
  }

  async delete(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.remove(instanceId);
    await this.repository.deleteSession(instanceId);
    await this.repository.softDelete(instanceId);
  }

  async sendWebhookTest(userId: string, instanceId: string, input?: UpdateInstanceSettingsInput) {
    const instance = await this.getById(userId, instanceId);
    const settings = instance.settings
      ? {
          webhookUrl: input?.webhookUrl !== undefined ? input.webhookUrl : instance.settings.webhookUrl,
          webhookSecret: input?.webhookSecret !== undefined ? input.webhookSecret : instance.settings.webhookSecret,
          webhookRetryCount:
            input?.webhookRetryCount !== undefined ? input.webhookRetryCount : instance.settings.webhookRetryCount,
          webhookOnReceived:
            input?.webhookOnReceived !== undefined ? input.webhookOnReceived : instance.settings.webhookOnReceived,
          webhookOnCreate:
            input?.webhookOnCreate !== undefined ? input.webhookOnCreate : instance.settings.webhookOnCreate,
          webhookOnAck: input?.webhookOnAck !== undefined ? input.webhookOnAck : instance.settings.webhookOnAck,
          webhookDownloadMedia:
            input?.webhookDownloadMedia !== undefined ? input.webhookDownloadMedia : instance.settings.webhookDownloadMedia,
          webhookOnReaction:
            input?.webhookOnReaction !== undefined ? input.webhookOnReaction : instance.settings.webhookOnReaction
        }
      : null;

    const result = await webhookDispatcher.dispatchTestWebhook({
      instanceId: instance.id,
      settings,
      payload: {
        message: 'AsiaMsg webhook test',
        instanceId: instance.id,
        instanceName: instance.name
      }
    });

    return {
      instanceId: instance.id,
      instanceName: instance.name,
      webhookUrl: instance.settings?.webhookUrl ?? null,
      ...result
    };
  }

  async getQr(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    if (baileysManager.isRunning(instanceId)) {
      await baileysManager.disconnect(instanceId, { suppressReconnect: true });
    }

    await this.repository.deleteSession(instanceId);
    await this.repository.updateStatus(instanceId, 'CONNECTING', null);
    await baileysManager.connect({ ...instance, session: null }, { resetAuth: true, suppressReconnect: true });
    const qrCode = await baileysManager.waitForQr(instanceId, 60000);

    const updated = await this.repository.findByIdAndUser(instanceId, userId);
    if (!updated) {
      throw new AppError('Instance not found', 404);
    }
    if (!qrCode && !updated.qrCode) {
      throw new AppError('WhatsApp QR was not generated. Baileys disconnected before receiving QR refs. Check instance logs for statusCode.', 502);
    }
    return updated;
  }

  async getStatus(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    const runtimeStatus = baileysManager.getRuntimeStatus(instance.id);
    return {
      success: true,
      data: {
        instanceId: instance.id,
        name: instance.name,
        status: runtimeStatus ?? instance.status,
        phoneNumber: instance.phoneNumber ?? null
      }
    };
  }

  async getQrCode(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    const runtimeQr = baileysManager.getRuntimeQr(instance.id);
    const qrCode = runtimeQr ?? instance.qrCode;
    return {
      success: true,
      data: {
        instanceId: instance.id,
        qrCode: qrCode ?? null,
        expiresAt: qrCode ? new Date(Date.now() + 60_000).toISOString() : null
      }
    };
  }

  async getMe(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    const managed = (baileysManager as any).instances?.get(instance.id);
    const socketUser = managed?.socket?.user ?? null;
    return {
      success: true,
      data: {
        instanceId: instance.id,
        name: instance.name,
        phoneNumber: instance.phoneNumber ?? null,
        jid: socketUser?.id ?? null,
        pushName: socketUser?.name ?? null
      }
    };
  }

  async getSettings(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    return {
      success: true,
      data: instance.settings ?? {}
    };
  }

  async logout(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    await baileysManager.remove(instance.id);
    await this.repository.deleteSession(instanceId);
    await this.repository.updateStatus(instanceId, 'DISCONNECTED', null);
    await this.repository.createLog(instanceId, 'info', 'Instance logged out');
    return { success: true };
  }

  async restart(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    await baileysManager.disconnect(instance.id, { suppressReconnect: true });
    await this.repository.updateStatus(instanceId, 'CONNECTING', null);
    await baileysManager.connect(instance, { resetAuth: false });
    await this.repository.createLog(instanceId, 'info', 'Instance restarted');
    return { success: true };
  }

  async clearInstance(userId: string, instanceId: string) {
    await this.getById(userId, instanceId);
    await baileysManager.remove(instanceId);
    await this.repository.deleteSession(instanceId);
    await this.repository.updateStatus(instanceId, 'WAITING_QR', null);
    await this.repository.createLog(instanceId, 'info', 'Instance data cleared');
    return { success: true };
  }

  async getApiKeyInfo(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);

    return {
      success: true,
      data: {
        instanceId: instance.id,
        hasApiKey: Boolean(instance.apiKeyHash),
        apiKey: instance.apiKey ?? null,
        apiKeyCreatedAt: instance.apiKeyCreatedAt ?? null,
        apiKeyLastUsedAt: instance.apiKeyLastUsedAt ?? null
      }
    };
  }

  async regenerateApiKey(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);
    const apiKey = this.createApiKeyValue(instance.id);
    const apiKeyHash = hashToken(apiKey);
    const apiKeyEncrypted = encryptApiKey(apiKey);

    const updatedInstance = await this.repository.setApiKey(instance.id, apiKeyHash, apiKeyEncrypted);
    await this.repository.createLog(instance.id, 'info', 'Instance API key regenerated');

    return {
      success: true,
      data: {
        instanceId: updatedInstance.id,
        apiKey,
        apiKeyCreatedAt: updatedInstance.apiKeyCreatedAt
      }
    };
  }

  async revokeApiKey(userId: string, instanceId: string) {
    const instance = await this.getById(userId, instanceId);

    await this.repository.clearApiKey(instance.id);
    await this.repository.createLog(instance.id, 'info', 'Instance API key revoked');

    return { success: true };
  }

  private createApiKeyValue(instanceId: string) {
    return `asm_${instanceId}_${crypto.randomBytes(32).toString('base64url')}`;
  }

  restoreSessions() {
    return baileysManager.restoreActiveSessions();
  }
}

export const instanceService = new InstanceService();
