import React, { useEffect, useState } from 'react';
import { Plus, Smartphone } from 'lucide-react';
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
  fetchAllMessages,
  fetchInstances,
  fetchDashboard,
  getDefaultApiBaseUrl,
  changePasswordToBackend,
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

const localizeAuthError = (message: string, language: 'RU' | 'EN') => {
  if (language !== 'RU') return message;

  const normalized = message.trim().toLowerCase();

  if (normalized === 'account not found or wrong password') {
    return 'Аккаунт не найден или пароль неверный.';
  }

  if (normalized === 'account already exists. please sign in.') {
    return 'Аккаунт уже существует. Пожалуйста, войдите.';
  }

  if (normalized === 'current password is incorrect') {
    return 'Текущий пароль введён неверно.';
  }

  if (normalized === 'invalid google token') {
    return 'Неверный токен Google.';
  }

  if (normalized === 'google token audience mismatch') {
    return 'Токен Google не подходит для этого приложения.';
  }

  if (normalized === 'google token expired') {
    return 'Токен Google истёк.';
  }

  if (normalized === 'google account email is not verified') {
    return 'Email Google-аккаунта не подтверждён.';
  }

  if (normalized === 'google sign-in is not configured on server') {
    return 'Вход через Google не настроен на сервере.';
  }

  if (normalized === 'google authorization code exchange failed') {
    return 'Не удалось обменять код авторизации Google.';
  }

  if (normalized === 'invalid google authorization code') {
    return 'Недействительный код авторизации Google.';
  }

  if (normalized === 'google id token was not returned') {
    return 'Google не вернул ID token.';
  }

  if (normalized === 'google authorization origin is missing') {
    return 'Не удалось определить origin для авторизации Google.';
  }

  if (normalized === 'google authorization request is missing required headers') {
    return 'Запрос авторизации Google не содержит нужные заголовки.';
  }

  if (normalized === 'invalid refresh token') {
    return 'Недействительный refresh token.';
  }

  if (normalized === 'unauthorized') {
    return 'Неавторизованный доступ.';
  }

  return message;
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

export function App() {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [instanceApiKeys, setInstanceApiKeys] = useState<Record<string, string>>({});
  const [showAuthModal, setShowAuthModal] = useState(
    !storedConnection.accessToken
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const selectedInstance = state.instances.find(item => item.id === state.selectedInstanceId) ?? null;

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

    const loadDashboard = async () => {
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
    };

    const loadInstancesOnly = async () => {
      const instances = await fetchInstances(apiBaseUrl, accessToken);
      if (!isMounted) return;
      applyInstancesData(instances);
      setBackendStatus('connected');
    };

    const loadMessagesPage = async () => {
      const [instances, messages] = await Promise.all([
        fetchInstances(apiBaseUrl, accessToken),
        fetchAllMessages(apiBaseUrl, accessToken)
      ]);
      if (!isMounted) return;
      applyMessagesData(instances, messages);
      setBackendStatus('connected');
    };

    const sync = async () => {
      try {
        if (state.activeView === 'overview' || state.activeView === 'webhooks' || state.activeView === 'logs') {
          await loadDashboard();
          return;
        }

        if (state.activeView === 'messages') {
          await loadMessagesPage();
          return;
        }

        await loadInstancesOnly();
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
  }, [accessToken, apiBaseUrl, state.activeView]);

  useEffect(() => {
    if (!accessToken || !state.selectedInstanceId) return;

    const selectedInstance = state.instances.find(item => item.id === state.selectedInstanceId);
    if (!selectedInstance || selectedInstance.apiKey) return;

    let cancelled = false;

    const syncSelectedInstance = async () => {
      try {
        const updated = await fetchBackendInstance(apiBaseUrl, accessToken, selectedInstance.id);
        if (cancelled) return;

        if (updated.apiKey) {
          setInstanceApiKeys(prev => ({
            ...prev,
            [updated.id]: updated.apiKey as string
          }));
        }

        setState(prev => ({
          ...prev,
          instances: prev.instances.map(item =>
            item.id === updated.id
              ? {
                  ...item,
                  ...updated
                }
              : item
          )
        }));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
        }
      }
    };

    void syncSelectedInstance();

    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, state.language, state.selectedInstanceId, selectedInstance?.apiKey]);

  useEffect(() => {
    if (!accessToken || state.activeView !== 'instances' || !state.selectedInstanceId) return;

    let cancelled = false;
    let inFlight = false;
    let timerId: number | undefined;

    const syncSelectedInstance = async () => {
      if (cancelled || inFlight) return;

      inFlight = true;
      try {
        const updated = await fetchBackendInstance(apiBaseUrl, accessToken, state.selectedInstanceId);
        if (cancelled) return;

        if (updated.apiKey) {
          setInstanceApiKeys(prev => ({
            ...prev,
            [updated.id]: updated.apiKey as string
          }));
        }

        setState(prev => ({
          ...prev,
          instances: prev.instances.map(item =>
            item.id === updated.id
              ? {
                  ...item,
                  ...updated
                }
              : item
          )
        }));
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
        }
      } finally {
        inFlight = false;
        if (!cancelled) {
          timerId = window.setTimeout(() => {
            void syncSelectedInstance();
          }, 5000);
        }
      }
    };

    void syncSelectedInstance();

    return () => {
      cancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [accessToken, apiBaseUrl, state.activeView, state.language, state.selectedInstanceId]);

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

  const applyInstancesData = (instances: Instance[]) => {
    const routeInstanceId = typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null;

    setState(prev => ({
      ...prev,
      instances,
      selectedInstanceId: routeInstanceId && instances.some(instance => instance.id === routeInstanceId)
        ? routeInstanceId
        : prev.selectedInstanceId && instances.some(instance => instance.id === prev.selectedInstanceId)
          ? prev.selectedInstanceId
          : null
    }));
  };

  const applyMessagesData = (instances: Instance[], messages: Message[]) => {
    const messagesByInstance = new Map<string, number>();
    for (const message of messages) {
      if (!message.instanceId) continue;
      messagesByInstance.set(message.instanceId, (messagesByInstance.get(message.instanceId) || 0) + 1);
    }

    const routeInstanceId = typeof window !== 'undefined' ? getInstanceIdFromPath(window.location.pathname) : null;

    setState(prev => ({
      ...prev,
      instances: instances.map(instance => ({
        ...instance,
        messagesToday: messagesByInstance.get(instance.id) || instance.messagesToday || 0
      })),
      messages,
      selectedInstanceId: routeInstanceId && instances.some(instance => instance.id === routeInstanceId)
        ? routeInstanceId
        : prev.selectedInstanceId && instances.some(instance => instance.id === prev.selectedInstanceId)
          ? prev.selectedInstanceId
          : null,
      selectedMessageId: messages[0]?.id ?? null,
      notificationCount: Math.min(3, messages.length)
    }));
  };

  const handleRefreshMessages = async () => {
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      const [instances, messages] = await Promise.all([
        fetchInstances(apiBaseUrl, accessToken),
        fetchAllMessages(apiBaseUrl, accessToken)
      ]);
      applyMessagesData(instances, messages);
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
      const message = error instanceof Error
        ? localizeAuthError(error.message, state.language)
        : (state.language === 'RU' ? 'Не удалось войти.' : 'Failed to login');
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
      const message = error instanceof Error
        ? localizeAuthError(error.message, state.language)
        : (state.language === 'RU' ? 'Не удалось зарегистрироваться.' : 'Failed to register');
      setBackendError(message);
      setBackendStatus('error');
      triggerToast(message);
    }
  };

  const handleBackendGoogleLogin = async (baseUrl: string, code: string) => {
    setBackendStatus('loading');
    setBackendError(null);
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    try {
      const session = await loginWithGoogleToBackend({
        apiBaseUrl: normalizedBaseUrl,
        code
      });
      await handleBackendSession(normalizedBaseUrl, session.accessToken, session.refreshToken);
    } catch (error) {
      const message = error instanceof Error
        ? localizeAuthError(error.message, state.language)
        : (state.language === 'RU' ? 'Не удалось войти через Google.' : 'Failed to login with Google');
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
      if (created.apiKey) {
        setInstanceApiKeys(prev => ({
          ...prev,
          [created.instance.id]: created.apiKey
        }));
      }
      setState(prev => ({
        ...prev,
        instances: [created.instance, ...prev.instances.filter(item => item.id !== created.instance.id)],
        selectedInstanceId: created.instance.id
      }));
      setShowAddNumberModal(false);
      setNewNumName('');
      void handleSelectInstance(created.instance.id);
      triggerToast(state.language === 'RU' ? 'Инстанс создан.' : 'Instance created.');

      void connectBackendInstance(apiBaseUrl, accessToken, created.instance.id)
        .then(connected => {
          setState(prev => ({
            ...prev,
            instances: prev.instances.map(item => (item.id === connected.id ? connected : item)),
            selectedInstanceId: connected.id
          }));
        })
        .catch(error => {
          const message = error instanceof Error ? error.message : 'Failed to connect instance';
          triggerToast(message);
        });
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

  const handleRefreshInstance = async (id: string) => {
    if (!accessToken) {
      handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР». Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
      return;
    }

    try {
      const updated = await fetchBackendInstance(apiBaseUrl, accessToken, id);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(item => (item.id === id ? updated : item)),
        selectedInstanceId: id
      }));

      if (updated.apiKey) {
        setInstanceApiKeys(prev => ({
          ...prev,
          [updated.id]: updated.apiKey as string
        }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? 'РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР». Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ.' : 'Session expired. Please sign in again.');
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to refresh instance';
      triggerToast(message);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!accessToken) {
      const message = state.language === 'RU'
        ? 'Сессия устарела. Войдите заново.'
        : 'Session expired. Please sign in again.';
      throw new Error(message);
    }

    try {
      const session = await changePasswordToBackend({
        apiBaseUrl,
        currentPassword,
        newPassword
      }, accessToken);
      await handleBackendSession(apiBaseUrl, session.accessToken, session.refreshToken);
      triggerToast(state.language === 'RU' ? 'Пароль изменён' : 'Password updated');
    } catch (error) {
      const message = error instanceof Error
        ? localizeAuthError(error.message, state.language)
        : (state.language === 'RU' ? 'Не удалось изменить пароль.' : 'Failed to change password');
      triggerToast(message);
      throw new Error(message);
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
      handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
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
        handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');
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
            apiKey={state.selectedInstanceId
              ? state.instances.find(instance => instance.id === state.selectedInstanceId)?.apiKey
                ?? instanceApiKeys[state.selectedInstanceId]
                ?? null
              : null}
            onSelectInstance={handleSelectInstance}
            onAddNumberClick={() => setShowAddNumberModal(true)}
            onUpdateInstanceStatus={handleUpdateInstanceStatus}
            onLogoutInstance={handleLogoutInstance}
            onRequestInstanceQr={handleRequestInstanceQr}
            onRefreshInstance={handleRefreshInstance}
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
            apiKey={state.selectedInstanceId
              ? state.instances.find(instance => instance.id === state.selectedInstanceId)?.apiKey
                ?? instanceApiKeys[state.selectedInstanceId]
                ?? null
              : null}
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
            onChangePassword={handleChangePassword}
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
        onGoogleLogin={async (code) => {
          await handleBackendGoogleLogin(apiBaseUrl, code);
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
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:shadow-slate-950/40">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ✓
          </div>
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {showAddNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <button
              onClick={() => {
                if (!pendingAction) setShowAddNumberModal(false);
              }}
              disabled={pendingAction !== null}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
            >
              ×
            </button>

            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Добавить WhatsApp номер</h3>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">Интеграция нового канала связи</p>
              </div>
            </div>

            <form onSubmit={handleAddNumberSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Название инстанса</label>
                <input
                  type="text"
                  required
                  value={newNumName}
                  onChange={(e) => setNewNumName(e.target.value)}
                  placeholder="Например, Sales Bot"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNumberModal(false)}
                  disabled={pendingAction !== null}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={pendingAction !== null}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
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
