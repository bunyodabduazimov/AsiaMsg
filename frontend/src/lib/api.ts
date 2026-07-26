import type { ApiToken, Instance, LogEntry, Message, Webhook } from '../types';

const STORAGE_KEYS = {
  apiBaseUrl: 'chatapi.apiBaseUrl',
  accessToken: 'chatapi.accessToken',
  refreshToken: 'chatapi.refreshToken'
} as const;

export type BackendRole = 'USER' | 'ADMIN';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

export interface BackendInstance {
  id: string;
  name: string;
  phoneNumber: string | null;
  apiKey?: string | null;
  messagesToday?: number;
  status: 'WAITING_QR' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  qrCode?: string | null;
  qrExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  settings?: {
    webhookUrl?: string | null;
    webhookRetryCount?: number | null;
    webhookOnReceived?: boolean | null;
    webhookOnCreate?: boolean | null;
    webhookOnAck?: boolean | null;
    webhookDownloadMedia?: boolean | null;
    webhookOnReaction?: boolean | null;
    subscriptionPlan?: string | null;
    subscriptionTrialStartedAt?: string | null;
    subscriptionTrialEndsAt?: string | null;
  } | null;
}

export interface BackendMessage {
  id: string;
  instanceId: string;
  direction: string;
  remoteJid: string;
  messageId: string | null;
  payload: unknown;
  status: string | null;
  sentAt: string | null;
  createdAt: string;
  instance?: {
    id: string;
    name: string;
  };
}

export interface CreateBackendMessageInput {
  instanceId: string;
  remoteJid: string;
  messageText: string;
  messageType: 'text' | 'file' | 'image' | 'document';
  imageUrl?: string;
  documentUrl?: string;
  fileName?: string;
  attachment?: {
    name: string;
    type: string;
    size: number;
    dataBase64?: string;
  } | null;
}

export interface BackendApiToken {
  id: string;
  instanceId: string;
  tokenHash: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  instance?: {
    id: string;
    name: string;
  };
}

export interface BackendWebhookLog {
  id: string;
  instanceId: string;
  eventType: string;
  targetUrl: string;
  statusCode: number | null;
  requestBody: unknown;
  responseBody: unknown;
  error: string | null;
  createdAt: string;
  instance?: {
    id: string;
    name: string;
  };
}

export interface BackendInstanceLog {
  id: string;
  instanceId: string;
  level: string;
  message: string;
  meta: unknown;
  createdAt: string;
  instance?: {
    id: string;
    name: string;
  };
}

export interface BackendDashboardData {
  user: BackendUser;
  instances: BackendInstance[];
  messages: BackendMessage[];
  tokens: BackendApiToken[];
  webhookLogs: BackendWebhookLog[];
  logs: BackendInstanceLog[];
  stats: {
    instances: number;
    messages: number;
    tokens: number;
    webhookLogs: number;
    logs: number;
  };
}

export interface BackendLoginInput {
  apiBaseUrl: string;
  email: string;
  password: string;
}

export interface BackendRegisterInput extends BackendLoginInput {
  name: string;
}

export interface BackendGoogleLoginInput {
  apiBaseUrl: string;
  idToken: string;
}

export interface BackendConnectionInfo {
  apiBaseUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface BackendInstanceInput {
  name: string;
  phoneNumber?: string | null;
}

export interface BackendCreatedInstanceResponse {
  instance: Instance;
  apiKey: string | null;
  message: string | null;
}

export interface BackendInstanceSettingsInput {
  webhookUrl?: string | null;
  webhookRetryCount?: number;
  webhookOnReceived?: boolean;
  webhookOnCreate?: boolean;
  webhookOnAck?: boolean;
  webhookDownloadMedia?: boolean;
  webhookOnReaction?: boolean;
}

export interface BackendWebhookTestResult {
  instanceId: string;
  instanceName: string;
  webhookUrl: string | null;
  statusCode: number | null;
  responseBody: unknown;
  errorMessage: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getDefaultApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return normalizeApiBaseUrl(configured || 'http://localhost:4000');
};

export const normalizeApiBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const readStoredConnection = (): BackendConnectionInfo => {
  if (typeof window === 'undefined') {
    return {
      apiBaseUrl: getDefaultApiBaseUrl(),
      accessToken: null,
      refreshToken: null
    };
  }

  return {
    apiBaseUrl: getDefaultApiBaseUrl(),
    accessToken: window.localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: window.localStorage.getItem(STORAGE_KEYS.refreshToken)
  };
};

export const persistConnection = (connection: BackendConnectionInfo) => {
  window.localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);

