import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Copy,
  RefreshCw,
  Search,
  Send,
  Webhook as WebhookIcon
} from 'lucide-react';
import { AppState } from '../../types';
import type { BackendInstanceSettingsInput, BackendWebhookTestResult } from '../../lib/api';

interface WebhooksViewProps {
  state: AppState;
  onSelectWebhook: (id: string | null) => void;
  onUpdateInstanceSettings: (id: string, input: BackendInstanceSettingsInput) => void | Promise<void>;
  onSendWebhookTest: (id: string, input: BackendInstanceSettingsInput) => Promise<BackendWebhookTestResult | null>;
  actionLoading?: boolean;
  testLoading?: boolean;
}

type Draft = Required<Omit<BackendInstanceSettingsInput, 'webhookUrl'>> & {
  webhookUrl: string;
};

const defaultDraft: Draft = {
  webhookUrl: '',
  webhookRetryCount: 3,
  webhookOnReceived: false,
  webhookOnCreate: true,
  webhookOnAck: false,
  webhookDownloadMedia: false,
  webhookOnReaction: false
};

const eventOptions: Array<{
  key: keyof Omit<Draft, 'webhookUrl' | 'webhookRetryCount'>;
  event: string;
  labelRu: string;
  labelEn: string;
}> = [
  { key: 'webhookOnReceived', event: 'message.received', labelRu: 'Входящие сообщения', labelEn: 'Incoming messages' },
  { key: 'webhookOnCreate', event: 'message.created', labelRu: 'Создание сообщения', labelEn: 'Message created' },
  { key: 'webhookOnAck', event: 'message.ack', labelRu: 'Статус доставки ACK', labelEn: 'Delivery ACK' },
  { key: 'webhookDownloadMedia', event: 'media.download', labelRu: 'Загрузка медиа', labelEn: 'Media download' },
  { key: 'webhookOnReaction', event: 'message.reaction', labelRu: 'Реакции', labelEn: 'Reactions' }
];

