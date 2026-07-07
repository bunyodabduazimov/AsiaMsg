import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let bgClass = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotClass = 'bg-gray-400';
  let label = status;

  // Normalize status
  const norm = status.trim().toLowerCase();

  if (norm === 'connected' || norm === 'активен' || norm === 'доставлено' || norm === 'success' || norm === 'успешно') {
    bgClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    dotClass = 'bg-emerald-500';
    if (norm === 'connected') label = 'Connected';
    if (norm === 'активен') label = 'Активен';
    if (norm === 'доставлено') label = 'Доставлено';
    if (norm === 'success') label = 'Success';
  } else if (norm === 'waiting qr' || norm === 'ожидает qr' || norm === 'отправлено' || norm === 'info' || norm === 'инфо') {
    bgClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
    dotClass = 'bg-blue-500';
    if (norm === 'waiting qr') label = 'Waiting QR';
    if (norm === 'отправлено') label = 'Отправлено';
    if (norm === 'info') label = 'INFO';
  } else if (norm === 'disconnected' || norm === 'отключен' || norm === 'ошибка' || norm === 'error' || norm === 'отозван' || norm === 'failed' || norm === 'down') {
    bgClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
    dotClass = 'bg-rose-500';
    if (norm === 'disconnected') label = 'Disconnected';
    if (norm === 'ошибка') label = 'Ошибка';
    if (norm === 'error') label = 'ERROR';
    if (norm === 'отозван') label = 'Отозван';
    if (norm === 'failed') label = 'Failed';
    if (norm === 'down') label = 'Down';
  } else if (norm === 'reconnecting' || norm === 'подключение' || norm === 'пауза' || norm === 'warning' || norm === 'предупреждение' || norm === 'retrying' || norm === 'истекает скоро') {
    bgClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    dotClass = 'bg-amber-500';
    if (norm === 'reconnecting') label = 'Reconnecting';
    if (norm === 'пауза') label = 'Пауза';
    if (norm === 'warning') label = 'WARNING';
    if (norm === 'retrying') label = 'Retrying';
    if (norm === 'истекает скоро') label = 'Истекает скоро';
  } else if (norm === 'в очереди' || norm === 'queued' || norm === 'throttled') {
    bgClass = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/30';
    dotClass = 'bg-sky-500';
    if (norm === 'в очереди') label = 'В очереди';
    if (norm === 'throttled') label = 'Throttled';
  } else if (norm === 'critical' || norm === 'критическая') {
    bgClass = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
    dotClass = 'bg-purple-500';
    label = 'CRITICAL';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bgClass} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};