  if (connection.accessToken) {
    window.localStorage.setItem(STORAGE_KEYS.accessToken, connection.accessToken);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  }

  if (connection.refreshToken) {
    window.localStorage.setItem(STORAGE_KEYS.refreshToken, connection.refreshToken);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
};

export const clearStoredConnection = () => {
  window.localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
  window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
};

const extractApiErrorMessage = (rawBody: string, status: number) => {
  const fallback = `Request failed with ${status}`;
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) return fallback;

  try {
    const parsed = JSON.parse(trimmedBody) as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
    };

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (typeof parsed.details === 'string' && parsed.details.trim()) {
      return parsed.details.trim();
    }
  } catch {
    return trimmedBody;
  }

  return fallback;
};

export const fetchJson = async <T,>(
  apiBaseUrl: string,
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<T> => {
  const response = await fetch(`${normalizeApiBaseUrl(apiBaseUrl)}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const message = extractApiErrorMessage(body, response.status);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const loginToBackend = (input: BackendLoginInput) =>
  fetchJson<AuthSession>(input.apiBaseUrl, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password
    })
  });

export const registerToBackend = (input: BackendRegisterInput) =>
  fetchJson<AuthSession>(input.apiBaseUrl, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password
    })
  });

export const loginWithGoogleToBackend = (input: BackendGoogleLoginInput) =>
  fetchJson<AuthSession>(input.apiBaseUrl, '/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken: input.idToken
    })
  });

export const fetchCurrentUser = (apiBaseUrl: string, accessToken: string) =>
  fetchJson<BackendUser>(apiBaseUrl, '/api/auth/me', {}, accessToken);

export const fetchDashboard = (apiBaseUrl: string, accessToken: string) =>
  fetchJson<BackendDashboardData>(apiBaseUrl, '/api/dashboard', {}, accessToken);

export const fetchInstances = (apiBaseUrl: string, accessToken: string) =>
  fetchJson<BackendInstance[]>(apiBaseUrl, '/api/instances', {}, accessToken).then(items =>
    items.map(mapBackendInstanceToUi)
  );

export const fetchAllMessages = (apiBaseUrl: string, accessToken: string) =>
  fetchJson<{ success: boolean; data: BackendMessage[] }>(apiBaseUrl, '/api/messages/all', {}, accessToken).then(response =>
    response.data.map(mapBackendMessageToUi)
  );

export const fetchBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}`, {}, accessToken).then(mapBackendInstanceToUi);

export const createBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  input: BackendInstanceInput
) : Promise<BackendCreatedInstanceResponse> =>
  fetchJson<BackendCreatedInstanceResponse>(apiBaseUrl, '/api/instances', {
    method: 'POST',
    body: JSON.stringify(input)
  }, accessToken).then(response => ({
    instance: mapBackendInstanceToUi(response.instance as unknown as BackendInstance),
    apiKey: response.apiKey,
    message: response.message
  }));

export const updateBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string,
  input: BackendInstanceInput
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  }, accessToken).then(mapBackendInstanceToUi);

export const updateBackendInstanceSettings = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string,
  input: BackendInstanceSettingsInput
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  }, accessToken).then(mapBackendInstanceToUi);

