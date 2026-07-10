import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  Plus,
  Smartphone
} from 'lucide-react';
import { Layout } from './components/Layout';
import { changeLanguage } from './i18n';
import { OverviewView } from './components/views/OverviewView';
import { InstancesView } from './components/views/InstancesView';
import { MessagesView } from './components/views/MessagesView';
import { ApiDocsPage } from './components/api-docs/ApiDocsPage';
import { WebhooksView } from './components/views/WebhooksView';
import { LogsView } from './components/views/LogsView';
import { SettingsView } from './components/views/SettingsView';
import { AuthPage } from './pages/AuthPage';
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
  logoutBackendInstance,
  buildWebhookItems,
  fetchBackendInstance,
  fetchBackendInstanceQr,
  fetchDashboard,
  getDefaultApiBaseUrl,
  loginToBackend,
  loginWithGoogleToBackend,
  normalizeApiBaseUrl,
  persistConnection,
  readStoredConnection,
  registerToBackend,
  mapBackendInstanceToUi,
  mapBackendMessageToUi,
  mapBackendTokenToUi,
  mapBackendLogToUi,
  sendBackendMessage,
  sendBackendInstanceWebhookTest,
  updateBackendInstance,
  updateBackendInstanceSettings,
  updateBackendInstanceStatus,
  ApiError,
  type BackendInstanceSettingsInput,
  type BackendUser
} from './lib/api';

type BackendConnectionStatus = 'idle' | 'loading' | 'connected' | 'error';

type CreatedApiKey = {
  instanceId: string;
  apiKey: string;
  apiKeyPreview: string;
};

const INSTANCE_API_KEYS_STORAGE_KEY = 'chatapi.instanceApiKeys';

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

const SIDEBAR_STATE_KEY = 'chatapi.sidebarOpen';
const LANGUAGE_STATE_KEY = 'chatapi_lang';
const THEME_STATE_KEY = 'chatapi.theme';

const getInitialLanguage = (): 'RU' | 'EN' => {
  if (typeof window === 'undefined') return 'RU';
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STATE_KEY);
  if (storedLanguage === 'ru') return 'RU';
  if (storedLanguage === 'en') return 'EN';
  return 'RU';
};

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = window.localStorage.getItem(THEME_STATE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme;
  }
  return 'light';
};

const isAuthSessionError = (error: unknown) => {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401) return true;
  return error.status === 404 && /user not found/i.test(error.message);
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
  language: getInitialLanguage(),
  theme: getInitialTheme(),
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

