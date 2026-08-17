import pino from 'pino';
import QRCode from 'qrcode';
import type { InstanceStatus, Prisma } from '@prisma/client';
import type { AuthenticationCreds, AuthenticationState, SignalDataSet } from '@whiskeysockets/baileys';
import { prisma } from '../../database';
import { InstanceRepository } from '../../instances/instance.repository';
import type { InstanceView } from '../../instances/instance.types';
import { webhookDispatcher } from '../../webhooks/webhook.dispatcher';
import { emitToInstance, emitToUser } from '../../socket/socket-manager';

type ChatEntry = {
  id: string;
  name?: string | null;
  unreadCount?: number;
  conversationTimestamp?: number | null;
  [key: string]: unknown;
};

type ContactEntry = {
  id: string;
  name?: string | null;
  notify?: string | null;
  [key: string]: unknown;
};

type ManagedInstance = {
  socket: any;
  qrCode: string | null;
  status: InstanceStatus;
  chats: Map<string, ChatEntry>;
  contacts: Map<string, ContactEntry>;
  messagesByChat: Map<string, any[]>;
};

type QrWaiter = {
  resolve: (qrCode: string | null) => void;
  timer: NodeJS.Timeout;
};

type ConnectionWaiter = {
  resolve: (connected: boolean) => void;
  timer: NodeJS.Timeout;
};

type ConnectOptions = {
  resetAuth?: boolean;
  suppressReconnect?: boolean;
};

type DisconnectOptions = {
  isUserInitiated?: boolean;
  suppressReconnect?: boolean;
};

type PersistedAuthState = {
  creds: AuthenticationCreds;
  keys: Record<string, Record<string, unknown>>;
};

const nativeImport = (specifier: string) => Function('specifier', 'return import(specifier)')(specifier) as Promise<{
  default: typeof import('@whiskeysockets/baileys').default;
  DisconnectReason: typeof import('@whiskeysockets/baileys').DisconnectReason;
  fetchLatestBaileysVersion: typeof import('@whiskeysockets/baileys').fetchLatestBaileysVersion;
  BufferJSON: typeof import('@whiskeysockets/baileys').BufferJSON;
  initAuthCreds: typeof import('@whiskeysockets/baileys').initAuthCreds;
  proto: typeof import('@whiskeysockets/baileys').proto;
}>;

export class BaileysManager {
  private readonly instances = new Map<string, ManagedInstance>();
  private readonly connectionTokens = new Map<string, number>();
  private readonly manualDisconnects = new Set<string>();
  private readonly reconnectSuppressed = new Set<string>();
  private readonly qrWaiters = new Map<string, QrWaiter[]>();
  private readonly connectionWaiters = new Map<string, ConnectionWaiter[]>();
  private readonly repository = new InstanceRepository();