export const sendBackendInstanceWebhookTest = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string,
  input: BackendInstanceSettingsInput
) =>
  fetchJson<BackendWebhookTestResult>(apiBaseUrl, `/api/instances/${instanceId}/webhook-test`, {
    method: 'POST',
    body: JSON.stringify(input)
  }, accessToken);

export const updateBackendInstanceStatus = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string,
  status: BackendInstance['status'],
  qrCode?: string | null
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      ...(qrCode !== undefined ? { qrCode } : {})
    })
  }, accessToken).then(mapBackendInstanceToUi);

export const connectBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}/connect`, {
    method: 'POST'
  }, accessToken).then(mapBackendInstanceToUi);

export const disconnectBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}/disconnect`, {
    method: 'POST'
  }, accessToken).then(mapBackendInstanceToUi);

export const logoutBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<{ success: boolean }>(apiBaseUrl, `/api/instances/${instanceId}/logout`, {
    method: 'POST'
  }, accessToken);

export const deleteBackendInstance = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<void>(apiBaseUrl, `/api/instances/${instanceId}`, {
    method: 'DELETE'
  }, accessToken);

export const fetchBackendInstanceQr = (
  apiBaseUrl: string,
  accessToken: string,
  instanceId: string
) =>
  fetchJson<BackendInstance>(apiBaseUrl, `/api/instances/${instanceId}/qr`, {}, accessToken).then(item => {
    const mapped = mapBackendInstanceToUi(item);
    return {
      ...mapped,
      qrExpiresAt: item.qrExpiresAt ?? (item.qrCode ? new Date(Date.now() + 60000).toISOString() : undefined)
    };
  });

export const sendBackendMessage = (
  apiBaseUrl: string,
  accessToken: string,
  input: CreateBackendMessageInput
) =>
  fetchJson<BackendMessage>(apiBaseUrl, '/api/messages', {
    method: 'POST',
    body: JSON.stringify(input)
  }, accessToken);

export const mapBackendInstanceToUi = (item: BackendInstance): Instance => {
  const number = formatPhoneNumber(item.phoneNumber) || '—';
  const updatedAt = new Date(item.updatedAt);
  const createdAt = new Date(item.createdAt);

  return {
    id: item.id,
    name: item.name,
    number,
    provider: 'Baileys',
    apiKey: item.apiKey ?? null,
    subscriptionPlan: item.settings?.subscriptionPlan ?? 'Unlimited',
    subscriptionTrialStartedAt: item.settings?.subscriptionTrialStartedAt ?? null,
    subscriptionTrialEndsAt: item.settings?.subscriptionTrialEndsAt ?? null,
    status: mapBackendStatusToUi(item.status),
    lastActive: formatRelativeTime(updatedAt),
    messagesToday: item.messagesToday ?? 0,
    qrCode: item.qrCode || '',
    qrExpiresAt: item.qrExpiresAt || undefined,
    webhookUrl: item.settings?.webhookUrl || undefined,
    webhookRetryCount: item.settings?.webhookRetryCount ?? 3,
    webhookOnReceived: item.settings?.webhookOnReceived ?? false,
    webhookOnCreate: item.settings?.webhookOnCreate ?? false,
    webhookOnAck: item.settings?.webhookOnAck ?? false,
    webhookDownloadMedia: item.settings?.webhookDownloadMedia ?? false,
    webhookOnReaction: item.settings?.webhookOnReaction ?? false,
    createdDate: formatDateTime(createdAt)
  };
};

const formatPhoneNumber = (value: string | null) => {
  if (!value) return '';

  const trimmed = value.trim();
  const base = trimmed.split('@')[0] ?? trimmed;
  return base.split(':')[0] ?? base;
};

export const mapBackendStatusToUi = (status: BackendInstance['status']): Instance['status'] => {
  switch (status) {
    case 'WAITING_QR':
      return 'Waiting QR';
    case 'CONNECTING':
      return 'Reconnecting';
    case 'CONNECTED':
      return 'Connected';
    case 'DISCONNECTED':
      return 'Disconnected';
    case 'RECONNECTING':
      return 'Reconnecting';
    default:
      return 'Disconnected';
  }
};

