import React, { useEffect, useState } from 'react';
import { Plus, ShieldAlert, Smartphone } from 'lucide-react';
import { Layout } from './components/Layout';
import { OverviewView } from './components/views/OverviewView';
import { InstancesView } from './components/views/InstancesView';
import { MessagesView } from './components/views/MessagesView';
import { TokensView } from './components/views/TokensView';
import { WebhooksView } from './components/views/WebhooksView';
import { LogsView } from './components/views/LogsView';
import { SettingsView } from './components/views/SettingsView';
import {
  AppState,
  ActiveView,
  Instance,
  Message,
  ApiToken,
  Webhook,
  LogEntry
} from './types';
import {
  initialInstances,
  initialMessages,
  initialTokens,
  initialWebhooks,
  initialLogs
} from './mockData';
import {
  clearStoredConnection,
  createBackendInstance,
  buildWebhookItems,
  fetchDashboard,
  loginToBackend,
  normalizeApiBaseUrl,
  persistConnection,
  readStoredConnection,
  registerToBackend,
  mapBackendInstanceToUi,
  mapBackendMessageToUi,
  mapBackendTokenToUi,
  mapBackendLogToUi,
  updateBackendInstanceStatus,
  type BackendUser
} from './lib/api';

const createDemoAppState = (): AppState => ({
  activeView: 'overview',
  language: 'RU',
  theme: 'light',
  userProfile: {
    name: 'Администратор',
    email: 'admin@asiamsg.com'
  },
  instances: initialInstances,
  messages: initialMessages,
  tokens: initialTokens,
  webhooks: initialWebhooks,
  logs: initialLogs,
  selectedInstanceId: 'inst-01',
  selectedMessageId: 'msg-01',
  selectedTokenId: 'tok-01',
  selectedWebhookId: 'wh-01',
  selectedLogId: 'log-01',
  searchQuery: '',
  notificationCount: 3
});

const nowString = () =>
  new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU');

