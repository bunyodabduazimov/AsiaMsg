const fs = require('fs');

const path = 'D:/Projects/AsiaMsg/frontend/src/App.tsx';
let text = fs.readFileSync(path, 'latin1');

const sessionRe = /  const handleBackendSession = async \(baseUrl: string, sessionAccessToken: string, sessionRefreshToken: string\) => \{[\s\S]*?  const handleBackendLogin = async/;
const sessionReplacement = `  const handleBackendSession = async (baseUrl: string, sessionAccessToken: string, sessionRefreshToken: string) => {
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
    setApiBaseUrl(normalizedBaseUrl);
    setAccessToken(sessionAccessToken);
    setRefreshToken(sessionRefreshToken);
    persistConnection({
      apiBaseUrl: normalizedBaseUrl,
      accessToken: sessionAccessToken,
      refreshToken: sessionRefreshToken
    });

    try {
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
        selectedInstanceId: instances[0]?.id ?? null,
        selectedMessageId: messages[0]?.id ?? null,
        selectedTokenId: tokens[0]?.id ?? null,
        selectedWebhookId: webhooks[0]?.id ?? null,
        selectedLogId: logs[0]?.id ?? null,
        notificationCount: Math.min(3, messages.length + logs.length)
      }));
      setBackendStatus('connected');
      setBackendError(null);
      triggerToast(state.language === 'RU' ? '\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e \u043a \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c\u0443 API' : 'Connected to the real API');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? '\u0421\u0435\u0441\u0441\u0438\u044f \u0443\u0441\u0442\u0430\u0440\u0435\u043b\u0430. \u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0437\u0430\u043d\u043e\u0432\u043e.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to connect to backend';
      setBackendError(message);
      setBackendStatus('error');
      triggerToast('Backend sync failed: ' + message);
    }
  };

  const handleBackendLogin = async`;
text = text.replace(sessionRe, sessionReplacement);

const authRe = /  const handleAuthRequired = \(message: string\) => \{[\s\S]*?  const handleBackendDisconnect = \(\) => \{/;
const authReplacement = `  const handleAuthRequired = (message: string) => {
    const preservedApiBaseUrl = apiBaseUrl;
    clearStoredConnection();
    setBackendUser(null);
    setBackendError(message);
    setBackendStatus('error');
    setApiBaseUrl(preservedApiBaseUrl);
    setAccessToken(null);
    setRefreshToken(null);
    setState(prev => ({
      ...prev,
      activeView: 'settings'
    }));

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }

    triggerToast(message);
  };

  const handleBackendDisconnect = () => {`;
text = text.replace(authRe, authReplacement);

const updRe = /  const handleUpdateInstanceStatus = async \(id: string, status: Instance\['status'\]\) => \{[\s\S]*?  const handleAddMessage = \(msg: Message\) => \{/;
const updReplacement = `  const handleUpdateInstanceStatus = async (id: string, status: Instance['status']) => {
    try {
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
      triggerToast(state.language === 'RU' ? '\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d \u0441 API' : 'Status synced with API');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleAuthRequired(state.language === 'RU' ? '\u0421\u0435\u0441\u0441\u0438\u044f \u0443\u0441\u0442\u0430\u0440\u0435\u043b\u0430. \u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0437\u0430\u043d\u043e\u0432\u043e.' : 'Session expired. Please sign in again.');
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to sync instance status';
      triggerToast(message);
    }
  };

  const handleAddMessage = (msg: Message) => {`;
text = text.replace(updRe, updReplacement);

text = text.replace(
  /handleAuthRequired\(state\.language === 'RU' \? '.*?' : 'Session expired\. Please sign in again\.'\);/g,
  "handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Profile saved successfully'\);/g,
  "triggerToast(state.language === 'RU' ? 'Профиль сохранён' : 'Profile saved successfully');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Backend connection cleared'\);/g,
  "triggerToast(state.language === 'RU' ? 'Подключение сброшено' : 'Backend connection cleared');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Instance created via API'\);/g,
  "triggerToast(state.language === 'RU' ? 'Реальный инстанс создан через API' : 'Instance created via API');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Status synced with API'\);/g,
  "triggerToast(state.language === 'RU' ? 'Статус синхронизирован с API' : 'Status synced with API');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Messages are available through the backend API only'\);/g,
  "triggerToast(state.language === 'RU' ? 'Сообщения пока доступны только через backend API' : 'Messages are available through the backend API only');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Tokens are available through the backend API only'\);/g,
  "triggerToast(state.language === 'RU' ? 'Токены пока доступны только через backend API' : 'Tokens are available through the backend API only');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Webhooks are available through the backend API only'\);/g,
  "triggerToast(state.language === 'RU' ? 'Webhook пока доступны только через backend API' : 'Webhooks are available through the backend API only');"
);

text = text.replace(
  /triggerToast\(state\.language === 'RU' \? '.*?' : 'Webhooks are read-only from the backend API'\);/g,
  "triggerToast(state.language === 'RU' ? 'Webhook доступны только для чтения через backend API' : 'Webhooks are read-only from the backend API');"
);

fs.writeFileSync(path, text, 'utf8');
