import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Globe,
  Languages,
  Lock,
  LogOut,
  Mail,
  Save,
  Server,
  ShieldCheck,
  Settings,
  Smartphone,
  User
} from 'lucide-react';
import { AppState } from '../../types';
import { getDefaultApiBaseUrl } from '../../lib/api';

interface SettingsViewProps {
  state: AppState;
  onUpdateProfile: (name: string, email: string) => void;
  onUpdateLanguage: (lang: 'RU' | 'EN') => void;
  onUpdateTheme: (theme: 'light' | 'dark' | 'system') => void;
  backendStatus: 'idle' | 'loading' | 'connected' | 'error';
  backendError: string | null;
  backendUser: { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; createdAt: string; updatedAt: string } | null;
  onBackendLogin: (email: string, password: string) => Promise<void>;
  onBackendRegister: (name: string, email: string, password: string) => Promise<void>;
  onBackendDisconnect: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateProfile,
  onUpdateLanguage,
  onUpdateTheme,
  backendStatus,
  backendError,
  backendUser,
  onBackendLogin,
  onBackendRegister,
  onBackendDisconnect
}) => {
  const isRu = state.language === 'RU';
  const backendApiUrl = getDefaultApiBaseUrl();

  const [profileName, setProfileName] = useState(state.userProfile.name);
  const [profileEmail, setProfileEmail] = useState(state.userProfile.email);
  const [language, setLanguage] = useState<'RU' | 'EN'>(state.language);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(state.theme);

  const [loginName, setLoginName] = useState(state.userProfile.name);
  const [loginEmail, setLoginEmail] = useState(state.userProfile.email);
  const [loginPassword, setLoginPassword] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [authAction, setAuthAction] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    setProfileName(state.userProfile.name);
    setProfileEmail(state.userProfile.email);
    setLanguage(state.language);
    setTheme(state.theme);
  }, [state.language, state.theme, state.userProfile.email, state.userProfile.name]);

  useEffect(() => {
    setLoginName(backendUser?.name ?? state.userProfile.name);
    setLoginEmail(backendUser?.email ?? state.userProfile.email);
  }, [backendUser, state.userProfile.email, state.userProfile.name]);

  useEffect(() => {
    if (!isSaved) return;
    const timerId = window.setTimeout(() => setIsSaved(false), 1800);
    return () => window.clearTimeout(timerId);
  }, [isSaved]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    onUpdateProfile(profileName.trim() || state.userProfile.name, profileEmail.trim() || state.userProfile.email);
    onUpdateLanguage(language);
    onUpdateTheme(theme);
    setIsSaved(true);
  };

  const handleLogin = async () => {
    if (authAction || backendStatus === 'loading') return;
    setAuthAction('login');
    try {
      await onBackendLogin(loginEmail, loginPassword);
    } finally {
      setAuthAction(null);
    }
  };

  const handleRegister = async () => {
    if (authAction || backendStatus === 'loading') return;
    setAuthAction('register');
    try {
      await onBackendRegister(loginName, loginEmail, loginPassword);
    } finally {
      setAuthAction(null);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {isRu ? 'Настройки' : 'Settings'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {isRu
              ? 'Профиль, интерфейс и параметры подключения к backend в одном месте.'
              : 'Profile, interface, and backend connection settings in one place.'}
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? (isRu ? 'Сохранено' : 'Saved') : (isRu ? 'Сохранить изменения' : 'Save changes')}
        </button>
      </div>

      {backendStatus === 'error' && backendError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {backendError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isRu ? 'Профиль' : 'Profile'}
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500">
                  {isRu ? 'Имя' : 'Name'}
                </span>
                <input
                  type="text"
                  value={profileName}
                  onChange={event => setProfileName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500">
                  {isRu ? 'Email' : 'Email'}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={event => setProfileEmail(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none"
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isRu ? 'Текущая роль' : 'Current role'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {isRu ? 'Роль приходит из backend' : 'Role is provided by the backend'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {backendUser?.role ?? 'USER'}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isRu ? 'Интерфейс' : 'Interface'}
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Languages className="h-3.5 w-3.5" />
                  {isRu ? 'Язык' : 'Language'}
                </span>
                <select
                  value={language}
                  onChange={event => setLanguage(event.target.value as 'RU' | 'EN')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="RU">Русский</option>
                  <option value="EN">English</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Globe className="h-3.5 w-3.5" />
                  {isRu ? 'Тема' : 'Theme'}
                </span>
                <select
                  value={theme}
                  onChange={event => setTheme(event.target.value as 'light' | 'dark' | 'system')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="light">{isRu ? 'Светлая' : 'Light'}</option>
                  <option value="dark">{isRu ? 'Тёмная' : 'Dark'}</option>
                  <option value="system">{isRu ? 'Системная' : 'System'}</option>
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {isRu
                ? 'Эти изменения применяются сразу после сохранения и остаются в текущем браузере.'
                : 'These changes apply immediately after saving and remain in the current browser.'}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {isRu ? 'Подключение к backend' : 'Backend connection'}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700'
                    : backendStatus === 'loading'
                      ? 'bg-amber-50 text-amber-700'
                      : backendStatus === 'error'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {backendStatus === 'connected'
                  ? (isRu ? 'Подключено' : 'Connected')
                  : backendStatus === 'loading'
                    ? (isRu ? 'Синхронизация' : 'Syncing')
                    : backendStatus === 'error'
                      ? (isRu ? 'Ошибка' : 'Error')
                      : (isRu ? 'Не подключено' : 'Not connected')}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {isRu ? 'URL backend' : 'Backend URL'}
                </span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 break-all">
                  {backendApiUrl}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {isRu ? 'Email для входа' : 'Login email'}
                  </span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={event => setLoginEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {isRu ? 'Пароль' : 'Password'}
                  </span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={event => setLoginPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {isRu ? 'Имя для регистрации' : 'Registration name'}
                  </span>
                  <input
                    type="text"
                    value={loginName}
                    onChange={event => setLoginName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleLogin()}
                  disabled={backendStatus === 'loading' || authAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authAction === 'login' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  {isRu ? 'Войти и синхронизировать' : 'Login & sync'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleRegister()}
                  disabled={backendStatus === 'loading' || authAction !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authAction === 'register' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {isRu ? 'Зарегистрировать' : 'Register'}
                </button>

                <button
                  type="button"
                  onClick={onBackendDisconnect}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isRu ? 'Отключить' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isRu ? 'Сводка безопасности' : 'Security summary'}
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isRu ? 'Аккаунт' : 'Account'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {isRu ? 'Информация из backend /auth/me' : 'Data from backend /auth/me'}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {backendUser ? `${backendUser.name}` : (isRu ? 'Не загружен' : 'Not loaded')}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isRu ? 'Роль' : 'Role'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {isRu ? 'Текущие права доступа' : 'Current access rights'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {backendUser?.role ?? 'USER'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isRu ? 'Режим' : 'Mode'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {isRu ? 'Параметры сохраняются локально в браузере' : 'Preferences are saved locally in the browser'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  <Globe className="h-3.5 w-3.5" />
                  {isRu ? 'Локально' : 'Local'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
};
