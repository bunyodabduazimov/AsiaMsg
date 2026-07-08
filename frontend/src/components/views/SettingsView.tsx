import React, { useEffect, useState } from 'react';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Save, 
  Check, 
  Lock, 
  Languages, 
  Clock, 
  ServerCrash 
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

  // Local state form fields
  const [userName, setUserName] = useState(state.userProfile.name);
  const [userEmail, setUserEmail] = useState(state.userProfile.email);
  const [userLang, setUserLang] = useState(state.language);
  const [userTheme] = useState<'light'>('light');
  const [userTimezone, setUserTimezone] = useState('Europe/Moscow');
  const [backendName, setBackendName] = useState(state.userProfile.name);
  const [backendEmail, setBackendEmail] = useState(state.userProfile.email);
  const [backendPassword, setBackendPassword] = useState('');
  
  const [autoReboot, setAutoReboot] = useState(true);
  const [multiDevice, setMultiDevice] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState('185.120.44.112, 10.124.0.0/16');

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setBackendName(backendUser?.name ?? state.userProfile.name);
    setBackendEmail(backendUser?.email ?? state.userProfile.email);
  }, [backendUser, state.userProfile.email, state.userProfile.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(userName, userEmail);
    onUpdateLanguage(userLang);
    onUpdateTheme(userTheme);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl text-left">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'Настройки' : 'Settings'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
            {isRu ? 'Конфигурация учетной записи, прав доступа и системных опций' : 'Global system parameters, security policies and user preferences'}
          </p>
        </div>
        
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>{isRu ? 'Сохранено!' : 'Changes Saved!'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isRu ? 'Сохранить изменения' : 'Save changes'}</span>
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">{isRu ? 'Подключение к backend' : 'Backend Connection'}</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            backendStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700'
              : backendStatus === 'loading'
                ? 'bg-amber-50 text-amber-700'
                : backendStatus === 'error'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
          }`}>
            {backendStatus === 'connected'
              ? (isRu ? 'Подключено' : 'Connected')
              : backendStatus === 'loading'
                ? (isRu ? 'Синхронизация' : 'Syncing')
                : backendStatus === 'error'
                  ? (isRu ? 'Ошибка' : 'Error')
              : (isRu ? 'Не подключено' : 'Not connected')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400">{isRu ? 'URL backend' : 'Backend URL'}</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 break-all">
              {backendApiUrl}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">{isRu ? 'Имя' : 'Name'}</label>
            <input
              type="text"
              value={backendName}
              onChange={(e) => setBackendName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">{isRu ? 'Email' : 'Email'}</label>
            <input
              type="email"
              value={backendEmail}
              onChange={(e) => setBackendEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400">{isRu ? 'Пароль' : 'Password'}</label>
            <input
              type="password"
              value={backendPassword}
              onChange={(e) => setBackendPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={backendStatus === 'loading'}
            onClick={() => onBackendLogin(backendEmail, backendPassword)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isRu ? 'Войти и синхронизировать' : 'Login & Sync'}
          </button>
          <button
            type="button"
            disabled={backendStatus === 'loading'}
            onClick={() => onBackendRegister(backendName, backendEmail, backendPassword)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isRu ? 'Зарегистрировать' : 'Register'}
          </button>
          <button
            type="button"
            onClick={onBackendDisconnect}
            className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            {isRu ? 'Отключить' : 'Disconnect'}
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          {backendUser ? (
            <span>
              {isRu ? 'Текущий пользователь:' : 'Current user:'} {backendUser.name} ({backendUser.email})
            </span>
          ) : (
            <span>{isRu ? 'Сейчас данные берутся только из backend API. Подключите backend, чтобы увидеть записи.' : 'All data comes from the backend API. Connect a backend to load records.'}</span>
          )}
        </div>

        {backendError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {backendError}
          </div>
        )}
      </div>

      {isSaved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 text-xs rounded-xl p-3.5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isRu ? 'Все настройки успешно применились и сохранены во временном сеансе.' : 'All system and security preferences updated successfully.'}</span>
        </div>
      )}

      {/* Grid container cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50 dark:border-slate-800">
            <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">{isRu ? 'Мой Профиль' : 'My Profile'}</h2>
          </div>

          {/* Avatar upload */}
          <div className="flex items-center gap-4 py-1.5">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-extrabold text-xl rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-900/40">
              {userName.charAt(0)}
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{isRu ? 'Аватар учетной записи' : 'Account Avatar'}</span>
              <div className="flex gap-2">
                <button type="button" className="px-3 py-1 bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 text-[10px] font-bold text-gray-600 dark:text-slate-400 border border-gray-200/50 dark:border-slate-800 rounded-lg cursor-pointer">
                  {isRu ? 'Обновить фото' : 'Change picture'}
                </button>
                <button type="button" className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 text-[10px] font-semibold text-rose-500 border border-rose-100 dark:border-rose-900/40 rounded-lg cursor-pointer">
                  {isRu ? 'Удалить' : 'Delete'}
                </button>
              </div>
            </div>
          </div>

          {/* Full name input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500">{isRu ? 'ФИО пользователя' : 'Full Name'}</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-800 dark:text-white focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Email input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500">{isRu ? 'Email адрес' : 'Email Address'}</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-800 dark:text-white focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Role (disabled) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500">{isRu ? 'Уровень доступа' : 'Access Level Role'}</label>
            <input
              type="text"
              value={isRu ? 'Администратор системы' : 'System Administrator'}
              disabled
              className="w-full bg-gray-100 dark:bg-slate-950/40 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* System parameters settings */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50 dark:border-slate-800">
            <Settings className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">{isRu ? 'Системные параметры' : 'System Preferences'}</h2>
          </div>

          {/* Global Language select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              <span>{isRu ? 'Язык интерфейса' : 'Interface Language'}</span>
            </label>
            <select
              value={userLang}
              onChange={(e) => setUserLang(e.target.value as 'RU' | 'EN')}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-semibold focus:outline-hidden focus:border-blue-500"
            >
              <option value="RU" className="dark:bg-slate-900">Русский язык (RU)</option>
              <option value="EN" className="dark:bg-slate-900">English language (EN)</option>
            </select>
          </div>

          {/* Timezone select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{isRu ? 'Часовой пояс системы' : 'System Timezone'}</span>
            </label>
            <select
              value={userTimezone}
              onChange={(e) => setUserTimezone(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-semibold focus:outline-hidden focus:border-blue-500"
            >
              <option value="Europe/Moscow" className="dark:bg-slate-900">Europe/Moscow (GMT+3)</option>
              <option value="Asia/Almaty" className="dark:bg-slate-900">Asia/Almaty (GMT+6)</option>
              <option value="Asia/Yekaterinburg" className="dark:bg-slate-900">Asia/Yekaterinburg (GMT+5)</option>
              <option value="UTC" className="dark:bg-slate-900">Coordinated Universal Time (UTC)</option>
            </select>
          </div>

          {/* Automatic reboot switch */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800">
            <div className="flex items-start gap-2.5">
              <ServerCrash className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-gray-700 dark:text-slate-300">{isRu ? 'Автоперезапуск инстанса' : 'Auto Reconnect Instance'}</span>
                <span className="block text-[10px] text-gray-400 dark:text-slate-500">{isRu ? 'Автоматически перезапускать инстанс при обрыве связи' : 'Attempt manual API restarts automatically'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoReboot(!autoReboot)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                autoReboot ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-3xs transition-transform ${
                autoReboot ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Multi-device WhatsApp authorization switch */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-start gap-2.5">
              <Globe className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-gray-700 dark:text-slate-300">{isRu ? 'Multi-device авторизация' : 'Multi-device Authorization'}</span>
                <span className="block text-[10px] text-gray-400 dark:text-slate-500">{isRu ? 'Разрешить несколько одновременных сессий инстансов' : 'Allow multiple simultaneous sessions per line'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMultiDevice(!multiDevice)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                multiDevice ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-3xs transition-transform ${
                multiDevice ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Security configuration policies */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50 dark:border-slate-800">
            <Lock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">{isRu ? 'Безопасность и Доступ' : 'Security Settings & Policy'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Two-Factor Authentications switch */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100/80 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-gray-800 dark:text-slate-200">{isRu ? 'Двухфакторная аутентификация (2FA)' : 'Two-Factor Authentication (2FA)'}</span>
                  <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{isRu ? 'Дополнительный уровень защиты аккаунта при входе' : 'Require TOTP security passcodes upon logging in'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactor(!twoFactor)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                  twoFactor ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-3xs transition-transform ${
                  twoFactor ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* IP Whitelisting input */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-gray-700 dark:text-slate-300">{isRu ? 'Белый список IP для API ключей (IP Whitelist)' : 'API IP Whitelist'}</span>
              <input
                type="text"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder={isRu ? "Например, 192.168.1.1, 10.0.0.0/24" : "e.g., 192.168.1.1"}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-800 dark:text-white font-mono focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
              <span className="block text-[10px] text-gray-400 dark:text-slate-500">
                {isRu ? 'Только указанные IP-адреса смогут отправлять сообщения через API ключи' : 'Restrict API integration callbacks exclusively to specified network gates'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
};
