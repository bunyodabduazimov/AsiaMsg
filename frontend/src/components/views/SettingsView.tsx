import React, { useEffect, useState } from 'react';
import {
  Check,
  Globe,
  Languages,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Save,
  Settings,
  User
} from 'lucide-react';
import { AppState } from '../../types';

interface SettingsViewProps {
  state: AppState;
  onUpdateProfile: (name: string, email: string) => void;
  onUpdateLanguage: (lang: 'RU' | 'EN') => void;
  onUpdateTheme: (theme: 'light' | 'dark' | 'system') => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateProfile,
  onUpdateLanguage,
  onUpdateTheme,
  onChangePassword
}) => {
  const isRu = state.language === 'RU';

  const [profileName, setProfileName] = useState(state.userProfile.name);
  const [profileEmail, setProfileEmail] = useState(state.userProfile.email);
  const [language, setLanguage] = useState<'RU' | 'EN'>(state.language);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(state.theme);
  const [isSaved, setIsSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setProfileName(state.userProfile.name);
    setProfileEmail(state.userProfile.email);
    setLanguage(state.language);
    setTheme(state.theme);
  }, [state.language, state.theme, state.userProfile.email, state.userProfile.name]);

  useEffect(() => {
    if (!isSaved) return;
    const timerId = window.setTimeout(() => setIsSaved(false), 1800);
    return () => window.clearTimeout(timerId);
  }, [isSaved]);

  useEffect(() => {
    if (!passwordSuccess) return;
    const timerId = window.setTimeout(() => setPasswordSuccess(false), 1800);
    return () => window.clearTimeout(timerId);
  }, [passwordSuccess]);

  const handleSave = () => {
    onUpdateProfile(profileName.trim() || state.userProfile.name, profileEmail.trim() || state.userProfile.email);
    onUpdateLanguage(language);
    onUpdateTheme(theme);
    setIsSaved(true);
  };

  const handleChangePassword = async () => {
    if (passwordLoading) return;

    setPasswordError(null);
    setPasswordSuccess(false);

    const normalizedCurrentPassword = currentPassword.trim();
    const normalizedNewPassword = newPassword.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedCurrentPassword || !normalizedNewPassword || !normalizedConfirmPassword) {
      setPasswordError(isRu ? 'Заполните все поля пароля.' : 'Fill in all password fields.');
      return;
    }

    if (normalizedNewPassword.length < 8) {
      setPasswordError(isRu ? 'Новый пароль должен содержать минимум 8 символов.' : 'New password must be at least 8 characters.');
      return;
    }

    if (normalizedNewPassword !== normalizedConfirmPassword) {
      setPasswordError(isRu ? 'Новые пароли не совпадают.' : 'New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await onChangePassword(normalizedCurrentPassword, normalizedNewPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : (isRu ? 'Не удалось изменить пароль.' : 'Failed to change password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {isRu ? 'Настройки' : 'Settings'}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {isRu
              ? 'Имя, email, тема, язык и пароль доступны в одном месте.'
              : 'Name, email, theme, language, and password are managed in one place.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isSaved ? (isRu ? 'Сохранено' : 'Saved') : (isRu ? 'Сохранить изменения' : 'Save changes')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500">
                  {isRu ? 'Email' : 'Email'}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={event => setProfileEmail(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                >
                  <option value="light">{isRu ? 'Светлая' : 'Light'}</option>
                  <option value="dark">{isRu ? 'Тёмная' : 'Dark'}</option>
                  <option value="system">{isRu ? 'Системная' : 'System'}</option>
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
              {isRu
                ? 'Эти изменения сохраняются в текущем браузере после нажатия кнопки сохранения.'
                : 'These changes are saved in the current browser after you press save.'}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isRu ? 'Смена пароля' : 'Change password'}
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {passwordError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {isRu ? 'Пароль изменён.' : 'Password updated.'}
                </div>
              )}

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {isRu ? 'Текущий пароль' : 'Current password'}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={event => setCurrentPassword(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(prev => !prev)}
                    className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showCurrentPassword ? (isRu ? 'Скрыть пароль' : 'Hide password') : (isRu ? 'Показать пароль' : 'Show password')}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {isRu ? 'Новый пароль' : 'New password'}
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={event => setNewPassword(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showNewPassword ? (isRu ? 'Скрыть пароль' : 'Hide password') : (isRu ? 'Показать пароль' : 'Show password')}
                    >
                      {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {isRu ? 'Повторите пароль' : 'Confirm password'}
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950 dark:focus-within:bg-slate-950">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showConfirmPassword ? (isRu ? 'Скрыть пароль' : 'Hide password') : (isRu ? 'Показать пароль' : 'Show password')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleChangePassword()}
                disabled={passwordLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {passwordLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {isRu ? 'Изменить пароль' : 'Change password'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
