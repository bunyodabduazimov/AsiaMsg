import React from 'react';

export type ActiveView = 'overview' | 'instances' | 'messages' | 'tokens' | 'webhooks' | 'logs' | 'settings';

export interface Instance {
  id: string;
  name: string;
  number: string;
  provider: 'Baileys' | 'Official' | string;
  status: 'Connected' | 'Waiting QR' | 'Disconnected' | 'Reconnecting';
  lastActive: string;
  messagesToday: number;
  qrCode?: string;
  qrExpiresAt?: string;
  webhookUrl?: string;
  webhookRetryCount?: number;
  webhookOnReceived?: boolean;
  webhookOnCreate?: boolean;
  webhookOnAck?: boolean;
  webhookDownloadMedia?: boolean;
  webhookOnReaction?: boolean;
  createdDate?: string;
}

export interface Message {
  id: string;
  number: string;
  instance: string;
  instanceId?: string;
  type: 'Входящее' | 'Исходящее';
  status: 'Доставлено' | 'Отправлено' | 'Ошибка' | 'В очереди';
  time: string;
  messageText: string;
  details?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  attachmentData?: string;
  statusHistory?: { status: string; time: string }[];
}

export interface ApiToken {
  id: string;
  name: string;
  instance: string;
  scopes: string[];
  lastUsed: string;
  created: string;
  expires: string;
  status: 'Активен' | 'Истекает скоро' | 'Отозван';
  tokenKey: string;
  messagesCount?: number;
  webhooksCalled?: number;
}

export interface Webhook {
  id: string;
  endpoint: string;
  endpointUrl?: string;
  event: string;
  method: 'POST' | 'GET';
  status: 'Активен' | 'Пауза' | 'Ошибка';
  code: number;
  lastDelivery: string;
  duration?: string;
  secret?: string;
  payload?: string;
  active?: boolean;
  configuredEvents?: string[];
  responseSpeed?: string;
  signatureKey?: string;
  instance?: string;
  recentDeliveries?: {
    id: string;
    method: string;
    status: number;
    speed: string;
    time: string;
    event: string;
  }[];
}

export interface LogEntry {
  id: string;
  time: string;
  level: 'ERROR' | 'WARNING' | 'INFO' | 'CRITICAL';
  module: string;
  message: string;
  resource: string;
  status: 'Failed' | 'Retrying' | 'Success' | 'Throttled' | 'Down';
  requestId?: string;
  ip?: string;
  userAgent?: string;
  trace?: string;
  payload?: any;
}

export interface AppState {
  activeView: ActiveView;
  language: 'RU' | 'EN';
  theme: 'light' | 'dark' | 'system';
  searchQuery: string;
  notificationCount: number;
  selectedInstanceId: string | null;
  selectedMessageId: string | null;
  selectedTokenId: string | null;
  selectedWebhookId: string | null;
  selectedLogId: string | null;
  instances: Instance[];
  messages: Message[];
  tokens: ApiToken[];
  webhooks: Webhook[];
  logs: LogEntry[];
  userProfile: {
    name: string;
    email: string;
  };
}
export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}
export interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  trendColor?: 'green' | 'red';
  icon: React.ReactNode;
  iconBg: string;
}
export interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  language: 'RU' | 'EN';
}