const directionToType = (direction: string): Message['type'] =>
  direction.toLowerCase().includes('out') ? 'Исходящее' : 'Входящее';

const statusToUiMessageStatus = (status: string | null): Message['status'] => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('delivered') || normalized.includes('sent')) return 'Доставлено';
  if (normalized.includes('queued')) return 'В очереди';
  if (normalized.includes('error') || normalized.includes('failed')) return 'Ошибка';
  return 'Отправлено';
};

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const formatDateOnly = (value: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(value);

const extractMessageContentType = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return 'other';
  }

  const data = payload as Record<string, unknown>;
  const request = data.request && typeof data.request === 'object' ? (data.request as Record<string, unknown>) : null;
  const raw = data.raw && typeof data.raw === 'object' ? (data.raw as Record<string, unknown>) : null;
  const rawMessage = raw?.message && typeof raw.message === 'object' ? (raw.message as Record<string, unknown>) : null;

  const typeValue = readText(data.messageType) || readText(request?.type);
  const normalizedType = typeValue.toLowerCase();

  if (
    normalizedType.includes('text') ||
    Boolean(readText(request?.text)) ||
    Boolean(readText(data.text)) ||
    Boolean(readText(data.conversation))
  ) {
    return 'text';
  }

  if (normalizedType.includes('image') || rawMessage?.imageMessage || request?.imageUrl) {
    return 'image';
  }

  if (normalizedType.includes('voice')) {
    return 'voice';
  }

  if (normalizedType.includes('audio')) {
    return 'voice';
  }

  if (normalizedType.includes('document') || rawMessage?.documentMessage || request?.documentUrl || request?.fileName) {
    return 'document';
  }

  if (normalizedType.includes('sticker') || rawMessage?.stickerMessage || request?.stickerUrl) {
    return 'sticker';
  }

  if (normalizedType.includes('video') || rawMessage?.videoMessage || request?.videoUrl) {
    return 'other';
  }

  if (normalizedType.includes('contact') || normalizedType.includes('location') || normalizedType.includes('reaction')) {
    return 'other';
  }

  if (data.hasMedia === true || request?.attachment) {
    return 'other';
  }

  return normalizedType ? 'other' : 'other';
};

const extractMessageText = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;
  const request = data.request && typeof data.request === 'object' ? (data.request as Record<string, unknown>) : null;
  const raw = data.raw && typeof data.raw === 'object' ? (data.raw as Record<string, unknown>) : null;
  const rawMessage = raw?.message && typeof raw.message === 'object' ? (raw.message as Record<string, unknown>) : null;
  const whatsappResponse = data.whatsappResponse && typeof data.whatsappResponse === 'object'
    ? (data.whatsappResponse as Record<string, unknown>)
    : null;

  const candidate = [
    readText(data.text),
    readText(data.conversation),
    readText(data.caption),
    readText(data.message),
    readText(request?.text),
    readText(request?.conversation),
    readText(request?.caption),
    readText(rawMessage?.conversation),
    readText((rawMessage?.extendedTextMessage as Record<string, unknown> | undefined)?.text),
    readText((rawMessage?.imageMessage as Record<string, unknown> | undefined)?.caption),
    readText((rawMessage?.videoMessage as Record<string, unknown> | undefined)?.caption),
    readText((rawMessage?.documentMessage as Record<string, unknown> | undefined)?.caption),
    readText(whatsappResponse?.text)
  ].find(Boolean);

  if (candidate) {
    return candidate;
  }

  const attachmentLabel =
    readText(request?.fileName) ||
    readText((request?.attachment as Record<string, unknown> | undefined)?.name) ||
    readText(request?.imageUrl) ||
    readText(request?.documentUrl) ||
    readText(request?.audioUrl) ||
    readText(request?.voiceUrl) ||
    readText(request?.videoUrl) ||
    readText(request?.stickerUrl);

  if (attachmentLabel) {
    return attachmentLabel;
  }

  const messageType = readText(data.messageType) || readText(request?.type);
  if (messageType) {
    const typeLabelMap: Record<string, string> = {
      text: 'Текстовое сообщение',
      image: 'Изображение',
      document: 'Документ',
      audio: 'Аудио',
      voice: 'Голосовое',
      video: 'Видео',
      sticker: 'Стикер',
      contact: 'Контакт',
      location: 'Локация',
      reaction: 'Реакция',
      ack: 'Статус сообщения',
      unknown: 'Сообщение'
    };

    return typeLabelMap[messageType.toLowerCase()] || `Сообщение (${messageType})`;
  }

  if (
    data.hasMedia === true ||
    request?.attachment ||
    request?.imageUrl ||
    request?.documentUrl ||
    request?.audioUrl ||
    request?.voiceUrl ||
    request?.videoUrl ||
    request?.stickerUrl
  ) {
    return 'Сообщение с вложением';
  }

  return 'Сообщение';
};

