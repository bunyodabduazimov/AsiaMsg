import React from 'react';
import {
  LayoutDashboard,
  Layers,
  MessageSquare,
  Key,
  Webhook,
  FileText,
  Settings,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActiveView } from '../types';
import logo from '../logo.png';
import favicon from '../favicon.png';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  language: 'RU' | 'EN';
  theme?: 'light' | 'dark';
  isOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  theme = 'light',
  isOpen = true,
  isCollapsed = false,
  onClose
}) => {
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const navItems = [
    { id: 'overview' as ActiveView, label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'instances' as ActiveView, label: t('nav.instances'), icon: Layers },
    { id: 'messages' as ActiveView, label: t('nav.messages'), icon: MessageSquare },
    { id: 'tokens' as ActiveView, label: t('nav.apiDocs'), icon: Key },
    { id: 'webhooks' as ActiveView, label: t('nav.webhooks'), icon: Webhook },
    { id: 'logs' as ActiveView, label: t('nav.logs'), icon: FileText },
    { id: 'settings' as ActiveView, label: t('nav.settings'), icon: Settings }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r transition-transform duration-200 md:static md:translate-x-0 md:w-full md:shadow-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${isDark ? 'border-slate-800 bg-slate-950 shadow-2xl shadow-black/20' : 'border-slate-200 bg-white shadow-2xl shadow-slate-200/70'}`}
    >
      <div className="flex min-h-0 flex-col flex-1 overflow-y-auto pt-5">
        <div className={`mb-7 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between gap-2.5 px-5'}`}>
          <div className="flex">
            <img
              src={isCollapsed ? favicon : logo}
              alt="ChatAPI"
              className="h-12 object-contain"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border md:hidden ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-900'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    onClose?.();
                  }
                }}
                className={`group flex w-full cursor-pointer items-center rounded-2xl py-3 text-sm font-medium transition-all duration-150 ${
                  isCollapsed ? 'justify-center px-2' : 'gap-3.5 px-4'
                } ${
                  isActive
                    ? 'bg-blue-50 font-semibold text-blue-700 shadow-sm shadow-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:shadow-none'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <IconComponent
                  className={`h-5 w-5 transition-transform duration-150 group-hover:scale-105 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-300'
                      : isDark
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {!isCollapsed && (
        <div
          className={`border-t p-4 transition-colors duration-200 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`px-2 text-[11px] font-medium leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <div>© 2025 ChatAPI</div>
            <div className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
              {t('sidebar.allRightsReserved')}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
