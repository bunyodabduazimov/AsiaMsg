import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  SquareCheckBig,
  SquareDashedMousePointer,
  Trash2,
  X
} from 'lucide-react';
import { AppState, Instance } from '../../types';
import { StatusBadge } from '../StatusBadge';

interface InstancesViewProps {
  state: AppState;
  accessToken: string | null;
  onSelectInstance: (id: string | null) => void;
  onAddNumberClick: () => void;
  onUpdateInstanceStatus: (id: string, status: Instance['status']) => void;
  onRequestInstanceQr: (id: string) => void;
  onRenameInstance: (id: string, name: string) => void;
  onDeleteInstance: (id: string) => void;
  onUpdateInstanceSettings: (id: string, input: WebhookSettingsInput) => void;
  actionLoading?: boolean;
}

type WebhookSettingsInput = {
  webhookUrl?: string | null;
  webhookRetryCount?: number;
  webhookOnReceived?: boolean;
  webhookOnCreate?: boolean;
  webhookOnAck?: boolean;
  webhookDownloadMedia?: boolean;
  webhookOnReaction?: boolean;
};

type WebhookSettingsDraft = {
  webhookUrl: string;
  webhookRetryCount: number;
  webhookOnReceived: boolean;
  webhookOnCreate: boolean;
  webhookOnAck: boolean;
  webhookDownloadMedia: boolean;
  webhookOnReaction: boolean;
};