const describeMessageData = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;
  const request = data.request && typeof data.request === 'object' ? (data.request as Record<string, unknown>) : null;
  const attachment = request?.attachment && typeof request.attachment === 'object'
    ? (request.attachment as Record<string, unknown>)
    : null;

  const attachmentName = readText(attachment?.name);
  const attachmentType = readText(attachment?.type);
  const messageType = readText(data.messageType) || readText(request?.type);

  if (attachmentName && attachmentType) {
    return `${attachmentName} · ${attachmentType}`;
  }

  if (attachmentName) {
    return attachmentName;
  }

  if (attachmentType) {
    return attachmentType;
  }

  if (messageType) {
    return messageType;
  }

  if (data.hasMedia === true) {
    return 'media';
  }

  return '';
};

export const mapBackendMessageToUi = (item: BackendMessage): Message => ({
  id: item.id,
  number: item.remoteJid,
  instance: item.instance?.name || item.instanceId,
  instanceId: item.instanceId,
  type: directionToType(item.direction),
  status: statusToUiMessageStatus(item.status),
  time: formatDateTime(new Date(item.sentAt || item.createdAt)),
  dataDate: formatDateOnly(new Date(item.sentAt || item.createdAt)),
  contentType: extractMessageContentType(item.payload),
  messageText: extractMessageText(item.payload),
  details: item.messageId || item.remoteJid,
  attachmentName: (() => {
    const payload = item.payload as Record<string, unknown> | null;
    const attachment = payload && typeof payload === 'object' ? payload.attachment as Record<string, unknown> | undefined : undefined;
    return typeof attachment?.name === 'string' ? attachment.name : undefined;
  })(),
  attachmentType: (() => {
    const payload = item.payload as Record<string, unknown> | null;
    const attachment = payload && typeof payload === 'object' ? payload.attachment as Record<string, unknown> | undefined : undefined;
    return typeof attachment?.type === 'string' ? attachment.type : undefined;
  })(),
  attachmentData: describeMessageData(item.payload),
  statusHistory: []
});

const tokenStatusFromDb = (item: BackendApiToken): ApiToken['status'] => {
  if (!item.expiresAt) {
    return 'Активен';
  }

  const expiresAt = new Date(item.expiresAt).getTime();
  const now = Date.now();
  if (expiresAt < now) {
    return 'Отозван';
  }

  const diffDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return 'Истекает скоро';
  }

  return 'Активен';
};

export const mapBackendTokenToUi = (item: BackendApiToken): ApiToken => ({
  id: item.id,
  name: item.name,
  instance: item.instance?.name || item.instanceId,
  scopes: item.tokenHash ? ['messages:send'] : [],
  lastUsed: item.lastUsedAt ? formatDateTime(new Date(item.lastUsedAt)) : '—',
  created: formatDateTime(new Date(item.createdAt)),
  expires: item.expiresAt ? formatDateTime(new Date(item.expiresAt)) : '—',
  status: tokenStatusFromDb(item),
  tokenKey: item.tokenHash,
  messagesCount: 0,
  webhooksCalled: 0
});