export const WebhooksView: React.FC<WebhooksViewProps> = ({
  state,
  onSelectWebhook,
  onUpdateInstanceSettings,
  onSendWebhookTest,
  actionLoading = false,
  testLoading = false
}) => {
  const isRu = state.language === 'RU';
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedWebhook = state.webhooks.find(item => item.id === state.selectedWebhookId) || state.webhooks[0] || null;
  const selectedInstance = selectedWebhook
    ? state.instances.find(item => item.id === selectedWebhook.instanceId)
    : null;

  useEffect(() => {
    if (!state.selectedWebhookId && selectedWebhook) {
      onSelectWebhook(selectedWebhook.id);
    }
  }, [onSelectWebhook, selectedWebhook, state.selectedWebhookId]);

  useEffect(() => {
    if (!selectedInstance) {
      setDraft(defaultDraft);
      return;
    }

    setDraft({
      webhookUrl: selectedInstance.webhookUrl || '',
      webhookRetryCount: selectedInstance.webhookRetryCount ?? 3,
      webhookOnReceived: selectedInstance.webhookOnReceived ?? false,
      webhookOnCreate: selectedInstance.webhookOnCreate ?? true,
      webhookOnAck: selectedInstance.webhookOnAck ?? false,
      webhookDownloadMedia: selectedInstance.webhookDownloadMedia ?? false,
      webhookOnReaction: selectedInstance.webhookOnReaction ?? false
    });
    setTestResult(null);
  }, [selectedInstance]);

  const filteredWebhooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return state.webhooks;

    return state.webhooks.filter(item =>
      item.endpoint.toLowerCase().includes(query) ||
      (item.instance || '').toLowerCase().includes(query) ||
      (item.instanceId || '').toLowerCase().includes(query)
    );
  }, [searchQuery, state.webhooks]);

  const activeCount = state.webhooks.filter(item => item.active).length;
  const failedCount = state.webhooks.filter(item => item.code >= 400).length;
  const latestDeliveries = selectedWebhook?.recentDeliveries || [];

  const copyText = async (text: string, field: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1200);
  };

  const saveDraft = async () => {
    if (!selectedWebhook?.instanceId || actionLoading) return;

    await onUpdateInstanceSettings(selectedWebhook.instanceId, {
      ...draft,
      webhookUrl: draft.webhookUrl.trim() || null,
      webhookRetryCount: Math.max(0, Math.min(10, Number(draft.webhookRetryCount) || 0))
    });
  };

  const toggleWebhook = async (webhookId: string) => {
    const webhook = state.webhooks.find(item => item.id === webhookId);
    const instance = webhook ? state.instances.find(item => item.id === webhook.instanceId) : null;
    if (!webhook?.instanceId || !instance || actionLoading) return;

    if (webhook.active) {
      await onUpdateInstanceSettings(webhook.instanceId, {
        webhookUrl: null,
        webhookRetryCount: instance.webhookRetryCount ?? 3,
        webhookOnReceived: instance.webhookOnReceived ?? false,
        webhookOnCreate: instance.webhookOnCreate ?? false,
        webhookOnAck: instance.webhookOnAck ?? false,
        webhookDownloadMedia: instance.webhookDownloadMedia ?? false,
        webhookOnReaction: instance.webhookOnReaction ?? false
      });
      return;
    }

    onSelectWebhook(webhook.id);
  };

  const sendTestEvent = async () => {
    if (!selectedWebhook?.instanceId || !draft.webhookUrl.trim() || testLoading) return;

    setTestResult(null);

    try {
      const result = await onSendWebhookTest(selectedWebhook.instanceId, draft);
      setTestResult({
        ok: Boolean(result && result.statusCode && result.statusCode >= 200 && result.statusCode < 300),
        text: result
          ? `${result.statusCode ?? 'N/A'}${result.errorMessage ? ` ${result.errorMessage}` : ''}\n${JSON.stringify(result, null, 2)}`
          : (isRu ? 'РўРµСЃС‚ РЅРµ РІС‹РїРѕР»РЅРµРЅ' : 'Test not completed')
      });
    } catch (error) {
      setTestResult({
        ok: false,
        text: error instanceof Error ? error.message : 'Webhook test failed'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {isRu ? 'Webhooks' : 'Webhooks'}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {isRu
              ? 'Настройка URL для получения событий WhatsApp из ChatAPI.'
              : 'Configure URLs that receive WhatsApp events from ChatAPI.'}
          </p>
        </div>

        <button
          type="button"
          onClick={saveDraft}
          disabled={!selectedWebhook || actionLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isRu ? 'Сохранить' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<WebhookIcon className="h-5 w-5" />}
          label={isRu ? 'Всего настроек' : 'Total settings'}
          value={state.webhooks.length}
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={isRu ? 'Активные URL' : 'Active URLs'}
          value={activeCount}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label={isRu ? 'Ошибки доставки' : 'Delivery errors'}
          value={failedCount}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={isRu ? 'Поиск по URL или инстансу...' : 'Search URL or instance...'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {filteredWebhooks.map(webhook => {
              const isSelected = webhook.id === selectedWebhook?.id;
              return (
                <button
                  key={webhook.id}
                  type="button"
                  onClick={() => onSelectWebhook(webhook.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 dark:text-slate-100">{webhook.instance || webhook.instanceId}</p>
                      <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                        {webhook.endpoint || (isRu ? 'URL не настроен' : 'URL is not configured')}
                      </p>
                    </div>
                    <StatusDot active={Boolean(webhook.active)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">POST</span>
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        void toggleWebhook(webhook.id);
                      }}
                      className={`rounded-lg px-3 py-1 font-bold ${
                        webhook.active
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
                      }`}
                    >
                      {webhook.active ? (isRu ? 'Отключить' : 'Disable') : (isRu ? 'Настроить' : 'Configure')}
                    </button>
                  </div>
                </button>
              );
            })}

            {!filteredWebhooks.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500">
                {isRu ? 'Webhook настройки не найдены' : 'No webhook settings found'}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Webhook</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                  {selectedInstance?.name || selectedWebhook?.instance || (isRu ? 'Инстанс не выбран' : 'No instance selected')}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedWebhook?.instanceId || (isRu ? 'Выберите инстанс слева.' : 'Select an instance on the left.')}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/40">
                <StatusDot active={Boolean(selectedWebhook?.active)} />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedWebhook?.active ? (isRu ? 'Активен' : 'Active') : (isRu ? 'Не настроен' : 'Not configured')}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <label className="block">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isRu ? 'URL веб-перехватчика' : 'Webhook URL'}
                </span>
                <input
                  value={draft.webhookUrl}
                  onChange={event => setDraft(prev => ({ ...prev, webhookUrl: event.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  {isRu ? 'Повторы' : 'Retries'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={draft.webhookRetryCount}
                  onChange={event => setDraft(prev => ({ ...prev, webhookRetryCount: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-slate-800">
                {isRu ? 'События' : 'Events'}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {eventOptions.map(option => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{isRu ? option.labelRu : option.labelEn}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">{option.event}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={draft[option.key]}
                      onChange={() => setDraft(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveDraft}
                disabled={!selectedWebhook || actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isRu ? 'Сохранить настройки' : 'Save settings'}
              </button>
              <button
                type="button"
                onClick={sendTestEvent}
                disabled={!draft.webhookUrl.trim() || testLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {testLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isRu ? 'Отправить тест' : 'Send test'}
              </button>
              <button
                type="button"
                onClick={() => copyText(draft.webhookUrl, 'url')}
                disabled={!draft.webhookUrl.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {copiedField === 'url' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {isRu ? 'Копировать URL' : 'Copy URL'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    {isRu ? 'Результат теста' : 'Test result'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {isRu ? 'Ответ внешнего endpoint после тестовой отправки.' : 'External endpoint response after test request.'}
                  </p>
                </div>
              </div>
              <pre className={`min-h-44 overflow-auto rounded-2xl p-4 text-xs ${
                testResult?.ok ? 'bg-emerald-950 text-emerald-100' : 'bg-slate-950 text-cyan-100 dark:bg-slate-950 dark:text-cyan-100'
              }`}>
                {testResult?.text || (isRu ? 'Нажмите “Отправить тест”, чтобы увидеть ответ.' : 'Click “Send test” to see the response.')}
              </pre>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                {isRu ? 'Последние доставки' : 'Recent deliveries'}
              </h3>
              <div className="mt-4 space-y-3">
                {latestDeliveries.map(delivery => (
                  <div key={delivery.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500">{delivery.event}</span>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                        delivery.status >= 200 && delivery.status < 300
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                      }`}>
                        {delivery.status || '—'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{delivery.time} · {delivery.speed}</p>
                  </div>
                ))}

                {!latestDeliveries.length && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    {isRu ? 'Доставок пока нет' : 'No deliveries yet'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">{icon}</div>
      <span className="text-2xl font-bold text-slate-950 dark:text-white">{value}</span>
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

const StatusDot = ({ active }: { active: boolean }) => (
  <span className={`inline-flex h-3 w-3 shrink-0 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
);