export default function App() {
  const storedConnection = readStoredConnection();
  const [state, setState] = useState<AppState>(() => ({
    ...createEmptyAppState(),
    activeView: typeof window !== 'undefined' && window.location.pathname !== '/login'
      ? getViewFromPath(window.location.pathname)
      : 'overview',
    selectedInstanceId: typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null
  }));
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;

    const storedValue = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (storedValue === 'true') return true;
    if (storedValue === 'false') return false;

    return window.innerWidth >= 768;
  });
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
  const [newNumProvider, setNewNumProvider] = useState('Baileys');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<CreatedApiKey | null>(null);
  const [instanceApiKeys, setInstanceApiKeys] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};

    try {
      const raw = window.sessionStorage.getItem(INSTANCE_API_KEYS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(
    !storedConnection.accessToken
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [lastConnectedToastInstanceId, setLastConnectedToastInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANGUAGE_STATE_KEY, state.language === 'RU' ? 'ru' : 'en');
  }, [state.language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_STATE_KEY, state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(INSTANCE_API_KEYS_STORAGE_KEY, JSON.stringify(instanceApiKeys));
  }, [instanceApiKeys]);

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
        if (isAuthSessionError(error)) {
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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    scrollWorkspaceToTop();
  };
  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleLanguageChange = (lang: 'RU' | 'EN') => {
    setState(prev => ({ ...prev, language: lang }));
    void changeLanguage(lang === 'RU' ? 'ru' : 'en');
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

  useEffect(() => {
    const selectedInstance = state.instances.find(item => item.id === state.selectedInstanceId) ?? null;

    if (!selectedInstance || !accessToken) {
      return;
    }

    const shouldPoll =
      selectedInstance.status === 'Waiting QR' ||
      selectedInstance.status === 'Reconnecting';

    if (!shouldPoll) {
      if (selectedInstance.status !== 'Connected' && lastConnectedToastInstanceId === selectedInstance.id) {
        setLastConnectedToastInstanceId(null);
      }
      return;
    }

    let cancelled = false;

    const syncSelectedInstance = async () => {
      try {
        const updated = await fetchBackendInstance(apiBaseUrl, accessToken, selectedInstance.id);
        if (cancelled) return;

        setState(prev => {
          const current = prev.instances.find(item => item.id === selectedInstance.id);
          const nextInstances = prev.instances.map(item =>
            item.id === selectedInstance.id
              ? {
                  ...item,
                  ...updated,
                  qrExpiresAt: updated.qrCode ? updated.qrExpiresAt ?? item.qrExpiresAt : undefined
                }
              : item
          );

          if (
            current &&
            current.status !== 'Connected' &&
            updated.status === 'Connected' &&
            lastConnectedToastInstanceId !== selectedInstance.id
          ) {
            setLastConnectedToastInstanceId(selectedInstance.id);
            triggerToast(
              state.language === 'RU'
                ? `WhatsApp успешно подключён: ${updated.number || updated.name}`
                : `WhatsApp connected successfully: ${updated.number || updated.name}`
            );
          }

          return {
            ...prev,
            instances: nextInstances
          };
        });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        }
      }
    };

    void syncSelectedInstance();
    const intervalId = window.setInterval(() => {
      void syncSelectedInstance();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [accessToken, apiBaseUrl, handleAuthRequired, lastConnectedToastInstanceId, state.instances, state.language, state.selectedInstanceId]);

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
      if (isAuthSessionError(error)) {
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
      replaceRoute(viewRoutes.overview);
      handleViewChange('overview');
      triggerToast(state.language === 'RU' ? 'Подключено к реальному API' : 'Connected to the real API');
    } catch (error) {
      if (isAuthSessionError(error)) {
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

  const handleBackendGoogleLogin = async (baseUrl: string, idToken: string) => {
    setBackendStatus('loading');
    setBackendError(null);
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    try {
      const session = await loginWithGoogleToBackend({
        apiBaseUrl: normalizedBaseUrl,
        idToken
      });
      await handleBackendSession(normalizedBaseUrl, session.accessToken, session.refreshToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login with Google';
      setBackendError(message);
      setBackendStatus('error');
      triggerToast(message);
      throw error;
    }
  };

  const handleBackendDisconnect = () => {
    clearStoredConnection();
    setBackendUser(null);
    setBackendError(null);
    setBackendStatus('idle');
    setShowAuthModal(true);
    setAccessToken(null);
    setRefreshToken(null);
    setState(createEmptyAppState());
    replaceRoute('/login');
    scrollWorkspaceToTop();
    triggerToast(state.language === 'RU' ? 'Подключение сброшено' : 'Backend connection cleared');
  };

  const handleAddNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumName.trim()) return;
    if (pendingAction) return;

    try {
      setPendingAction('instance:create');
      const created = await createBackendInstance(apiBaseUrl, accessToken, {
        name: newNumName.trim()
      });
      
      // Check if API key was created
      const storedApiKey = sessionStorage.getItem('createdInstanceApiKey');
      if (storedApiKey) {
        const apiKeyData = JSON.parse(storedApiKey);
        setCreatedApiKey(apiKeyData);
        setInstanceApiKeys(prev => ({
          ...prev,
          [apiKeyData.instanceId]: apiKeyData.apiKey
        }));
        setShowApiKeyModal(true);
        sessionStorage.removeItem('createdInstanceApiKey');
      }

      const connected = await connectBackendInstance(apiBaseUrl, accessToken, created.id);

      setState(prev => ({
        ...prev,
        instances: [connected, ...prev.instances.filter(item => item.id !== connected.id)],
        selectedInstanceId: connected.id
      }));
      setShowAddNumberModal(false);
      setNewNumName('');
      handleViewChange('instances');
      triggerToast(state.language === 'RU' ? 'Инстанс создан. API ключ сохранён в БД' : 'Instance created. API key saved to DB');
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

  const handleLogoutInstance = async (id: string) => {
    if (pendingAction) return;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      setPendingAction(`instance:logout:${id}`);
      await logoutBackendInstance(apiBaseUrl, accessToken, id);
      const updated = await fetchBackendInstance(apiBaseUrl, accessToken, id);

      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? updated : item)),
        selectedInstanceId: id
      }));

      triggerToast(
        state.language === 'RU'
          ? 'WhatsApp полностью отвязан. Для подключения нужен новый QR.'
          : 'WhatsApp fully logged out. New QR is required to connect again.'
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to logout WhatsApp instance';
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
        instances: prev.instances.map(item => (item.id === id ? { ...item, ...updated } : item)),
        webhooks: prev.webhooks.map(item => {
          if (item.instanceId !== id) return item;

          const configuredEvents = [
            updated.webhookOnReceived ? 'message.received' : null,
            updated.webhookOnCreate ? 'message.created' : null,
            updated.webhookOnAck ? 'message.ack' : null,
            updated.webhookDownloadMedia ? 'media.download' : null,
            updated.webhookOnReaction ? 'message.reaction' : null
          ].filter(Boolean) as string[];

          return {
            ...item,
            endpoint: updated.webhookUrl || '',
            endpointUrl: updated.webhookUrl || '',
            active: Boolean(updated.webhookUrl),
            configuredEvents,
            event: configuredEvents[0] || item.event,
            instance: updated.name
          };
        })
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

  const handleSendWebhookTest = async (id: string, input: BackendInstanceSettingsInput) => {
    if (pendingAction) return null;
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
      return null;
    }

    try {
      setPendingAction(`instance:webhook-test:${id}`);
      const result = await sendBackendInstanceWebhookTest(apiBaseUrl, accessToken, id, input);
      triggerToast(
        result.statusCode && result.statusCode >= 200 && result.statusCode < 300
          ? (state.language === 'RU' ? 'Тест вебхука отправлен' : 'Webhook test sent')
          : (state.language === 'RU' ? 'Тест вебхука завершился с ошибкой' : 'Webhook test failed')
      );
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
        return null;
      }
      const message = error instanceof Error ? error.message : 'Failed to send webhook test';
      triggerToast(message);
      return null;
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
    scrollWorkspaceToTop();

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
            apiKey={state.selectedInstanceId ? instanceApiKeys[state.selectedInstanceId] ?? null : null}
            onSelectInstance={handleSelectInstance}
            onAddNumberClick={() => setShowAddNumberModal(true)}
            onUpdateInstanceStatus={handleUpdateInstanceStatus}
            onLogoutInstance={handleLogoutInstance}
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
          <ApiDocsPage
            state={state}
            apiKey={state.selectedInstanceId ? instanceApiKeys[state.selectedInstanceId] ?? null : null}
            instanceApiKeys={instanceApiKeys}
          />
        );
      case 'webhooks':
        return (
          <WebhooksView
            state={state}
            onSelectWebhook={handleSelectWebhook}
            onUpdateInstanceSettings={handleUpdateInstanceSettings}
            onSendWebhookTest={handleSendWebhookTest}
            actionLoading={pendingAction?.startsWith('instance:settings:') ?? false}
            testLoading={pendingAction?.startsWith('instance:webhook-test:') ?? false}
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

  // If not authenticated — render auth page immediately, no Layout flash
  if (showAuthModal) {
    return (
      <AuthPage
        backendStatus={backendStatus}
        backendError={backendError}
        onClearError={() => setBackendError(null)}
        onLogin={async (email, password) => {
          await handleBackendLogin(apiBaseUrl, email, password);
        }}
        onGoogleLogin={async (idToken) => {
          await handleBackendGoogleLogin(apiBaseUrl, idToken);
        }}
        onRegister={async (input) => {
          await handleBackendRegister(apiBaseUrl, input.name, input.email, input.password);
        }}
      />
    );
  }

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

      {showApiKeyModal && createdApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">API ключ создан</h3>
                <p className="mt-0.5 text-[10px] text-slate-400">Сохраните ключ в безопасном месте</p>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">Instance ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdApiKey.instanceId}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdApiKey.instanceId);
                      setApiKeyCopied(true);
                      setTimeout(() => setApiKeyCopied(false), 2000);
                    }}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    {apiKeyCopied ? '✓' : 'Скопировать'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">API Ключ (только сейчас)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdApiKey.apiKey}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-mono text-amber-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdApiKey.apiKey);
                      setApiKeyCopied(true);
                      setTimeout(() => setApiKeyCopied(false), 2000);
                    }}
                    className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-200"
                  >
                    {apiKeyCopied ? '✓' : 'Скопировать'}
                  </button>
                </div>
                <p className="text-[10px] text-amber-700">⚠️ Сохраните ключ - он больше не будет показан!</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">Использование</label>
                <pre className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] overflow-auto max-h-24 text-slate-700">
{`curl -X POST http://localhost:4000/api/messages/text \\
  -H "X-API-Key: ${createdApiKey.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"instanceId":"${createdApiKey.instanceId}","remoteJid":"+992922772244","messageText":"Hello"}'`}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowApiKeyModal(false);
                setCreatedApiKey(null);
              }}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              Понял, ключ сохранён
            </button>
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