export const InstancesView: React.FC<InstancesViewProps> = ({
  state,
  accessToken,
  onSelectInstance,
  onAddNumberClick,
  onUpdateInstanceStatus,
  onRequestInstanceQr,
  onRenameInstance,
  onDeleteInstance,
  onUpdateInstanceSettings,
  actionLoading = false
}) => {
  const isRu = state.language === 'RU';
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuStyle, setOpenMenuStyle] = useState<React.CSSProperties | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<Instance | null>(null);
  const [editName, setEditName] = useState('');
  const [webhookDraft, setWebhookDraft] = useState<WebhookSettingsDraft>({
    webhookUrl: '',
    webhookRetryCount: 3,
    webhookOnReceived: false,
    webhookOnCreate: false,
    webhookOnAck: false,
    webhookDownloadMedia: false,
    webhookOnReaction: false
  });

  const itemsPerPage = 10;
  const selectedInstance = state.instances.find(item => item.id === state.selectedInstanceId) || null;
  const filteredInstances = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return state.instances.filter(item => {
      if (!query) return true;

      return (
        item.name.toLowerCase().includes(query) ||
        item.number.toLowerCase().includes(query) ||
        item.provider.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, state.instances]);

  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedInstances = filteredInstances.slice(startIndex, startIndex + itemsPerPage);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1400);
    } catch {
      setCopiedField(null);
    }
  };

  const openDetails = (id: string) => {
    setOpenMenuId(null);
    onSelectInstance(id);
  };

  const openActions = (id: string, triggerEl: HTMLButtonElement) => {
    if (actionLoading) return;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = 128;
    const canOpenDown = rect.bottom + menuHeight + 12 <= window.innerHeight;
    const top = canOpenDown
      ? Math.min(window.innerHeight - menuHeight - 8, rect.bottom + 8)
      : Math.max(8, rect.top - menuHeight - 12);
    const left = Math.max(8, rect.right - menuWidth);

    if (openMenuId === id) {
      closeActions();
      return;
    }

    setOpenMenuId(id);
    setOpenMenuStyle({
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      zIndex: 9999
    });
  };

  const closeActions = () => {
    setOpenMenuId(null);
    setOpenMenuStyle(null);
  };

  useEffect(() => {
    if (!openMenuId) return;

    const handleClose = () => closeActions();
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!selectedInstance) return;

    setWebhookDraft({
      webhookUrl: selectedInstance.webhookUrl || '',
      webhookRetryCount: selectedInstance.webhookRetryCount ?? 3,
      webhookOnReceived: selectedInstance.webhookOnReceived ?? false,
      webhookOnCreate: selectedInstance.webhookOnCreate ?? false,
      webhookOnAck: selectedInstance.webhookOnAck ?? false,
      webhookDownloadMedia: selectedInstance.webhookDownloadMedia ?? false,
      webhookOnReaction: selectedInstance.webhookOnReaction ?? false
    });
  }, [
    selectedInstance?.id,
    selectedInstance?.webhookUrl,
    selectedInstance?.webhookRetryCount,
    selectedInstance?.webhookOnReceived,
    selectedInstance?.webhookOnCreate,
    selectedInstance?.webhookOnAck,
    selectedInstance?.webhookDownloadMedia,
    selectedInstance?.webhookOnReaction
  ]);

  const runStatusAction = (id: string, status: Instance['status']) => {
    if (actionLoading) return;
    closeActions();
    onUpdateInstanceStatus(id, status);
  };

  const openRenameDialog = (instance: Instance) => {
    if (actionLoading) return;
    setEditingInstance(instance);
    setEditName(instance.name);
    closeActions();
  };

  const closeRenameDialog = () => {
    setEditingInstance(null);
    setEditName('');
  };

  const openDeleteDialog = (instance: Instance) => {
    if (actionLoading) return;
    setDeletingInstance(instance);
    closeActions();
  };

  const closeDeleteDialog = () => {
    if (actionLoading) return;
    setDeletingInstance(null);
  };

  const confirmDelete = () => {
    if (!deletingInstance || actionLoading) return;
    onDeleteInstance(deletingInstance.id);
    setDeletingInstance(null);
  };

  const submitRename = (event: React.FormEvent) => {
    event.preventDefault();
    if (actionLoading || !editingInstance || !editName.trim()) return;
    onRenameInstance(editingInstance.id, editName.trim());
    closeRenameDialog();
  };

  const submitWebhookSettings = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInstance || actionLoading) return;

    onUpdateInstanceSettings(selectedInstance.id, {
      ...webhookDraft,
      webhookUrl: webhookDraft.webhookUrl.trim() || null,
      webhookRetryCount: Number.isFinite(webhookDraft.webhookRetryCount)
        ? Math.max(0, Math.min(10, webhookDraft.webhookRetryCount))
        : 3
    });
  };

  const setWebhookFlag = (key: keyof Omit<WebhookSettingsDraft, 'webhookUrl' | 'webhookRetryCount'>) => {
    setWebhookDraft(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDetailPage = () => {
    if (!selectedInstance) return null;

    const isConnected = selectedInstance.status === 'Connected';
    const isQrState =
      selectedInstance.status === 'Waiting QR' ||
      selectedInstance.status === 'Disconnected' ||
      selectedInstance.status === 'Reconnecting';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full pr-28">
            <button
              type="button"
              onClick={() => onSelectInstance(null)}
              className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {isRu ? 'Назад' : 'Back'}
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{selectedInstance.name}</h1>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
              {isRu ? 'Страница деталей инстанса' : 'Instance details page'}
            </p>
          </div>
        </div>

        <div className="grid gap-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r dark:border-slate-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  {isRu ? 'Статус подключения' : 'Connection status'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedInstance.status} size="lg" />
                  <span className="text-sm text-slate-500">{selectedInstance.lastActive}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => runStatusAction(selectedInstance.id, 'Reconnecting')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isRu ? 'Обновить' : 'Refresh'}
              </button>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex justify-center">
                {selectedInstance.qrCode ? (
                  <div className="flex h-56 w-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                    <img
                      src={selectedInstance.qrCode}
                      alt="WhatsApp QR code"
                      className="h-44 w-44 object-contain"
                    />
                    {selectedInstance.qrExpiresAt ? (
                      <p className="text-[11px] font-semibold text-amber-600">
                        {isRu
                          ? `QR действует до ${new Date(selectedInstance.qrExpiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                          : `QR valid until ${new Date(selectedInstance.qrExpiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                      </p>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-500">
                        {isRu ? 'QR действителен 60 секунд после создания' : 'QR is valid for 60 seconds after generation'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex h-56 w-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 px-6 text-center text-blue-700">
                    <QrCode className="h-11 w-11" />
                    <div className="text-sm font-bold leading-5">
                      {isRu ? 'Нажмите подключить, чтобы получить QR' : 'Press connect to get QR'}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <InfoCard
                  label={isRu ? 'Номер' : 'Number'}
                  value={selectedInstance.number}
                  onCopy={() => void copyToClipboard(selectedInstance.number, 'number')}
                  copied={copiedField === 'number'}
                />
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400">{isRu ? 'Провайдер' : 'Provider'}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{selectedInstance.provider}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-400">Webhook</div>
                  <div className="mt-1 text-sm font-semibold text-emerald-600">
                    {selectedInstance.webhookUrl ? selectedInstance.webhookUrl : (isRu ? 'Активен' : 'Active')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onRequestInstanceQr(selectedInstance.id)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquareCheckBig className="h-4 w-4" />}
                {isRu ? 'Подключить' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={() => runStatusAction(selectedInstance.id, 'Waiting QR')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {isRu ? 'Получить QR' : 'Get QR'}
              </button>
              <button
                type="button"
                onClick={() => runStatusAction(selectedInstance.id, 'Disconnected')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquareDashedMousePointer className="h-4 w-4" />}
                {isRu ? 'Отключить' : 'Disconnect'}
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {isQrState
                ? (isRu ? 'Сканируйте QR-код в WhatsApp, чтобы привязать устройство.' : 'Scan the QR code in WhatsApp to link the device.')
                : isConnected
                  ? (isRu ? 'Сессия активна и готова к работе.' : 'The session is active and ready.')
                  : (isRu ? 'Состояние инстанса отслеживается по backend.' : 'Instance state is tracked from the backend.')}
            </p>
          </div>

          <div className="bg-slate-50/70 p-6 dark:bg-slate-950/40">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                label={isRu ? 'ID инстанса' : 'Instance ID'}
                value={selectedInstance.id}
                onCopy={() => void copyToClipboard(selectedInstance.id, 'id')}
                copied={copiedField === 'id'}
              />
              <InfoCard
                label={isRu ? 'Access Token' : 'Access Token'}
                value={accessToken ? `${accessToken}` : (isRu ? 'Сессия не авторизована' : 'Session not authorized')}
                onCopy={accessToken ? () => void copyToClipboard(`${accessToken}`, 'access-token') : undefined}
                copied={copiedField === 'access-token'}
              />
              <InfoCard label={isRu ? 'Создан' : 'Created'} value={selectedInstance.createdDate || '—'} />
              <InfoCard label={isRu ? 'Последняя активность' : 'Last active'} value={selectedInstance.lastActive} />
              <InfoCard label={isRu ? 'Сообщений' : 'Messages'} value={String(selectedInstance.messagesToday)} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    {isRu ? 'Быстрые действия' : 'Quick actions'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isRu ? 'Как в UltraMsg: отдельная страница для выбранного инстанса.' : 'Like UltraMsg: a separate page for the selected instance.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => window.open('https://web.whatsapp.com', '_blank', 'noreferrer')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  {isRu ? 'Открыть WhatsApp Web' : 'Open WhatsApp Web'}
                </button>
                <button
                  type="button"
                  onClick={() => runStatusAction(selectedInstance.id, 'Reconnecting')}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <RotateCcw className="h-4 w-4 text-amber-500" />}
                  {isRu ? 'Перезапуск' : 'Reconnect'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={submitWebhookSettings}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                {isRu ? 'Webhook настройки' : 'Webhook settings'}
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {isRu ? 'Настройки веб-перехватчика' : 'Webhook delivery settings'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isRu
                  ? 'Укажите URL и события, которые нужно отправлять во внешнюю систему.'
                  : 'Set the URL and events that should be sent to an external system.'}
              </p>
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {actionLoading ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isRu ? 'URL-адрес веб-перехватчика' : 'Webhook URL'}
                </span>
                <input
                  type="url"
                  value={webhookDraft.webhookUrl}
                  onChange={event => setWebhookDraft(prev => ({ ...prev, webhookUrl: event.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {isRu ? 'Повторные попытки Webhook' : 'Webhook retry attempts'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={webhookDraft.webhookRetryCount}
                  onChange={event =>
                    setWebhookDraft(prev => ({
                      ...prev,
                      webhookRetryCount: Number(event.target.value)
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <p className="text-xs text-slate-400">
                  {isRu ? 'Допустимое значение: от 0 до 10 попыток.' : 'Allowed value: from 0 to 10 attempts.'}
                </p>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                {isRu ? 'События' : 'Events'}
              </p>
              <div className="mt-3 space-y-3">
                <WebhookToggle
                  label="Webhook on Received"
                  checked={webhookDraft.webhookOnReceived}
                  onChange={() => setWebhookFlag('webhookOnReceived')}
                />
                <WebhookToggle
                  label="Webhook on Create"
                  checked={webhookDraft.webhookOnCreate}
                  onChange={() => setWebhookFlag('webhookOnCreate')}
                />
                <WebhookToggle
                  label="Webhook on ACK"
                  checked={webhookDraft.webhookOnAck}
                  onChange={() => setWebhookFlag('webhookOnAck')}
                />
                <WebhookToggle
                  label="Webhook Download Media"
                  checked={webhookDraft.webhookDownloadMedia}
                  onChange={() => setWebhookFlag('webhookDownloadMedia')}
                />
                <WebhookToggle
                  label="Webhook On Reaction"
                  checked={webhookDraft.webhookOnReaction}
                  onChange={() => setWebhookFlag('webhookOnReaction')}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const renderTablePage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isRu ? 'Инстансы' : 'Instances'}
          </h1>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
            {isRu ? 'Управление подключёнными WhatsApp номерами' : 'Manage connected WhatsApp numbers'}
          </p>
        </div>

        <button
          onClick={onAddNumberClick}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          <span>{isRu ? 'Добавить' : 'Add'}</span>
        </button>
      </div>

      <div className="overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <div className="w-full max-w-[280px] flex-none">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={isRu ? 'Поиск...' : 'Search...'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                if (state.selectedInstanceId) {
                  runStatusAction(state.selectedInstanceId, 'Reconnecting');
                }
              }}
              disabled={!state.selectedInstanceId || actionLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isRu ? 'Обновить' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
                <th className="px-5 py-4">{isRu ? 'Название' : 'Name'}</th>
                <th className="px-5 py-4">{isRu ? 'Номер' : 'Number'}</th>
                <th className="px-5 py-4">{isRu ? 'Провайдер' : 'Provider'}</th>
                <th className="px-5 py-4">{isRu ? 'Статус' : 'Status'}</th>
                <th className="px-5 py-4">{isRu ? 'Активность' : 'Activity'}</th>
                <th className="px-5 py-4 text-center">{isRu ? 'Сообщений' : 'Messages'}</th>
                <th className="px-5 py-4 text-right">{isRu ? 'Действия' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedInstances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    {isRu ? 'Ничего не найдено' : 'No instances found'}
                  </td>
                </tr>
              ) : (
                paginatedInstances.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => openDetails(item.id)}
                    className={`group cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-slate-800/50 ${
                      state.selectedInstanceId === item.id ? 'bg-blue-50/50 dark:bg-blue-950/15' : ''
                    }`}
                  >
                    <td className="px-5 py-5 font-semibold text-slate-900 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {item.name}
                    </td>
                    <td className="px-5 py-5 font-mono text-slate-500 dark:text-slate-400">{item.number}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                        {item.provider}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-5 py-5 text-slate-500 dark:text-slate-400">{item.lastActive}</td>
                    <td className="px-5 py-5 text-center font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {item.messagesToday}
                    </td>
                    <td className="relative z-[120] px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => openActions(item.id, e.currentTarget)}
                          disabled={actionLoading}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          aria-label={isRu ? 'Открыть действия' : 'Open actions'}
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span>{isRu ? 'Строк на странице' : 'Rows per page'}</span>
            <select
              value={itemsPerPage}
              readOnly
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value={10}>10</option>
            </select>

            <div className="ml-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`rounded-lg border px-3 py-1.5 font-semibold ${
                  safePage === 1
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                disabled={totalPages < 2}
                className={`rounded-lg border px-3 py-1.5 font-semibold ${
                  safePage === 2
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const openMenuInstance = openMenuId ? state.instances.find(instance => instance.id === openMenuId) || null : null;

  return (
    <div className="w-full space-y-6">
      {selectedInstance ? renderDetailPage() : renderTablePage()}
      {openMenuId && openMenuStyle && openMenuInstance && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close actions menu"
                className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                onClick={closeActions}
              />
              <div
                className="fixed z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-900"
                style={openMenuStyle}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-2">
                  <MenuItem
                    label={isRu ? 'Изменить' : 'Edit'}
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => {
                      openRenameDialog(openMenuInstance);
                    }}
                    disabled={actionLoading}
                  />
                  <MenuItem
                    label={isRu ? 'Удалить' : 'Delete'}
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => {
                      openDeleteDialog(openMenuInstance);
                    }}
                    disabled={actionLoading}
                    danger
                  />
                </div>
              </div>
            </>,
            document.body
          )
        : null}
      {editingInstance && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 py-6">
              <form
                onSubmit={submitRename}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isRu ? 'Изменить инстанс' : 'Edit instance'}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {isRu ? 'Измените название инстанса.' : 'Update the instance name.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeRenameDialog}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isRu ? 'Закрыть' : 'Close'}
                  </button>
                </div>

                <label className="mt-5 block space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {isRu ? 'Название' : 'Name'}
                  </span>
                  <input
                    value={editName}
                    onChange={event => setEditName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    autoFocus
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeRenameDialog}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {isRu ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!editName.trim() || actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {actionLoading ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
                  </button>
                </div>
              </form>
            </div>,
            document.body
          )
        : null}
      {deletingInstance && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 py-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isRu ? 'Удалить инстанс?' : 'Delete instance?'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {isRu
                        ? `Инстанс "${deletingInstance.name}" будет скрыт из аккаунта, а WhatsApp-сессия будет остановлена.`
                        : `Instance "${deletingInstance.name}" will be hidden from the account and its WhatsApp session will be stopped.`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                  {isRu
                    ? 'Это мягкое удаление: запись получит deletedAt и пропадёт из списка.'
                    : 'This is a soft delete: the row gets deletedAt and disappears from the list.'}
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteDialog}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {isRu ? 'Отмена' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {actionLoading ? (isRu ? 'Удаление...' : 'Deleting...') : (isRu ? 'Удалить' : 'Delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

type InfoCardProps = {
  label: string;
  value: string;
  copied?: boolean;
  onCopy?: () => void;
};

const InfoCard: React.FC<InfoCardProps> = ({ label, value, copied, onCopy }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-xs font-semibold text-slate-400">{label}</div>
    <div className="mt-1 flex items-center justify-between gap-3">
      <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{value}</div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  </div>
);

type MenuItemProps = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

const MenuItem: React.FC<MenuItemProps> = ({ label, icon, onClick, danger, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
    } disabled:cursor-not-allowed disabled:opacity-50`}
  >
    <span className={danger ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}>{icon}</span>
    <span>{label}</span>
  </button>
);

type WebhookToggleProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

const WebhookToggle: React.FC<WebhookToggleProps> = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
  >
    <span>{label}</span>
    <span
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </span>
  </button>
);