const webhookStatusFromDb = (statusCode: number | null, hasUrl: boolean): Webhook['status'] => {
  if (!hasUrl) return 'Пауза';
  if (statusCode && statusCode >= 400) return 'Ошибка';
  return 'Активен';
};

export const buildWebhookItems = (instances: BackendInstance[], items: BackendWebhookLog[]): Webhook[] => {
  const grouped = new Map<string, BackendWebhookLog[]>();

  for (const log of items) {
    const current = grouped.get(log.instanceId) || [];
    current.push(log);
    grouped.set(log.instanceId, current);
  }

  const instanceMap = new Map(instances.map(item => [item.id, item]));
  const instanceIds = new Set<string>([...grouped.keys(), ...instances.map(item => item.id)]);

  return Array.from(instanceIds).map((instanceId) => {
    const logs = grouped.get(instanceId) || [];
    const sorted = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recent = sorted.slice(0, 5);
    const latest = recent[0];
    const instance = instanceMap.get(instanceId);
    const instanceName = instance?.name || latest?.instance?.name || instanceId;
    const endpoint = instance?.settings?.webhookUrl || latest?.targetUrl || '';
    const signatureKey = undefined;
    const configuredEventsFromSettings = [
      instance?.settings?.webhookOnReceived ? 'message.received' : null,
      instance?.settings?.webhookOnCreate ? 'message.created' : null,
      instance?.settings?.webhookOnAck ? 'message.ack' : null,
      instance?.settings?.webhookDownloadMedia ? 'media.download' : null,
      instance?.settings?.webhookOnReaction ? 'message.reaction' : null
    ].filter(Boolean) as string[];

    return {
      id: `wh-${instanceId}`,
      instanceId,
      endpoint,
      endpointUrl: endpoint,
      event: latest?.eventType || configuredEventsFromSettings[0] || 'message.created',
      method: 'POST',
      status: webhookStatusFromDb(latest?.statusCode ?? null, Boolean(endpoint)),
      code: latest?.statusCode ?? 0,
      lastDelivery: latest ? formatDateTime(new Date(latest.createdAt)) : '—',
      duration: latest?.statusCode ? `${Math.max(25, latest.statusCode)} ms` : '—',
      secret: signatureKey,
      payload: latest?.requestBody ? JSON.stringify(latest.requestBody, null, 2) : undefined,
      active: Boolean(endpoint),
      configuredEvents: configuredEventsFromSettings.length
        ? configuredEventsFromSettings
        : Array.from(new Set(logs.map(item => item.eventType))),
      responseSpeed: latest?.statusCode ? `${Math.max(25, latest.statusCode)} ms` : undefined,
      signatureKey,
      instance: instanceName,
      recentDeliveries: recent.map((log, index) => ({
        id: log.id || String(index + 1),
        method: 'POST',
        status: log.statusCode ?? 0,
        speed: log.statusCode ? `${Math.max(25, log.statusCode)} ms` : '—',
        time: formatDateTime(new Date(log.createdAt)),
        event: log.eventType
      }))
    };
  });
};

export const mapBackendLogToUi = (item: BackendInstanceLog): LogEntry => ({
  id: item.id,
  time: formatDateTime(new Date(item.createdAt)),
  level: (item.level || 'INFO').toUpperCase() as LogEntry['level'],
  module: item.instance?.name || 'System',
  message: item.message,
  resource: item.instanceId,
  status: item.level.toLowerCase().includes('error') ? 'Failed' : 'Success',
  payload: item.meta,
  requestId: item.id
});

export const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(value);

export const formatRelativeTime = (value: Date) => {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60000));

  if (diffMinutes < 1) {
    return 'только что';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  }

  return formatDateTime(value);
};