  async connect(instance: InstanceView, options: ConnectOptions = {}) {
    if (this.instances.has(instance.id)) {
      return this.instances.get(instance.id)!;
    }

    if (options.suppressReconnect) {
      this.reconnectSuppressed.add(instance.id);
    }

    const connectionToken = (this.connectionTokens.get(instance.id) ?? 0) + 1;
    this.connectionTokens.set(instance.id, connectionToken);

    const {
      default: makeWASocket,
      DisconnectReason,
      fetchLatestBaileysVersion
    } = await nativeImport('@whiskeysockets/baileys');

    const shouldResetAuth = options.resetAuth ?? !instance.session;
    const { state, saveCreds } = await this.createDatabaseAuthState(instance.id, shouldResetAuth);
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
      browser: ['ChatAPI', 'Ubuntu', '1.0.0']
    });

    const managed: ManagedInstance = {
      socket,
      qrCode: null,
      status: 'CONNECTING',
      chats: new Map(),
      contacts: new Map(),
      messagesByChat: new Map()
    };

    this.instances.set(instance.id, managed);

    socket.ev.on('creds.update', async () => {
      await saveCreds();
    });

    socket.ev.on('chats.upsert', (newChats: any[]) => {
      for (const chat of newChats) {
        const id = chat?.id ?? chat?.jid;
        if (id) {
          managed.chats.set(String(id), chat as ChatEntry);
        }
      }
    });

    socket.ev.on('chats.update', (updates: any[]) => {
      for (const update of updates) {
        const id = update?.id ?? update?.jid;
        if (id) {
          const key = String(id);
          const existing = managed.chats.get(key) ?? {} as ChatEntry;
          managed.chats.set(key, { ...existing, ...update } as ChatEntry);
        }
      }
    });

    socket.ev.on('chats.delete', (deletedIds: string[]) => {
      for (const id of deletedIds) {
        managed.chats.delete(id);
      }
    });

    socket.ev.on('contacts.upsert', (newContacts: any[]) => {
      for (const contact of newContacts) {
        const id = contact?.id ?? contact?.jid;
        if (id) {
          managed.contacts.set(String(id), contact as ContactEntry);
        }
      }
    });

    socket.ev.on('contacts.update', (updates: any[]) => {
      for (const update of updates) {
        const id = update?.id ?? update?.jid;
        if (id) {
          const key = String(id);
          const existing = managed.contacts.get(key) ?? {} as ContactEntry;
          managed.contacts.set(key, { ...existing, ...update } as ContactEntry);
        }
      }
    });

    socket.ev.on('messaging-history.set', (history: any) => {
      const chats = Array.isArray(history?.chats) ? history.chats : [];
      for (const chat of chats) {
        const id = chat?.id ?? chat?.jid;
        if (id) {
          managed.chats.set(String(id), chat as ChatEntry);
        }
      }

      const contacts = Array.isArray(history?.contacts) ? history.contacts : [];
      for (const contact of contacts) {
        const id = contact?.id ?? contact?.jid;
        if (id) {
          managed.contacts.set(String(id), contact as ContactEntry);
        }
      }

      const messages = Array.isArray(history?.messages) ? history.messages : [];
      for (const message of messages) {
        this.pushMessageToRuntimeCache(managed, message);
      }
    });

    socket.ev.on('messages.upsert', (upsert: any) => {
      const messages = Array.isArray(upsert?.messages) ? upsert.messages : [];
      for (const message of messages) {
        this.pushMessageToRuntimeCache(managed, message);
      }
      void this.handleMessagesUpsert(instance, upsert).catch(async error => {
        await this.repository.createLog(instance.id, 'error', 'Failed to handle incoming WhatsApp message', {
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    });

    socket.ev.on('messages.update', (updates: any) => {
      void this.handleMessagesUpdate(instance, updates).catch(async error => {
        await this.repository.createLog(instance.id, 'error', 'Failed to handle WhatsApp message update', {
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    });

    socket.ev.on('message-receipt.update', (updates: any) => {
      void this.handleMessagesUpdate(instance, updates).catch(async error => {
        await this.repository.createLog(instance.id, 'error', 'Failed to handle WhatsApp receipt update', {
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    });

    socket.ev.on('connection.update', async update => {
      if (!this.isCurrentConnection(instance.id, connectionToken)) {
        return;
      }

      if (update.qr) {
        const qrCode = await QRCode.toDataURL(update.qr);
        if (!this.isCurrentConnection(instance.id, connectionToken)) {
          return;
        }
        managed.qrCode = qrCode;
        managed.status = 'WAITING_QR';
        await this.repository.updateStatus(instance.id, 'WAITING_QR', qrCode);
        await this.repository.createLog(instance.id, 'info', 'QR code generated');
        emitToUser(instance.userId, 'instance:qr', { instanceId: instance.id, qrCode });
        emitToInstance(instance.id, 'instance:qr', { instanceId: instance.id, qrCode });
        this.resolveQrWaiters(instance.id, qrCode);
      }

      if (update.connection === 'connecting') {
        if (!this.isCurrentConnection(instance.id, connectionToken)) {
          return;
        }
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
        if (!this.isCurrentConnection(instance.id, connectionToken)) {
          return;
        }
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
        if (!this.isCurrentConnection(instance.id, connectionToken)) {
          return;
        }

        const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
        const wasManuallyDisconnected = this.manualDisconnects.has(instance.id);
        const reconnectWasSuppressed = this.reconnectSuppressed.has(instance.id);

        if (wasManuallyDisconnected) {
          this.manualDisconnects.delete(instance.id);
        }
        if (reconnectWasSuppressed) {
          this.reconnectSuppressed.delete(instance.id);
        }

        const autoReconnectEnabled = instance.settings?.autoReconnect !== false;
        const shouldReconnect =
          autoReconnectEnabled &&
          !wasManuallyDisconnected &&
          !reconnectWasSuppressed &&
          statusCode !== DisconnectReason.loggedOut;
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
          void this.connect(instance, { resetAuth: false });
        }
      }
    });

    return managed;
  }

  async disconnect(instanceId: string, options: DisconnectOptions = {}) {
    const managed = this.instances.get(instanceId);
    if (!managed) {
      return;
    }

    if (options.isUserInitiated) {
      this.manualDisconnects.add(instanceId);
    }
    if (options.suppressReconnect) {
      this.reconnectSuppressed.add(instanceId);
    }

    managed.socket.end(undefined);
    this.instances.delete(instanceId);
    this.resolveQrWaiters(instanceId, null);
    this.resolveConnectionWaiters(instanceId, false);
  }

  async remove(instanceId: string) {
    await this.disconnect(instanceId, { suppressReconnect: true });
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

  getChats(instanceId: string): ChatEntry[] {
    return Array.from(this.instances.get(instanceId)?.chats.values() ?? []);
  }

  getContacts(instanceId: string): ContactEntry[] {
    return Array.from(this.instances.get(instanceId)?.contacts.values() ?? []);
  }

  getChatMessages(instanceId: string, chatId: string, limit = 50): any[] {
    const normalizedChatId = String(chatId).trim();
    const items = this.instances.get(instanceId)?.messagesByChat.get(normalizedChatId) ?? [];
    if (!items.length) return [];
    return items.slice(-limit).reverse();
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

  private isCurrentConnection(instanceId: string, token: number) {
    return this.connectionTokens.get(instanceId) === token;
  }

  private pushMessageToRuntimeCache(managed: ManagedInstance, message: any) {
    const chatId = message?.key?.remoteJid ? String(message.key.remoteJid) : null;
    if (!chatId) {
      return;
    }

    if (!managed.chats.has(chatId)) {
      managed.chats.set(chatId, { id: chatId });
    }

    const current = managed.messagesByChat.get(chatId) ?? [];
    current.push(message);

    if (current.length > 500) {
      current.splice(0, current.length - 500);
    }

    managed.messagesByChat.set(chatId, current);
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

  private async createDatabaseAuthState(instanceId: string, resetAuth: boolean) {
    const baileys = await nativeImport('@whiskeysockets/baileys');
    const BufferJSON = baileys.BufferJSON;
    const initAuthCreds = baileys.initAuthCreds;
    const proto = baileys.proto;

    let persistedState: PersistedAuthState;

    if (resetAuth) {
      await this.repository.deleteSession(instanceId);
      persistedState = {
        creds: initAuthCreds(),
        keys: {}
      };
    } else {
      const session = await prisma.instanceSession.findUnique({
        where: { instanceId }
      });

      if (!session?.authState) {
        persistedState = {
          creds: initAuthCreds(),
          keys: {}
        };
      } else {
        const revived = JSON.parse(JSON.stringify(session.authState), BufferJSON.reviver) as Partial<PersistedAuthState>;
        persistedState = {
          creds: (revived.creds ?? initAuthCreds()) as AuthenticationCreds,
          keys: (revived.keys ?? {}) as Record<string, Record<string, unknown>>
        };
      }
    }

    const saveState = async () => {
      await this.repository.upsertSession(instanceId, JSON.parse(JSON.stringify(persistedState, BufferJSON.replacer)) as Prisma.InputJsonValue);
    };

    const state: AuthenticationState = {
      creds: persistedState.creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const result: Record<string, any> = {};

          for (const id of ids) {
            let data: unknown = persistedState.keys[`${type}-${id}`];

            if (type === 'app-state-sync-key' && data) {
              data = proto.Message.AppStateSyncKeyData.fromObject(data as Record<string, unknown>);
            }

            result[id] = data ?? null;
          }

          return result;
        },
        set: async (newData: SignalDataSet) => {
          let changed = false;

          for (const category of Object.keys(newData)) {
            const bucket = newData[category as keyof SignalDataSet] ?? {};
            for (const id of Object.keys(bucket)) {
              const value = bucket[id as keyof typeof bucket];
              const key = `${category}-${id}`;

              if (value) {
                persistedState.keys[key] = value as Record<string, unknown>;
              } else {
                delete persistedState.keys[key];
              }

              changed = true;
            }
          }

          if (changed) {
            await saveState();
          }
        }
      }
    };

    const saveCreds = async () => {
      await saveState();
    };

    await saveState();

    return { state, saveCreds };
  }

  private async handleMessagesUpsert(instance: InstanceView, upsert: any) {
    const messages = Array.isArray(upsert?.messages) ? upsert.messages : [];
    if (!messages.length) return;

    if (upsert?.type && !['notify', 'append'].includes(upsert.type)) {
      return;
    }

    for (const rawMessage of messages) {
      if (rawMessage?.key?.fromMe) {
        continue;
      }

      if (rawMessage?.key?.remoteJid === 'status@broadcast') {
        continue;
      }

      const remoteJid = String(rawMessage?.key?.remoteJid || '').trim();
      if (!remoteJid) {
        continue;
      }

      const messageId = rawMessage?.key?.id ? String(rawMessage.key.id) : null;
      if (!messageId) {
        continue;
      }

      const sentAt = this.normalizeTimestamp(rawMessage?.messageTimestamp);
      const payload = this.buildIncomingMessagePayload(rawMessage);

      const existing = await prisma.message.findFirst({
        where: {
          instanceId: instance.id,
          messageId,
          direction: 'inbound'
        }
      });

      const savedMessage = existing ?? await prisma.message.create({
        data: {
          instanceId: instance.id,
          direction: 'inbound',
          remoteJid,
          messageId,
          payload,
          status: 'received',
          sentAt
        }
      });

      await webhookDispatcher.dispatchMessageReceived({
        instanceId: instance.id,
        settings: instance.settings,
        messageId: savedMessage.messageId,
        remoteJid,
        sentAt: savedMessage.sentAt,
        payload
      });

      if ((payload as { hasMedia?: boolean }).hasMedia) {
        await webhookDispatcher.dispatchMediaDownload({
          instanceId: instance.id,
          settings: instance.settings,
          messageId: savedMessage.messageId,
          remoteJid,
          sentAt: savedMessage.sentAt,
          payload
        });
      }
    }
  }

  private async handleMessagesUpdate(instance: InstanceView, updates: any) {
    const items = Array.isArray(updates) ? updates : [];
    if (!items.length) return;

    for (const update of items) {
      const key = update?.key ?? {};
      const messageId = key?.id ? String(key.id) : null;
      const remoteJid = key?.remoteJid ? String(key.remoteJid) : '';
      const sentAt = this.normalizeTimestamp(update?.messageTimestamp ?? update?.timestamp);

      if (update?.reaction || update?.message?.reactionMessage) {
        const reaction = update?.reaction?.text
          ?? update?.message?.reactionMessage?.text
          ?? update?.message?.reactionMessage?.emoji
          ?? null;

        await webhookDispatcher.dispatchMessageReaction({
          instanceId: instance.id,
          settings: instance.settings,
          messageId,
          remoteJid,
          reaction,
          sentAt,
          payload: this.buildReactionPayload(update)
        });
      }

      if (typeof update?.status !== 'undefined' || typeof update?.ack !== 'undefined' || typeof update?.receipt !== 'undefined') {
        const ack = update?.ack ?? update?.status ?? update?.receipt?.type ?? update?.receipt?.status ?? null;

        if (messageId) {
          await prisma.message.updateMany({
            where: {
              instanceId: instance.id,
              messageId,
              direction: 'outbound'
            },
            data: {
              status: ack === null ? undefined : String(ack)
            }
          });
        }

        await webhookDispatcher.dispatchMessageAck({
          instanceId: instance.id,
          settings: instance.settings,
          messageId,
          remoteJid,
          ack: ack === null ? null : String(ack),
          sentAt,
          payload: this.buildAckPayload(update)
        });
      }
    }
  }

  private normalizeTimestamp(value: unknown) {
    if (!value) return new Date();

    const raw = typeof value === 'object' && value !== null && 'low' in value
      ? Number((value as { low?: number }).low)
      : Number(value);

    if (!Number.isFinite(raw) || raw <= 0) {
      return new Date();
    }

    return new Date(raw > 1_000_000_000_000 ? raw : raw * 1000);
  }

  private buildIncomingMessagePayload(message: any): Prisma.InputJsonValue {
    const messageContent = message?.message || {};
    const text =
      messageContent?.conversation ||
      messageContent?.extendedTextMessage?.text ||
      messageContent?.imageMessage?.caption ||
      messageContent?.videoMessage?.caption ||
      messageContent?.documentMessage?.caption ||
      messageContent?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      messageContent?.buttonsResponseMessage?.selectedDisplayText ||
      null;

    return {
      messageType: this.detectIncomingMessageType(messageContent),
      text,
      fromMe: Boolean(message?.key?.fromMe),
      hasMedia: this.hasMediaMessage(messageContent),
      raw: {
        key: {
          id: message?.key?.id ?? null,
          remoteJid: message?.key?.remoteJid ?? null,
          fromMe: Boolean(message?.key?.fromMe)
        }
      }
    } as Prisma.InputJsonValue;
  }

  private buildAckPayload(update: any): Prisma.InputJsonValue {
    return {
      key: update?.key
        ? {
            id: update.key.id ?? null,
            remoteJid: update.key.remoteJid ?? null,
            fromMe: Boolean(update.key.fromMe)
          }
        : null,
      ack: update?.ack ?? null,
      status: update?.status ?? null,
      receipt: update?.receipt ?? null
    } as Prisma.InputJsonValue;
  }

  private buildReactionPayload(update: any): Prisma.InputJsonValue {
    return {
      key: update?.key
        ? {
            id: update.key.id ?? null,
            remoteJid: update.key.remoteJid ?? null,
            fromMe: Boolean(update.key.fromMe)
          }
        : null,
      reaction: update?.reaction ?? update?.message?.reactionMessage ?? null
    } as Prisma.InputJsonValue;
  }

  private detectIncomingMessageType(messageContent: Record<string, any>) {
    if (messageContent?.conversation || messageContent?.extendedTextMessage) return 'text';
    if (messageContent?.imageMessage) return 'image';
    if (messageContent?.documentMessage) return 'document';
    if (messageContent?.videoMessage) return 'video';
    if (messageContent?.audioMessage) return 'audio';
    if (messageContent?.stickerMessage) return 'sticker';
    if (messageContent?.contactMessage) return 'contact';
    if (messageContent?.locationMessage) return 'location';
    return 'unknown';
  }

  private hasMediaMessage(messageContent: Record<string, any>) {
    return Boolean(
      messageContent?.imageMessage ||
      messageContent?.documentMessage ||
      messageContent?.videoMessage ||
      messageContent?.audioMessage ||
      messageContent?.stickerMessage
    );
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
