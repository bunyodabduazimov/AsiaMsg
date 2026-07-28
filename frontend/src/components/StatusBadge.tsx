import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusText = (status: string, isRu: boolean) => {
  const norm = status.trim().toLowerCase();
  const ru = {
    connected: 'Подключено',
    active: 'Активен',
    delivered: 'Доставлено',
    success: 'Успешно',
    waitingQr: 'Ожидание QR',
    sent: 'Отправлено',
    info: 'Инфо',
    disconnected: 'Отключено',
    error: 'Ошибка',
    revoked: 'Отозван',
    failed: 'Ошибка',
    down: 'Недоступно',
    reconnecting: 'Переподключение',
    paused: 'Пауза',
    warning: 'Предупреждение',
    retrying: 'Повтор',
    expiringSoon: 'Истекает скоро',
    queued: 'В очереди',
    throttled: 'Ограничено',
    critical: 'Критично'
  } as const;
  const en = {
    connected: 'Connected',
    active: 'Active',
    delivered: 'Delivered',
    success: 'Success',
    waitingQr: 'Waiting QR',
    sent: 'Sent',
    info: 'INFO',
    disconnected: 'Disconnected',
    error: 'Error',
    revoked: 'Revoked',
    failed: 'Failed',
    down: 'Down',
    reconnecting: 'Reconnecting',
    paused: 'Paused',
    warning: 'WARNING',
    retrying: 'Retrying',
    expiringSoon: 'Expiring soon',
    queued: 'Queued',
    throttled: 'Throttled',
    critical: 'CRITICAL'
  } as const;

  const map = isRu ? ru : en;

  if (norm === 'connected' || norm === 'активен') return map.connected;
  if (norm === 'success' || norm === 'успешно') return map.success;
  if (norm === 'waiting qr' || norm === 'ожидает qr') return map.waitingQr;
  if (norm === 'отправлено') return map.sent;
  if (norm === 'info' || norm === 'инфо') return map.info;
  if (norm === 'disconnected' || norm === 'отключен') return map.disconnected;
  if (norm === 'ошибка' || norm === 'error') return map.error;
  if (norm === 'отозван') return map.revoked;
  if (norm === 'failed') return map.failed;
  if (norm === 'down') return map.down;
  if (norm === 'reconnecting' || norm === 'подключение') return map.reconnecting;
  if (norm === 'пауза') return map.paused;
  if (norm === 'warning' || norm === 'предупреждение') return map.warning;
  if (norm === 'retrying') return map.retrying;
  if (norm === 'истекает скоро') return map.expiringSoon;
  if (norm === 'в очереди' || norm === 'queued') return map.queued;
  if (norm === 'throttled') return map.throttled;
  if (norm === 'critical' || norm === 'критическая') return map.critical;

  return status;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  let bgClass = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotClass = 'bg-gray-400';
  const norm = status.trim().toLowerCase();
  let label = statusText(status, isRu);

  if (norm === 'connected' || norm === 'активен' || norm === 'delivered' || norm === 'успешно' || norm === 'success') {
    bgClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    dotClass = 'bg-emerald-500';
  } else if (norm === 'waiting qr' || norm === 'ожидает qr' || norm === 'отправлено' || norm === 'info' || norm === 'инфо') {
    bgClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
    dotClass = 'bg-blue-500';
  } else if (norm === 'disconnected' || norm === 'отключен' || norm === 'ошибка' || norm === 'error' || norm === 'отозван' || norm === 'failed' || norm === 'down') {
    bgClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
    dotClass = 'bg-rose-500';
  } else if (norm === 'reconnecting' || norm === 'подключение' || norm === 'пауза' || norm === 'warning' || norm === 'предупреждение' || norm === 'retrying' || norm === 'истекает скоро') {
    bgClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    dotClass = 'bg-amber-500';
  } else if (norm === 'в очереди' || norm === 'queued' || norm === 'throttled') {
    bgClass = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30';
    dotClass = 'bg-sky-500';
  } else if (norm === 'critical' || norm === 'критическая') {
    bgClass = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
    dotClass = 'bg-purple-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${bgClass} ${padding}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};
