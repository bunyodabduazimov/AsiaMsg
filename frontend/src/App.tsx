import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  User,
  UserPlus
} from 'lucide-react';
import { Layout } from './components/Layout';
import { OverviewView } from './components/views/OverviewView';
import { InstancesView } from './components/views/InstancesView';
import { MessagesView } from './components/views/MessagesView';
import { ApiDocsPage } from './components/api-docs/ApiDocsPage';
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
  clearStoredConnection,
  connectBackendInstance,
  createBackendInstance,
  deleteBackendInstance,
  disconnectBackendInstance,
  buildWebhookItems,
  fetchBackendInstance,
  fetchBackendInstanceQr,
  fetchDashboard,
  getDefaultApiBaseUrl,
  loginToBackend,
  normalizeApiBaseUrl,
  persistConnection,
  readStoredConnection,
  registerToBackend,
  mapBackendInstanceToUi,
  mapBackendMessageToUi,
  mapBackendTokenToUi,
  mapBackendLogToUi,
  sendBackendMessage,
  updateBackendInstance,
  updateBackendInstanceSettings,
  updateBackendInstanceStatus,
  ApiError,
  type BackendInstanceSettingsInput,
  type BackendUser
} from './lib/api';

type BackendConnectionStatus = 'idle' | 'loading' | 'connected' | 'error';

const viewRoutes: Record<ActiveView, string> = {
  overview: '/overview',
  instances: '/instances',
  messages: '/messages',
  tokens: '/api-docs',
  webhooks: '/webhooks',
  logs: '/logs',
  settings: '/settings'
};

const routeViews: Record<string, ActiveView> = {
  '/': 'overview',
  '/overview': 'overview',
  '/instances': 'instances',
  '/messages': 'messages',
  '/api-docs': 'tokens',
  '/api-tokens': 'tokens',
  '/tokens': 'tokens',
  '/webhooks': 'webhooks',
  '/logs': 'logs',
  '/settings': 'settings'
};

const getViewFromPath = (path: string): ActiveView => {
  if (path === '/instances' || path.startsWith('/instances/')) {
    return 'instances';
  }

  return routeViews[path] ?? 'overview';
};

const getInstanceIdFromPath = (path: string) => {
  const match = path.match(/^\/instances\/([^/]+)$/);
  return match?.[1] ?? null;
};

const replaceRoute = (path: string) => {
  if (typeof window === 'undefined' || window.location.pathname === path) return;
  window.history.replaceState({}, '', path);
};

const pushRoute = (path: string) => {
  if (typeof window === 'undefined' || window.location.pathname === path) return;
  window.history.pushState({}, '', path);
};

const createEmptyAppState = (): AppState => ({
  activeView: 'overview',
  language: 'RU',
  theme: 'light',
  userProfile: {
    name: '',
    email: ''
  },
  instances: [],
  messages: [],
  tokens: [],
  webhooks: [],
  logs: [],
  selectedInstanceId: null,
  selectedMessageId: null,
  selectedTokenId: null,
  selectedWebhookId: null,
  selectedLogId: null,
  searchQuery: '',
  notificationCount: 0
});
const nowString = () =>
  new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU');

