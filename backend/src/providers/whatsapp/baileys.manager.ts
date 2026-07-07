import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import pino from 'pino';
import QRCode from 'qrcode';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { InstanceRepository } from '../../instances/instance.repository';
import type { InstanceView } from '../../instances/instance.types';
import { emitToInstance, emitToUser } from '../../socket/socket-manager';

type ManagedInstance = {
  socket: any;
  qrCode: string | null;
};

export class BaileysManager {
  private readonly instances = new Map<string, ManagedInstance>();
  private readonly repository = new InstanceRepository();

  async connect(instance: InstanceView) {
    if (this.instances.has(instance.id)) {
      return this.instances.get(instance.id)!;
    }

    const {
      default: makeWASocket,
      DisconnectReason,
      fetchLatestBaileysVersion,
      useMultiFileAuthState
    } = await import('@whiskeysockets/baileys');

    const authPath = this.getAuthPath(instance.id);
    await mkdir(authPath, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();
    const socket = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['AsiaMsg', 'Chrome', '1.0.0']
    });

    const managed: ManagedInstance = {
      socket,
      qrCode: null
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
        await this.repository.updateStatus(instance.id, 'WAITING_QR', qrCode);
        await this.repository.createLog(instance.id, 'info', 'QR code generated');
        emitToUser(instance.userId, 'instance:qr', { instanceId: instance.id, qrCode });
        emitToInstance(instance.id, 'instance:qr', { instanceId: instance.id, qrCode });
      }

      if (update.connection === 'connecting') {
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
        const connectedNumber = socket.user?.id ?? instance.phoneNumber ?? null;
        await this.repository.update(instance.id, {
          status: 'CONNECTED',
          qrCode: null,
          phoneNumber: connectedNumber ?? undefined
        });
        await this.repository.createLog(instance.id, 'info', 'WhatsApp session connected');
        managed.qrCode = null;
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
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 408;
        const nextStatus = managed.qrCode ? 'WAITING_QR' : 'DISCONNECTED';

        this.instances.delete(instance.id);
        await this.repository.updateStatus(
          instance.id,
          shouldReconnect ? 'RECONNECTING' : nextStatus,
          managed.qrCode
        );
        await this.repository.createLog(
          instance.id,
          shouldReconnect ? 'warn' : 'info',
          shouldReconnect ? 'WhatsApp session reconnecting' : 'WhatsApp session disconnected',
          statusCode ? { statusCode } : undefined
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
  }

  async restoreActiveSessions() {
    const instances = await prisma.instance.findMany({
      where: { session: { isNot: null } },
      include: { session: true, settings: true }
    });

    for (const instance of instances) {
      void this.connect(instance);
    }
  }

  private getAuthPath(instanceId: string) {
    return path.join(process.cwd(), 'storage', 'wa', instanceId);
  }
}

export const baileysManager = new BaileysManager();
