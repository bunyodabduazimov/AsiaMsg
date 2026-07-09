import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AppState, ActiveView } from '../types';

interface LayoutProps {
  state: AppState;
  sidebarOpen: boolean;
  onViewChange: (view: ActiveView) => void;
  onSearchChange: (query: string) => void;
  onLanguageChange: (lang: 'RU' | 'EN') => void;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  state,
  sidebarOpen,
  onViewChange,
  onSearchChange,
  onLanguageChange,
  onThemeChange,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
  children
}) => {
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);

    syncSystemTheme();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncSystemTheme);
      return () => mediaQuery.removeEventListener('change', syncSystemTheme);
    }

    mediaQuery.addListener(syncSystemTheme);
    return () => mediaQuery.removeListener(syncSystemTheme);
  }, []);

  const resolvedTheme = state.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : state.theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);

  return (
    <div className={`h-screen w-full overflow-hidden font-sans antialiased transition-colors duration-200 ${
      resolvedTheme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : 'bg-slate-50 text-slate-900'
    }`}>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseSidebar}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] md:hidden"
        />
      )}

      <div className={`grid h-full w-full ${sidebarOpen ? 'md:grid-cols-[16rem_minmax(0,1fr)]' : 'md:grid-cols-[5rem_minmax(0,1fr)]'}`}>
        {/* Persistent Left Sidebar */}
        <Sidebar
          activeView={state.activeView}
          onViewChange={onViewChange}
          language={state.language}
          theme={resolvedTheme}
          isOpen={sidebarOpen}
          isCollapsed={!sidebarOpen}
          onClose={onCloseSidebar}
        />

        {/* Main Workspace Frame */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          {/* Consistent Topbar */}
          <Topbar
            state={state}
            onSearchChange={onSearchChange}
            onLanguageChange={onLanguageChange}
            onThemeChange={onThemeChange}
            onMenuClick={onToggleSidebar}
            onLogout={onLogout}
          />

          {/* Scrollable page body */}
          <main className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8 transition-colors duration-200 ${
            resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
          }`}>
            <div className="h-full w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