export default function App() {
  const storedConnection = readStoredConnection();
  const [state, setState] = useState<AppState>(() => ({
    ...createEmptyAppState(),
    activeView: typeof window !== 'undefined' && window.location.pathname !== '/login'
      ? getViewFromPath(window.location.pathname)
      : 'overview',
    selectedInstanceId: typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null
  }));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>(
    storedConnection.accessToken ? 'loading' : 'idle'
  );
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const apiBaseUrl = getDefaultApiBaseUrl();
  const [accessToken, setAccessToken] = useState<string | null>(storedConnection.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(storedConnection.refreshToken);
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [newNumName, setNewNumName] = useState('');
  const [newNumPhone, setNewNumPhone] = useState('');
  const [newNumProvider, setNewNumProvider] = useState('Baileys');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(
    !storedConnection.accessToken
  );
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3200);
  };

  const scrollWorkspaceToTop = () => {
    if (typeof document === 'undefined') return;
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (window.location.pathname === '/login') {
        if (!accessToken) {
          setShowAuthModal(true);
          setShowAddNumberModal(false);
        }
        return;
      }

      const nextInstanceId = getInstanceIdFromPath(window.location.pathname);
      setShowAuthModal(!accessToken);
      setState(prev => ({
        ...prev,
        activeView: getViewFromPath(window.location.pathname),
        selectedInstanceId: nextInstanceId
      }));
      scrollWorkspaceToTop();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setShowAuthModal(true);
      setShowAddNumberModal(false);
      setBackendUser(null);
      setBackendError(null);
      setState(prev => ({
        ...prev,
        instances: [],
        messages: [],
        tokens: [],
        webhooks: [],
        logs: [],
        selectedInstanceId: null,
        selectedMessageId: null,
        selectedTokenId: null,
        selectedWebhookId: null,
        selectedLogId: null
      }));
      setBackendStatus('idle');
      return;
    }

    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      replaceRoute(viewRoutes[state.activeView] ?? viewRoutes.overview);
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

        const routeInstanceId = typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null;
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
          selectedInstanceId: routeInstanceId && instances.some(instance => instance.id === routeInstanceId)
            ? routeInstanceId
            : null,
          selectedMessageId: messages[0]?.id ?? null,
          selectedTokenId: tokens[0]?.id ?? null,
          selectedWebhookId: webhooks[0]?.id ?? null,
          selectedLogId: logs[0]?.id ?? null,
          notificationCount: Math.min(3, messages.length + logs.length)
        }));
        setBackendStatus('connected');
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof ApiError && error.status === 401) {
          handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
          return;
        }
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
    pushRoute(viewRoutes[view]);
    setState(prev => ({
      ...prev,
      activeView: view,
      selectedInstanceId: view === 'instances' ? null : prev.selectedInstanceId,
      selectedMessageId: prev.selectedMessageId,
      selectedTokenId: prev.selectedTokenId,
      selectedWebhookId: prev.selectedWebhookId,
      selectedLogId: prev.selectedLogId
    }));
    setSidebarOpen(false);
    scrollWorkspaceToTop();
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

  const handleAuthRequired = (message: string) => {
    clearStoredConnection();
    setShowAuthModal(true);
    setShowAddNumberModal(false);
    setNewNumName('');
    setNewNumPhone('');
    setAuthPassword('');
    setBackendUser(null);
    setBackendError(message);
    setBackendStatus('error');
    setAccessToken(null);
    setRefreshToken(null);
    setState(prev => ({
      ...prev,
      activeView: 'settings'
    }));
    replaceRoute('/login');
    scrollWorkspaceToTop();
    triggerToast(message);
  };

  const applyDashboardData = (dashboard: Awaited<ReturnType<typeof fetchDashboard>>) => {
    const messagesByInstance = new Map<string, number>();
    for (const message of dashboard.messages) {
      messagesByInstance.set(message.instanceId, (messagesByInstance.get(message.instanceId) || 0) + 1);
    }

    const instances = dashboard.instances.map(mapBackendInstanceToUi);
    const messages = dashboard.messages.map(mapBackendMessageToUi);
    const tokens = dashboard.tokens.map(mapBackendTokenToUi);
    const webhooks = buildWebhookItems(dashboard.instances, dashboard.webhookLogs);
    const logs = dashboard.logs.map(mapBackendLogToUi);
    const routeInstanceId = typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null;

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
      selectedInstanceId: routeInstanceId && instances.some(instance => instance.id === routeInstanceId)
        ? routeInstanceId
        : null,
      selectedMessageId: messages[0]?.id ?? null,
      selectedTokenId: tokens[0]?.id ?? null,
      selectedWebhookId: webhooks[0]?.id ?? null,
      selectedLogId: logs[0]?.id ?? null,
      notificationCount: Math.min(3, messages.length + logs.length)
    }));
  };

  const handleRefreshMessages = async () => {
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      const dashboard = await fetchDashboard(apiBaseUrl, accessToken);
      applyDashboardData(dashboard);
      triggerToast(state.language === 'RU' ? 'Сообщения обновлены' : 'Messages refreshed');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to refresh messages';
      triggerToast(message);
    }
  };

  const handleBackendSession = async (baseUrl: string, sessionAccessToken: string, sessionRefreshToken: string) => {
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    setBackendStatus('loading');
    setBackendError(null);
    setAccessToken(sessionAccessToken);
    setRefreshToken(sessionRefreshToken);
    persistConnection({
      apiBaseUrl: normalizedBaseUrl,
      accessToken: sessionAccessToken,
      refreshToken: sessionRefreshToken
    });

    try {
      const dashboard = await fetchDashboard(normalizedBaseUrl, sessionAccessToken);
      applyDashboardData(dashboard);
      setBackendStatus('connected');
      setShowAuthModal(false);
      setAuthPassword('');
      replaceRoute(viewRoutes.overview);
      handleViewChange('overview');
      triggerToast(state.language === 'RU' ? 'Подключено к реальному API' : 'Connected to the real API');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to connect to backend';
      setBackendError(message);
      setBackendStatus('error');
      triggerToast(message);
    }
  };

  const handleBackendLogin = async (baseUrl: string, email: string, password: string) => {
    setBackendStatus('loading');
    setBackendError(null);
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    try {
      const session = await loginToBackend({
        apiBaseUrl: normalizedBaseUrl,
        email,
        password
      });
      await handleBackendSession(normalizedBaseUrl, session.accessToken, session.refreshToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      setBackendError(message);
      setBackendStatus('error');
      triggerToast(message);
    }
  };

  const handleBackendRegister = async (baseUrl: string, name: string, email: string, password: string) => {
    setBackendStatus('loading');
    setBackendError(null);
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    try {
      const session = await registerToBackend({
        apiBaseUrl: normalizedBaseUrl,
        name,
        email,
        password
      });
      await handleBackendSession(normalizedBaseUrl, session.accessToken, session.refreshToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      setBackendError(message);
      setBackendStatus('error');
      triggerToast(message);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = authEmail.trim();
    const password = authPassword.trim();

    if (!email || !password) {
      setBackendError(state.language === 'RU' ? 'Введите email и пароль.' : 'Enter email and password.');
      setBackendStatus('error');
      return;
    }

    if (authMode === 'register') {
      await handleBackendRegister(apiBaseUrl, authName.trim() || 'Administrator', email, password);
      return;
    }

    await handleBackendLogin(apiBaseUrl, email, password);
  };

  const handleBackendDisconnect = () => {
    clearStoredConnection();
    setBackendUser(null);
    setBackendError(null);
    setBackendStatus('idle');
    setShowAuthModal(true);
    setAuthPassword('');
    setAccessToken(null);
    setRefreshToken(null);
    setState(createEmptyAppState());
    replaceRoute('/login');
    scrollWorkspaceToTop();
    triggerToast(state.language === 'RU' ? 'Подключение сброшено' : 'Backend connection cleared');
  };

  const handleAddNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumName.trim() || !newNumPhone.trim()) return;
    if (pendingAction) return;

    try {
      setPendingAction('instance:create');
      const created = await createBackendInstance(apiBaseUrl, accessToken, {
        name: newNumName.trim(),
        phoneNumber: newNumPhone.trim()
      });
      const connected = await connectBackendInstance(apiBaseUrl, accessToken, created.id);

      setState(prev => ({
        ...prev,
        instances: [connected, ...prev.instances.filter(item => item.id !== connected.id)],
        selectedInstanceId: connected.id
      }));
      setShowAddNumberModal(false);
      setNewNumName('');
      setNewNumPhone('');
      handleViewChange('instances');
      triggerToast(state.language === 'RU' ? 'Реальный инстанс создан через API' : 'Instance created via API');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to create instance';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateInstanceStatus = async (id: string, status: Instance['status']) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:status:${id}`);
      if (status === 'Connected' || status === 'Waiting QR' || status === 'Reconnecting') {
        const updated = await connectBackendInstance(apiBaseUrl, accessToken, id);
        setState(prev => ({
          ...prev,
          instances: prev.instances.map(item => (item.id === id ? updated : item)),
          selectedInstanceId: id
        }));
        triggerToast(state.language === 'RU' ? 'Запущено реальное подключение WhatsApp. Отсканируйте QR-код.' : 'Real WhatsApp connection started. Scan the QR code.');
        return;
      }

      if (status === 'Disconnected') {
        const updated = await disconnectBackendInstance(apiBaseUrl, accessToken, id);
        setState(prev => ({
          ...prev,
          instances: prev.instances.map(item => (item.id === id ? updated : item)),
          selectedInstanceId: id
        }));
        triggerToast(state.language === 'RU' ? 'WhatsApp инстанс отключён.' : 'WhatsApp instance disconnected.');
        return;
      }

      const backendStatus = status === 'Connected'
        ? 'CONNECTED'
        : status === 'Disconnected'
          ? 'DISCONNECTED'
          : status === 'Waiting QR'
            ? 'WAITING_QR'
            : 'RECONNECTING';

      const updated = await updateBackendInstanceStatus(apiBaseUrl, accessToken, id, backendStatus);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? updated : item))
      }));
      triggerToast(state.language === 'RU' ? 'Статус синхронизирован с API' : 'Status synced with API');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to sync instance status';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRequestInstanceQr = async (id: string) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:qr:${id}`);
      const updated = await fetchBackendInstanceQr(apiBaseUrl, accessToken, id);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? updated : item)),
        selectedInstanceId: id
      }));
      triggerToast(state.language === 'RU' ? 'QR-РєРѕРґ РѕР±РЅРѕРІР»С‘РЅ. Р”РµР№СЃС‚РІРёС‚РµР»РµРЅ 60 СЃРµРєСѓРЅРґ.' : 'QR code refreshed. Valid for 60 seconds.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to get QR';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleRenameInstance = async (id: string, name: string) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:rename:${id}`);
      const updated = await updateBackendInstance(apiBaseUrl, accessToken, id, { name });
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? { ...item, ...updated } : item))
      }));
      triggerToast(state.language === 'RU' ? 'Название инстанса изменено' : 'Instance name updated');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to update instance';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUpdateInstanceSettings = async (id: string, input: BackendInstanceSettingsInput) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:settings:${id}`);
      const updated = await updateBackendInstanceSettings(apiBaseUrl, accessToken, id, input);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? { ...item, ...updated } : item))
      }));
      triggerToast(state.language === 'RU' ? 'Webhook настройки сохранены' : 'Webhook settings saved');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to update webhook settings';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:delete:${id}`);
      await deleteBackendInstance(apiBaseUrl, accessToken, id);
      setState(prev => {
        const deleted = prev.instances.find(item => item.id === id);
        const instances = prev.instances.filter(item => item.id !== id);
        const messages = prev.messages.filter(item => item.instanceId !== id);
        const tokens = prev.tokens.filter(item => item.instance !== deleted?.name);
        const webhooks = prev.webhooks.filter(item => item.instance !== deleted?.name);
        const logs = prev.logs.filter(item => item.resource !== id && item.resource !== deleted?.name);
        const selectedInstanceId = prev.selectedInstanceId === id ? instances[0]?.id ?? null : prev.selectedInstanceId;

        return {
          ...prev,
          instances,
          messages,
          tokens,
          webhooks,
          logs,
          selectedInstanceId,
          selectedMessageId: messages[0]?.id ?? null,
          selectedTokenId: tokens[0]?.id ?? null,
          selectedWebhookId: webhooks[0]?.id ?? null,
          selectedLogId: logs[0]?.id ?? null
        };
      });
      if (state.selectedInstanceId === id) {
        pushRoute('/instances');
      }
      triggerToast(state.language === 'RU' ? 'Инстанс удалён' : 'Instance deleted');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to delete instance';
      triggerToast(message);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSelectInstance = async (id: string | null) => {
    if (id) {
      pushRoute(`/instances/${id}`);
    } else {
      pushRoute('/instances');
    }

    setState(prev => ({ ...prev, selectedInstanceId: id }));

    if (!id || !accessToken) return;

    try {
      const updated = await fetchBackendInstance(apiBaseUrl, accessToken, id);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item =>
          item.id === id
            ? {
                ...item,
                ...updated,
                qrExpiresAt: updated.qrCode ? updated.qrExpiresAt ?? item.qrExpiresAt : undefined
              }
            : item
        )
      }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      }
    }
  };
  const handleSelectMessage = (id: string | null) => setState(prev => ({ ...prev, selectedMessageId: id }));
  const handleSelectToken = (id: string | null) => setState(prev => ({ ...prev, selectedTokenId: id }));
  const handleSelectWebhook = (id: string | null) => setState(prev => ({ ...prev, selectedWebhookId: id }));
  const handleSelectLog = (id: string | null) => setState(prev => ({ ...prev, selectedLogId: id }));

  const handleAddMessage = (msg: Message) => {
    triggerToast(state.language === 'RU' ? 'Сообщения пока доступны только через backend API' : 'Messages are available through the backend API only');
  };

  const handleCreateMessage = async (msg: Message) => {
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    const currentInstance = (msg.instanceId && state.instances.find(instance => instance.id === msg.instanceId))
      || state.instances.find(instance => instance.name === msg.instance)
      || state.instances[0];
    if (!currentInstance) {
      triggerToast(state.language === 'RU' ? 'Нет доступных инстансов' : 'No available instances');
      return;
    }

    try {
      const created = await sendBackendMessage(apiBaseUrl, accessToken, {
        instanceId: currentInstance.id,
        remoteJid: msg.number,
        messageText: msg.messageText,
        messageType: msg.attachmentName ? 'file' : 'text',
        attachment: msg.attachmentName
          ? {
              name: msg.attachmentName,
              type: msg.attachmentType || 'application/octet-stream',
              size: msg.attachmentSize || 0,
              dataBase64: msg.attachmentData
            }
          : null
      });

      const mapped = mapBackendMessageToUi(created);
      setState(prev => ({
        ...prev,
        messages: [mapped, ...prev.messages.filter(item => item.id !== mapped.id)],
        selectedMessageId: mapped.id
      }));
      triggerToast(state.language === 'RU' ? 'Сообщение отправлено' : 'Message sent');
      return mapped;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to send message';
      triggerToast(message);
      return undefined;
    }
  };

  const handleAddToken = (token: ApiToken) => {
    triggerToast(state.language === 'RU' ? 'Токены пока доступны только через backend API' : 'Tokens are available through the backend API only');
  };

  const handleRevokeToken = (id: string) => {
    triggerToast(state.language === 'RU' ? 'Токены доступны только для чтения через backend API' : 'Tokens are read-only from the backend API');
  };

  const handleAddWebhook = (webhook: Webhook) => {
    triggerToast(state.language === 'RU' ? 'Webhook пока доступны только через backend API' : 'Webhooks are available through the backend API only');
  };

  const handleToggleWebhookActive = (id: string) => {
    triggerToast(state.language === 'RU' ? 'Webhook доступны только для чтения через backend API' : 'Webhooks are read-only from the backend API');
  };

  const handleClearLogs = () => {
    triggerToast(state.language === 'RU' ? 'Логи приходят только из backend API' : 'Logs come from the backend API only');
  };

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
          accessToken={accessToken}
          onSelectInstance={handleSelectInstance}
          onAddNumberClick={() => setShowAddNumberModal(true)}
          onUpdateInstanceStatus={handleUpdateInstanceStatus}
          onRequestInstanceQr={handleRequestInstanceQr}
          onRenameInstance={handleRenameInstance}
          onDeleteInstance={handleDeleteInstance}
          onUpdateInstanceSettings={handleUpdateInstanceSettings}
          actionLoading={pendingAction !== null}
        />
        );
      case 'messages':
        return (
          <MessagesView
            state={state}
            onSelectMessage={handleSelectMessage}
            onAddMessage={handleCreateMessage}
            onRefreshMessages={handleRefreshMessages}
            onSendMessageClick={() =>
              triggerToast(state.language === 'RU' ? 'Выберите клиента для отправки сообщения' : 'Select client to start messaging')
            }
          />
        );
      case 'tokens':
        return (
          <ApiDocsPage state={state} accessToken={accessToken} />
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
            backendUser={backendUser}
            onBackendLogin={(email, password) => handleBackendLogin(apiBaseUrl, email, password)}
            onBackendRegister={(name, email, password) => handleBackendRegister(apiBaseUrl, name, email, password)}
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
      onLogout={handleBackendDisconnect}
    >
      {renderViewContent()}

      {false && showAuthModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAuthSubmit}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20"
          >
            <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-slate-950">Авторизация</h3>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                  Сессия не активна. Войдите заново, чтобы продолжить работу с backend API.
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="h-4 w-4" />
                Войти
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Регистрация
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Имя</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Администратор"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@asiamsg.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Пароль</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {backendError && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
                {backendError}
              </div>
            )}

            <button
              type="submit"
              disabled={backendStatus === 'loading'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {backendStatus === 'loading'
                ? 'Подключение...'
                : authMode === 'register'
                  ? 'Создать аккаунт и войти'
                  : 'Войти заново'}
            </button>
          </form>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#f6faff] text-slate-950">
          <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_95%_80%,rgba(59,130,246,0.20),transparent_30%),linear-gradient(115deg,#ffffff_0%,#f8fbff_45%,#eaf4ff_100%)]" />
            <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute right-10 top-10 hidden h-44 w-44 rounded-full border border-blue-200/70 lg:block" />
            <div className="absolute left-[35%] top-0 hidden h-full w-px rotate-12 bg-blue-100 lg:block" />

            <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
              <section className="flex flex-col justify-center">
                <div className="mb-12 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow-xl shadow-blue-500/25">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <div className="text-3xl font-black tracking-tight text-slate-950">
                    Asia<span className="text-blue-600">Msg</span>
                  </div>
                </div>

                <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-blue-100/80 px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp и бизнес-сообщения
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Интеграция WhatsApp
                  <span className="block text-blue-600">для вашего роста</span>
                </h1>
                <p className="mt-6 max-w-lg text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  AsiaMsg объединяет WhatsApp и другие каналы в единую платформу для продаж, поддержки и автоматизации коммуникаций.
                </p>

                <div className="mt-10 space-y-6">
                  {[
                    {
                      icon: MessageCircle,
                      title: 'Единый омниканальный чат',
                      text: 'Все сообщения и обращения клиентов в одном окне.'
                    },
                    {
                      icon: Bot,
                      title: 'Автоматизация и интеграции',
                      text: 'Готовые сценарии, рассылки и подключения к CRM/ERP.'
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Надёжность и безопасность',
                      text: 'Контроль ролей, журнал событий и защита данных.'
                    }
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-600 shadow-lg shadow-blue-100">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">{item.title}</h3>
                        <p className="mt-1 max-w-md text-sm font-medium leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex max-w-xl items-center gap-4 rounded-3xl border border-slate-200 bg-white/75 p-4 shadow-xl shadow-blue-100/60 backdrop-blur">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-950">Надёжная платформа для вашего бизнеса</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">Соответствие стандартам безопасности и непрерывная доступность.</div>
                  </div>
                </div>
              </section>

              <section className="mx-auto w-full max-w-2xl">
                <form
                  onSubmit={handleAuthSubmit}
                  className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/88 p-6 shadow-2xl shadow-blue-200/60 backdrop-blur-xl sm:p-10 lg:p-12"
                >
                  <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 bg-[radial-gradient(circle,rgba(37,99,235,0.18)_1px,transparent_1px)] [background-size:16px_16px]" />

                  <div className="relative text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner shadow-blue-200">
                      {authMode === 'register' ? <UserPlus className="h-10 w-10" /> : <Lock className="h-9 w-9" />}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      {authMode === 'register' ? 'Создайте аккаунт' : 'Добро пожаловать!'}
                    </h2>
                    <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
                      {authMode === 'register'
                        ? 'Заполните форму, чтобы начать работу с AsiaMsg'
                        : 'Войдите в свой аккаунт AsiaMsg'}
                    </p>
                  </div>

                  <div className="relative mt-8 space-y-4">
                    {authMode === 'register' && (
                      <label className="block">
                        <span className="sr-only">Ваше имя</span>
                        <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                          <User className="h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Ваше имя"
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                          />
                        </span>
                      </label>
                    )}

                    <label className="block">
                      <span className="sr-only">Email</span>
                      <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                        <Mail className="h-5 w-5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="Email"
                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                        />
                      </span>
                    </label>

                    {authMode === 'register' && (
                      <label className="block">
                        <span className="sr-only">Номер телефона</span>
                        <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm">
                          <Phone className="h-5 w-5 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="(___) ___-__-__"
                            inputMode="tel"
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                          />
                        </span>
                      </label>
                    )}

                    <label className="block">
                      <span className="sr-only">Пароль</span>
                      <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                        <KeyRound className="h-5 w-5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Пароль"
                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        <EyeOff className="h-5 w-5 text-slate-400" />
                      </span>
                    </label>

                    {authMode === 'register' && (
                      <label className="block">
                        <span className="sr-only">Подтвердите пароль</span>
                        <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                          <KeyRound className="h-5 w-5 text-slate-400" />
                          <input
                            type="password"
                            placeholder="Подтвердите пароль"
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                          />
                          <EyeOff className="h-5 w-5 text-slate-400" />
                        </span>
                      </label>
                    )}
                  </div>

                  {authMode === 'login' ? (
                    <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        Запомнить меня
                      </label>
                      <button type="button" className="font-bold text-blue-600 hover:text-blue-700">
                        Забыли пароль?
                      </button>
                    </div>
                  ) : (
                    <label className="relative mt-5 flex cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-slate-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white" />
                      <span>
                        Я принимаю <button type="button" className="font-bold text-blue-600">условия использования</button> и{' '}
                        <button type="button" className="font-bold text-blue-600">политику конфиденциальности</button>
                      </span>
                    </label>
                  )}

                  {backendError && (
                    <div className="relative mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-5 text-amber-900">
                      {backendError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={backendStatus === 'loading'}
                    className="relative mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-700 px-5 py-4 text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:from-sky-400 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {backendStatus === 'loading'
                      ? 'Подключение...'
                      : authMode === 'register'
                        ? 'Создать аккаунт'
                        : 'Войти'}
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <div className="relative my-7 flex items-center gap-5 text-sm font-medium text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span>{authMode === 'register' ? 'или' : 'или войдите через'}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  {authMode === 'login' && (
                    <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50">
                        Google
                      </button>
                      <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50">
                        GitHub
                      </button>
                    </div>
                  )}

                  <div className="relative mt-7 text-center text-sm font-semibold text-slate-500">
                    {authMode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setBackendError(null);
                        setAuthMode(authMode === 'register' ? 'login' : 'register');
                      }}
                      className="font-black text-blue-600 hover:text-blue-700"
                    >
                      {authMode === 'register' ? 'Войти' : 'Зарегистрируйтесь'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => {
                if (!pendingAction) setShowAddNumberModal(false);
              }}
              disabled={pendingAction !== null}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  placeholder="Введите номер в любом формате"
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
                  disabled={pendingAction !== null}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={pendingAction !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  <span>{pendingAction === 'instance:create' ? 'Подключение...' : 'Подключить'}</span>
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








