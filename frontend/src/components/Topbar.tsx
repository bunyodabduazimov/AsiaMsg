import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  MessageSquareCode,
  Menu,
  Languages,
  SunMedium,
  MoonStar,
  MonitorCog,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { ActiveView, AppState } from '../types';

interface TopbarProps {
  state: AppState;
  onSearchChange: (query: string) => void;
  onLanguageChange: (lang: 'RU' | 'EN') => void;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onMenuClick: () => void;
  onLogout: () => void;
  onViewChange: (view: ActiveView) => void;
}

type DropdownKey = 'language' | 'theme' | 'notifications' | null;

export const Topbar: React.FC<TopbarProps> = ({
  state,
  onSearchChange,
  onLanguageChange,
  onThemeChange,
  onMenuClick,
  onLogout,
  onViewChange
}) => {
  const { t } = useTranslation();
  const topbarRef = useRef<HTMLElement | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const mockNotifications = [
    { id: 1, text: t('topbar.notif1'), time: '1 мин. назад' },
    { id: 2, text: t('topbar.notif2'), time: '15 мин. назад' },
    { id: 3, text: t('topbar.notif3'), time: '1 ч. назад' }
  ];

  const closeDropdowns = () => setOpenDropdown(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (topbarRef.current && !topbarRef.current.contains(target)) {
        setShowProfileMenu(false);
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (key: DropdownKey) => {
    setShowProfileMenu(false);
    setOpenDropdown(prev => (prev === key ? null : key));
  };

  return (
    <header
      ref={topbarRef}
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onMenuClick}
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden min-w-0 flex-1 lg:block lg:max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 dark:text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('topbar.search')}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-950"
          />
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
            <kbd className="hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500 sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('language')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Language"
            >
              <Languages className="h-4.5 w-4.5" />
            </button>

            {openDropdown === 'language' && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeDropdowns} />
                <div className="absolute right-0 z-50 mt-2.5 w-40 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950">
                  <button
                    onClick={() => {
                      changeLanguage('ru');
                      onLanguageChange('RU');
                      closeDropdowns();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium ${
                      state.language === 'RU'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-slate-100 px-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">RU</span>
                      <span>Русский</span>
                    </span>
                    {state.language === 'RU' && <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      onLanguageChange('EN');
                      closeDropdowns();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium ${
                      state.language === 'EN'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-slate-100 px-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">EN</span>
                      <span>English</span>
                    </span>
                    {state.language === 'EN' && <Check className="h-4 w-4" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('theme')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Theme"
            >
              {state.theme === 'light' ? (
                <SunMedium className="h-4.5 w-4.5 text-amber-500" />
              ) : state.theme === 'dark' ? (
                <MoonStar className="h-4.5 w-4.5 text-slate-200" />
              ) : (
                <MonitorCog className="h-4.5 w-4.5 text-blue-500" />
              )}
            </button>

            {openDropdown === 'theme' && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeDropdowns} />
                <div className="absolute right-0 z-50 mt-2.5 w-44 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950">
                  <button
                    onClick={() => {
                      onThemeChange('light');
                      closeDropdowns();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium ${
                      state.theme === 'light'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <SunMedium className="h-4 w-4 text-amber-500" />
                      <span>{t('topbar.light')}</span>
                    </span>
                    {state.theme === 'light' && <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange('dark');
                      closeDropdowns();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium ${
                      state.theme === 'dark'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MoonStar className="h-4 w-4 text-slate-400 dark:text-slate-200" />
                      <span>{t('topbar.dark')}</span>
                    </span>
                    {state.theme === 'dark' && <Check className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange('system');
                      closeDropdowns();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium ${
                      state.theme === 'system'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MonitorCog className="h-4 w-4 text-blue-500" />
                      <span>{t('topbar.system')}</span>
                    </span>
                    {state.theme === 'system' && <Check className="h-4 w-4" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('notifications')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {state.notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-bold text-white dark:border-slate-950">
                  {state.notificationCount}
                </span>
              )}
            </button>

            {openDropdown === 'notifications' && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeDropdowns} />
                <div className="absolute right-0 z-50 mt-2.5 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between pb-2.5">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t('topbar.notifications')}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      {state.notificationCount} {state.language === 'RU' ? 'Новые' : 'New'}
                    </span>
                  </div>
                  <div className="space-y-3 pt-3">
                    {mockNotifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          onViewChange('logs');
                        }}
                        className="flex w-full flex-col gap-1 rounded-xl border-b border-slate-100 px-2 py-2 text-left transition hover:bg-slate-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-900"
                      >
                        <p className="text-xs text-slate-600 dark:text-slate-300">{n.text}</p>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{n.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                closeDropdowns();
              }}
              className="group flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5 transition-all hover:bg-white hover:shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/70 dark:ring-slate-700/80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 text-xs font-bold text-blue-700 ring-1 ring-blue-100 dark:from-blue-500/25 dark:to-sky-500/25 dark:text-blue-300 dark:ring-blue-500/20">
                {state.userProfile.name.charAt(0)}
              </div>

              <div className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
                  {state.userProfile.name}
                </span>
                <span className="hidden text-[10px] font-mono text-slate-400 dark:text-slate-500 xl:block">
                  {state.userProfile.email}
                </span>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-slate-400 transition-transform group-hover:translate-y-0.5 dark:text-slate-500 sm:block" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 z-50 mt-2.5 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950">
                  <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{t('topbar.profile')}</span>
                    <span className="block text-xs font-semibold text-blue-600 dark:text-blue-300">
                      {t('topbar.admin')}
                    </span>
                  </div>

                  <div className="space-y-0.5 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onViewChange('settings');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      {t('settings.profile')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onViewChange('settings');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      {t('settings.security')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onViewChange('tokens');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <MessageSquareCode className="h-4 w-4 text-slate-400" />
                      {t('nav.apiDocs')}
                    </button>
                  </div>

                  <div className="mt-1.5 border-t border-slate-100 px-1 pt-1.5 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('topbar.logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