export default function App() {
  const storedConnection = readStoredConnection();
  const [state, setState] = useState<AppState>(createDemoAppState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'demo' | 'loading' | 'connected' | 'error'>(
    storedConnection.accessToken ? 'loading' : 'demo'
  );
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(storedConnection.apiBaseUrl);
  const [accessToken, setAccessToken] = useState<string | null>(storedConnection.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(storedConnection.refreshToken);
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [newNumName, setNewNumName] = useState('');
  const [newNumPhone, setNewNumPhone] = useState('+7 900 ');
  const [newNumProvider, setNewNumProvider] = useState('Baileys');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    if (!accessToken) {
      setBackendStatus('demo');
      return;
    }

    let isMounted = true;
    setBackendStatus('loading');
    setBackendError(null);

    const sync = async () => {
      try {
        const dashboard = await fetchDashboard(apiBaseUrl, accessToken);
        const messagesByInstance = new Map<string, number>();
        for (const message of dashboard.messages) {
          messagesByInstance.set(message.instanceId, (messagesByInstance.get(message.instanceId) || 0) + 1);
        }
        const instances = dashboard.instances.map(mapBackendInstanceToUi);
        const messages = dashboard.messages.map(mapBackendMessageToUi);
        const tokens = dashboard.tokens.map(mapBackendTokenToUi);
        const webhooks = buildWebhookItems(dashboard.instances, dashboard.webhookLogs);
        const logs = dashboard.logs.map(mapBackendLogToUi);

        if (!isMounted) return;

        setBackendUser(dashboard.user);
        setState(prev => ({
          ...prev,
          userProfile: {
            name: dashboard.user.name,
            email: dashboard.user.email
          },
          instances: instances.map(instance => ({
            ...instance,
            messagesToday: messagesByInstance.get(instance.id) || 0
          })),
          messages,
          tokens,
          webhooks,
          logs,
          selectedInstanceId: instances[0]?.id ?? prev.selectedInstanceId
        }));
        setBackendStatus('connected');
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Failed to connect to backend';
        setBackendError(message);
        setBackendStatus('error');
        setToastMessage(`Backend sync failed: ${message}`);
      }
    };

    void sync();

    return () => {
      isMounted = false;
    };
  }, [accessToken, apiBaseUrl]);

  const handleViewChange = (view: ActiveView) => {
    setState(prev => ({
      ...prev,
      activeView: view,
      selectedInstanceId: view === 'instances' ? prev.selectedInstanceId || 'inst-01' : prev.selectedInstanceId,
      selectedMessageId: view === 'messages' ? prev.selectedMessageId || 'msg-01' : prev.selectedMessageId,
      selectedTokenId: view === 'tokens' ? prev.selectedTokenId || 'tok-01' : prev.selectedTokenId,
      selectedWebhookId: view === 'webhooks' ? prev.selectedWebhookId || 'wh-01' : prev.selectedWebhookId,
      selectedLogId: view === 'logs' ? prev.selectedLogId || 'log-01' : prev.selectedLogId
    }));
    setSidebarOpen(false);
  };

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleLanguageChange = (lang: 'RU' | 'EN') => {
    setState(prev => ({ ...prev, language: lang }));
    triggerToast(lang === 'RU' ? 'Язык изменён на русский' : 'Language set to English');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, theme }));
    const message =
      theme === 'light'
        ? (state.language === 'RU' ? 'Светлая тема включена' : 'Light theme activated')
        : theme === 'dark'
          ? (state.language === 'RU' ? 'Тёмная тема включена' : 'Dark theme activated')
          : (state.language === 'RU' ? 'Системная тема выбрана' : 'System theme selected');
    triggerToast(message);
  };

  const handleUpdateProfile = (name: string, email: string) => {
    setState(prev => ({ ...prev, userProfile: { name, email } }));
    triggerToast(state.language === 'RU' ? 'Профиль сохранён' : 'Profile saved successfully');
  };

  const handleBackendSession = async (baseUrl: string, sessionAccessToken: string, sessionRefreshToken: string) => {
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    setApiBaseUrl(normalizedBaseUrl);
    setAccessToken(sessionAccessToken);
    setRefreshToken(sessionRefreshToken);
    persistConnection({
      apiBaseUrl: normalizedBaseUrl,
      accessToken: sessionAccessToken,
      refreshToken: sessionRefreshToken
    });

    const dashboard = await fetchDashboard(normalizedBaseUrl, sessionAccessToken);
    const messagesByInstance = new Map<string, number>();
    for (const message of dashboard.messages) {
      messagesByInstance.set(message.instanceId, (messagesByInstance.get(message.instanceId) || 0) + 1);
    }
    const instances = dashboard.instances.map(mapBackendInstanceToUi);
    const messages = dashboard.messages.map(mapBackendMessageToUi);
    const tokens = dashboard.tokens.map(mapBackendTokenToUi);
    const webhooks = buildWebhookItems(dashboard.instances, dashboard.webhookLogs);
    const logs = dashboard.logs.map(mapBackendLogToUi);

    setBackendUser(dashboard.user);
    setState(prev => ({
      ...prev,
      userProfile: { name: dashboard.user.name, email: dashboard.user.email },
      instances: instances.map(instance => ({
        ...instance,
        messagesToday: messagesByInstance.get(instance.id) || 0
      })),
      messages,
      tokens,
      webhooks,
      logs,
      selectedInstanceId: instances[0]?.id ?? prev.selectedInstanceId
    }));
    setBackendStatus('connected');
    setBackendError(null);
    triggerToast(state.language === 'RU' ? 'Подключено к реальному API' : 'Connected to the real API');
  };

  const handleBackendLogin = async (baseUrl: string, email: string, password: string) => {
    const session = await loginToBackend({
      apiBaseUrl: normalizeApiBaseUrl(baseUrl),
      email,
      password
    });
    await handleBackendSession(baseUrl, session.accessToken, session.refreshToken);
  };

  const handleBackendRegister = async (baseUrl: string, name: string, email: string, password: string) => {
    const session = await registerToBackend({
      apiBaseUrl: normalizeApiBaseUrl(baseUrl),
      name,
      email,
      password
    });
    await handleBackendSession(baseUrl, session.accessToken, session.refreshToken);
  };

  const handleBackendDisconnect = () => {
    clearStoredConnection();
    setBackendUser(null);
    setBackendError(null);
    setBackendStatus('demo');
    setApiBaseUrl(readStoredConnection().apiBaseUrl);
    setAccessToken(null);
    setRefreshToken(null);
    setState(createDemoAppState());
    triggerToast(state.language === 'RU' ? 'Подключение сброшено' : 'Backend connection cleared');
  };

  const handleAddNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumName.trim() || !newNumPhone.trim()) return;

    if (accessToken) {
      try {
        const created = await createBackendInstance(apiBaseUrl, accessToken, {
          name: newNumName.trim(),
          phoneNumber: newNumPhone.trim()
        });

        setState(prev => ({
          ...prev,
          instances: [created, ...prev.instances],
          selectedInstanceId: created.id,
          notificationCount: prev.notificationCount + 1
        }));
        setShowAddNumberModal(false);
        setNewNumName('');
        setNewNumPhone('+7 900 ');
        handleViewChange('instances');
        triggerToast(state.language === 'RU' ? 'Инстанс создан через API' : 'Instance created via API');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create instance';
        triggerToast(message);
      }
    }

    const newInst: Instance = {
      id: `inst-${Date.now()}`,
      name: newNumName.trim(),
      number: newNumPhone.trim(),
      provider: newNumProvider,
      status: 'Waiting QR',
      lastActive: state.language === 'RU' ? 'только что' : 'just now',
      messagesToday: 0,
      createdDate: nowString()
    };

    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      level: 'INFO',
      time: nowString(),
      module: 'System',
      message: `Создан новый инстанс "${newNumName}" (${newNumPhone})`,
      resource: `inst_${newInst.id.slice(-4)}`,
      status: 'Success'
    };

    setState(prev => ({
      ...prev,
      instances: [newInst, ...prev.instances],
      logs: [newLog, ...prev.logs],
      selectedInstanceId: newInst.id,
      notificationCount: prev.notificationCount + 1
    }));
    setShowAddNumberModal(false);
    setNewNumName('');
    setNewNumPhone('+7 900 ');
    handleViewChange('instances');
    triggerToast(state.language === 'RU' ? 'Номер добавлен. Отсканируйте QR код' : 'WhatsApp number added. Ready for QR scanning');
  };

  const handleUpdateInstanceStatus = async (id: string, status: Instance['status']) => {
    if (accessToken) {
      const backendStatus = status === 'Connected'
        ? 'CONNECTED'
        : status === 'Disconnected'
          ? 'DISCONNECTED'
          : status === 'Waiting QR'
            ? 'WAITING_QR'
            : 'RECONNECTING';

      try {
        const updated = await updateBackendInstanceStatus(apiBaseUrl, accessToken, id, backendStatus);
        setState(prev => ({
          ...prev,
          instances: prev.instances.map(item => (item.id === id ? updated : item))
        }));
        triggerToast(state.language === 'RU' ? 'Статус синхронизирован с API' : 'Status synced with API');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync instance status';
        triggerToast(message);
      }
    }

    setState(prev => ({
      ...prev,
      instances: prev.instances.map(inst =>
        inst.id === id ? { ...inst, status, lastActive: state.language === 'RU' ? 'только что' : 'just now' } : inst
      )
    }));
    triggerToast(state.language === 'RU' ? `Статус инстанса изменен на ${status}` : `Instance status updated to ${status}`);
  };

  const handleAddMessage = (msg: Message) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      level: 'INFO',
      time: nowString(),
      module: 'API',
      message: `Сообщение отправлено на ${msg.number}. Текст: "${msg.messageText.slice(0, 30)}..."`,
      resource: `inst_${state.selectedInstanceId?.slice(-4) || '01'}`,
      status: 'Success'
    };

    setState(prev => ({
      ...prev,
      messages: [msg, ...prev.messages],
      logs: [newLog, ...prev.logs]
    }));
    triggerToast(state.language === 'RU' ? 'Сообщение доставлено' : 'Message dispatched');
  };

  const handleAddToken = (token: ApiToken) => {
    setState(prev => ({
      ...prev,
      tokens: [token, ...prev.tokens],
      selectedTokenId: token.id
    }));
    triggerToast(state.language === 'RU' ? 'Новый API токен создан' : 'New secret API token issued');
  };

  const handleRevokeToken = (id: string) => {
    setState(prev => ({
      ...prev,
      tokens: prev.tokens.map(token => (token.id === id ? { ...token, status: 'Отозван' as const } : token))
    }));
    triggerToast(state.language === 'RU' ? 'API токен успешно отозван' : 'API token access revoked');
  };

  const handleAddWebhook = (webhook: Webhook) => {
    setState(prev => ({
      ...prev,
      webhooks: [webhook, ...prev.webhooks],
      selectedWebhookId: webhook.id
    }));
    triggerToast(state.language === 'RU' ? 'Конфигурация Webhook добавлена' : 'Webhook destination added');
  };

  const handleToggleWebhookActive = (id: string) => {
    setState(prev => ({
      ...prev,
      webhooks: prev.webhooks.map(item => (item.id === id ? { ...item, active: !item.active } : item))
    }));
    triggerToast(state.language === 'RU' ? 'Статус Webhook изменён' : 'Webhook toggle status modified');
  };

  const handleClearLogs = () => {
    setState(prev => ({ ...prev, logs: [], selectedLogId: null }));
    triggerToast(state.language === 'RU' ? 'Системные логи очищены' : 'All local system log feeds erased');
  };

  const handleSelectInstance = (id: string | null) => setState(prev => ({ ...prev, selectedInstanceId: id }));
  const handleSelectMessage = (id: string | null) => setState(prev => ({ ...prev, selectedMessageId: id }));
  const handleSelectToken = (id: string | null) => setState(prev => ({ ...prev, selectedTokenId: id }));
  const handleSelectWebhook = (id: string | null) => setState(prev => ({ ...prev, selectedWebhookId: id }));
  const handleSelectLog = (id: string | null) => setState(prev => ({ ...prev, selectedLogId: id }));

  const renderViewContent = () => {
    switch (state.activeView) {
      case 'overview':
        return (
          <OverviewView
            state={state}
            onViewChange={handleViewChange}
            onAddNumberClick={() => setShowAddNumberModal(true)}
          />
        );
      case 'instances':
        return (
          <InstancesView
            state={state}
            onSelectInstance={handleSelectInstance}
            onAddNumberClick={() => setShowAddNumberModal(true)}
            onUpdateInstanceStatus={handleUpdateInstanceStatus}
          />
        );
      case 'messages':
        return (
          <MessagesView
            state={state}
            onSelectMessage={handleSelectMessage}
            onAddMessage={handleAddMessage}
            onSendMessageClick={() =>
              triggerToast(state.language === 'RU' ? 'Выберите клиента для отправки сообщения' : 'Select client to start messaging')
            }
          />
        );
      case 'tokens':
        return (
          <TokensView
            state={state}
            onSelectToken={handleSelectToken}
            onAddToken={handleAddToken}
            onRevokeToken={handleRevokeToken}
          />
        );
      case 'webhooks':
        return (
          <WebhooksView
            state={state}
            onSelectWebhook={handleSelectWebhook}
            onAddWebhook={handleAddWebhook}
            onToggleWebhookActive={handleToggleWebhookActive}
          />
        );
      case 'logs':
        return <LogsView state={state} onSelectLog={handleSelectLog} onClearLogs={handleClearLogs} />;
      case 'settings':
        return (
          <SettingsView
            state={state}
            onUpdateProfile={handleUpdateProfile}
            onUpdateLanguage={handleLanguageChange}
            onUpdateTheme={handleThemeChange}
            backendStatus={backendStatus}
            backendError={backendError}
            backendApiUrl={apiBaseUrl}
            backendUser={backendUser}
            onBackendApiUrlChange={setApiBaseUrl}
            onBackendLogin={handleBackendLogin}
            onBackendRegister={handleBackendRegister}
            onBackendDisconnect={handleBackendDisconnect}
          />
        );
      default:
        return <div className="py-20 text-center text-slate-400 font-semibold text-sm">Section under development</div>;
    }
  };

  return (
    <Layout
      state={state}
      sidebarOpen={sidebarOpen}
      onViewChange={handleViewChange}
      onSearchChange={handleSearchChange}
      onLanguageChange={handleLanguageChange}
      onThemeChange={handleThemeChange}
      onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      {renderViewContent()}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-xl shadow-slate-200/70">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ✓
          </div>
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {showAddNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowAddNumberModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            >
              ×
            </button>

            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Добавить WhatsApp номер</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Интеграция нового канала связи</p>
              </div>
            </div>

            <form onSubmit={handleAddNumberSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-400">Название инстанса</label>
                <input
                  type="text"
                  required
                  value={newNumName}
                  onChange={(e) => setNewNumName(e.target.value)}
                  placeholder="Например, Sales Bot"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-400">Номер телефона</label>
                <input
                  type="text"
                  required
                  value={newNumPhone}
                  onChange={(e) => setNewNumPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-400">Провайдер авторизации</label>
                <select
                  value={newNumProvider}
                  onChange={(e) => setNewNumProvider(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Baileys">Baileys (Web Multi-Device)</option>
                  <option value="Official">Official (WhatsApp Business Cloud API)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNumberModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Подключить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {backendStatus === 'error' && backendError && (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-lg">
          {backendError}
        </div>
      )}
    </Layout>
  );
}
