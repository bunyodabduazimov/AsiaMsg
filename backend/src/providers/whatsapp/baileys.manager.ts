import path from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import pino from 'pino';
import QRCode from 'qrcode';
import type { InstanceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { InstanceRepository } from '../../instances/instance.repository';
import type { InstanceView } from '../../instances/instance.types';
import { emitToInstance, emitToUser } from '../../socket/socket-manager';

type ManagedInstance = {
  socket: any;
  qrCode: string | null;
  status: InstanceStatus;
};

type QrWaiter = {
  resolve: (qrCode: string | null) => void;
  timer: NodeJS.Timeout;
};

type ConnectionWaiter = {
  resolve: (connected: boolean) => void;
  timer: NodeJS.Timeout;
};

export class BaileysManager {
  private readonly instances = new Map<string, ManagedInstance>();
  private readonly qrWaiters = new Map<string, QrWaiter[]>();
  private readonly connectionWaiters = new Map<string, ConnectionWaiter[]>();
  private readonly repository = new InstanceRepository();

  async connect(instance: InstanceView) {
    if (this.instances.has(instance.id)) {
      return this.instances.get(instance.id)!;
    }

    const {
      Browsers,
      default: makeWASocket,
      DisconnectReason,
      fetchLatestBaileysVersion,
      useMultiFileAuthState
    } = await import('@whiskeysockets/baileys');

    const authPath = this.getAuthPath(instance.id);
    if (!instance.session) {
      await rm(authPath, { recursive: true, force: true });
    }
    await mkdir(authPath, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();
    const socket = makeWASocket({
      auth: state,
      version,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      qrTimeout: 60000,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('AsiaMsg')
    });

    const managed: ManagedInstance = {
      socket,
      qrCode: null,
      status: 'CONNECTING'
    };

    this.instances.set(instance.id, managed);

    socket.ev.on('creds.update', async () => {
      await saveCreds();
      await this.repository.upsertSession(instance.id, state.creds as unknown as Prisma.InputJsonValue);
    });

    socket.ev.on('connection.update', async update => {
      if (update.qr) {
        const qrCode = await QRCode.toDataURL(update.qr);
        managed.qrCode = qrCode;
        managed.status = 'WAITING_QR';
        await this.repository.updateStatus(instance.id, 'WAITING_QR', qrCode);
        await this.repository.createLog(instance.id, 'info', 'QR code generated');
        emitToUser(instance.userId, 'instance:qr', { instanceId: instance.id, qrCode });
        emitToInstance(instance.id, 'instance:qr', { instanceId: instance.id, qrCode });
        this.resolveQrWaiters(instance.id, qrCode);
      }

      if (update.connection === 'connecting') {
        managed.status = 'CONNECTING';
        await this.repository.updateStatus(instance.id, 'CONNECTING', managed.qrCode);
        emitToUser(instance.userId, 'instance:status', {
          instanceId: instance.id,
          status: 'CONNECTING'
        });
        emitToInstance(instance.id, 'instance:status', {
          instanceId: instance.id,
          status: 'CONNECTING'
        });
      }

      if (update.connection === 'open') {
        const connectedNumber = this.normalizePhoneNumber(socket.user?.id ?? instance.phoneNumber ?? null);
        await this.repository.update(instance.id, {
          status: 'CONNECTED',
          qrCode: null,
          phoneNumber: connectedNumber ?? undefined
        });
        await this.repository.createLog(instance.id, 'info', 'WhatsApp session connected');
        managed.qrCode = null;
        managed.status = 'CONNECTED';
        this.resolveConnectionWaiters(instance.id, true);
        emitToUser(instance.userId, 'instance:status', {
          instanceId: instance.id,
          status: 'CONNECTED'
        });
        emitToInstance(instance.id, 'instance:status', {
          instanceId: instance.id,
          status: 'CONNECTED'
        });
      }

      if (update.connection === 'close') {
        const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        const nextStatus = managed.qrCode ? 'WAITING_QR' : 'DISCONNECTED';

        this.instances.delete(instance.id);
        this.resolveConnectionWaiters(instance.id, false);
        if (!shouldReconnect) {
          this.resolveQrWaiters(instance.id, null);
        }
        await this.repository.updateStatus(
          instance.id,
          shouldReconnect ? 'RECONNECTING' : nextStatus,
          managed.qrCode
        );
        await this.repository.createLog(
          instance.id,
          shouldReconnect ? 'warn' : 'info',
          shouldReconnect ? 'WhatsApp session reconnecting' : 'WhatsApp session disconnected',
          {
            ...(statusCode ? { statusCode } : {}),
            message: update.lastDisconnect?.error instanceof Error
              ? update.lastDisconnect.error.message
              : undefined
          }
        );

        emitToUser(instance.userId, 'instance:status', {
          instanceId: instance.id,
          status: shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED'
        });
        emitToInstance(instance.id, 'instance:status', {
          instanceId: instance.id,
          status: shouldReconnect ? 'RECONNECTING' : nextStatus
        });

        if (shouldReconnect) {
          void this.connect(instance);
        }
      }
    });

    return managed;
  }

  async disconnect(instanceId: string) {
    const managed = this.instances.get(instanceId);
    if (!managed) {
      return;
    }

    managed.socket.end(undefined);
    this.instances.delete(instanceId);
    this.resolveQrWaiters(instanceId, null);
    this.resolveConnectionWaiters(instanceId, false);
  }

  async remove(instanceId: string) {
    await this.disconnect(instanceId);
    await rm(this.getAuthPath(instanceId), { recursive: true, force: true });
  }

  isRunning(instanceId: string) {
    return this.instances.has(instanceId);
  }

  getRuntimeStatus(instanceId: string) {
    return this.instances.get(instanceId)?.status ?? null;
  }

  getRuntimeQr(instanceId: string) {
    return this.instances.get(instanceId)?.qrCode ?? null;
  }

  async sendMessage(
    instanceId: string,
    remoteJid: string,
    payload: Record<string, unknown>
  ) {
    const managed = this.instances.get(instanceId);
    if (!managed) {
      throw new Error('WhatsApp instance is not running');
    }

    const jid = this.normalizeRemoteJid(remoteJid);
    return managed.socket.sendMessage(jid, payload);
  }

  async waitForConnected(instanceId: string, timeoutMs = 30000) {
    if (this.getRuntimeStatus(instanceId) === 'CONNECTED') {
      return true;
    }

    return new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        const waiters = this.connectionWaiters.get(instanceId) ?? [];
        this.connectionWaiters.set(
          instanceId,
          waiters.filter(waiter => waiter.resolve !== resolve)
        );
        resolve(this.getRuntimeStatus(instanceId) === 'CONNECTED');
      }, timeoutMs);

      const waiters = this.connectionWaiters.get(instanceId) ?? [];
      waiters.push({ resolve, timer });
      this.connectionWaiters.set(instanceId, waiters);
    });
  }

  async waitForQr(instanceId: string, timeoutMs = 60000) {
    const existingQr = this.getRuntimeQr(instanceId);
    if (existingQr) {
      return existingQr;
    }

    return new Promise<string | null>(resolve => {
      const timer = setTimeout(() => {
        const waiters = this.qrWaiters.get(instanceId) ?? [];
        this.qrWaiters.set(
          instanceId,
          waiters.filter(waiter => waiter.resolve !== resolve)
        );
        resolve(this.getRuntimeQr(instanceId));
      }, timeoutMs);

      const waiters = this.qrWaiters.get(instanceId) ?? [];
      waiters.push({ resolve, timer });
      this.qrWaiters.set(instanceId, waiters);
    });
  }

  private resolveQrWaiters(instanceId: string, qrCode: string | null) {
    const waiters = this.qrWaiters.get(instanceId) ?? [];
    this.qrWaiters.delete(instanceId);

    for (const waiter of waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve(qrCode);
    }
  }

  private resolveConnectionWaiters(instanceId: string, connected: boolean) {
    const waiters = this.connectionWaiters.get(instanceId) ?? [];
    this.connectionWaiters.delete(instanceId);

    for (const waiter of waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve(connected);
    }
  }

  async restoreActiveSessions() {
    const instances = await prisma.instance.findMany({
      where: { deletedAt: null, session: { isNot: null } },
      include: { session: true, settings: true }
    });

    for (const instance of instances) {
      void this.connect(instance);
    }
  }

  private getAuthPath(instanceId: string) {
    return path.join(process.cwd(), 'storage', 'wa', instanceId);
  }

  private normalizePhoneNumber(value: string | null) {
    if (!value) return null;

    const jid = value.trim();
    const base = jid.split('@')[0] ?? jid;
    const number = base.split(':')[0] ?? base;
    return number || null;
  }

  private normalizeRemoteJid(value: string) {
    const trimmed = value.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }

    const digits = trimmed.replace(/\D/g, '');
    return `${digits}@s.whatsapp.net`;
  }
}

export const baileysManager = new BaileysManager();
