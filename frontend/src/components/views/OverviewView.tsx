import React from 'react';
import { 
  Plus, 
  Layers, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  MessageSquare,
  Globe,
  Radio
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppState, ActiveView } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface OverviewViewProps {
  state: AppState;
  onViewChange: (view: ActiveView) => void;
  onAddNumberClick: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  onViewChange,
  onAddNumberClick,
}) => {
  const { t } = useTranslation();
  const isDark = state.theme === 'dark';

  // Statistics summaries
  const connectedCount = state.instances.filter(i => i.status === 'Connected').length;
  const waitingQrCount = state.instances.filter(i => i.status === 'Waiting QR').length;
  const reconnectingCount = state.instances.filter(i => i.status === 'Reconnecting').length;
  const disconnectedCount = state.instances.filter(i => i.status === 'Disconnected').length;
  const totalCount = state.instances.length;
  const visibleMessages = state.messages.filter(message => message.number.toLowerCase() !== 'status@broadcast');
  const totalMessages = visibleMessages.length;
  const sentTodayCount = state.instances.reduce((sum, instance) => sum + instance.messagesToday, 0);
  const deliveredCount = visibleMessages.filter(message => message.status === 'Доставлено').length;
  const errorCount = visibleMessages.filter(message => message.status === 'Ошибка').length;
  const formatCount = (value: number) => value.toLocaleString('ru-RU');
  const getPercent = (value: number) => (totalCount > 0 ? (value / totalCount) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('overview.title')}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {t('overview.subtitle')}
          </p>
        </div>
        
        <button
          onClick={onAddNumberClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-blue-100 dark:shadow-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('overview.addNumber')}</span>
        </button>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('overview.activeInstances')}
          value={`${connectedCount + waitingQrCount}`}
          subValue={`${totalCount}`}
          icon={<Layers className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title={t('overview.sentToday')}
          value={formatCount(sentTodayCount)}
          subValue={formatCount(totalMessages)}
          icon={<Send className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title={t('overview.delivered')}
          value={formatCount(deliveredCount)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title={t('overview.errors')}
          value={formatCount(errorCount)}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Charts & Interactive Widgets Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Message Activity Spline Wave Chart - Custom responsive SVG bezier curve */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-6 flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {t('overview.messageActivity')}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                {t('overview.aggregatedTraffic')}
              </p>
            </div>
            <select className="text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-medium text-gray-600 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-100">
              <option>{t('overview.last7Days')}</option>
              <option>{t('overview.last30Days')}</option>
            </select>
          </div>

          {/* SVG Wave chart visualization */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="70" x2="500" y2="70" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="1" strokeDasharray="3" />

              {/* Smooth spline wave path matching photo coordinates */}
              <path
                d="M 10,120 C 50,105 70,85 100,75 C 130,65 170,115 210,80 C 250,45 290,55 330,50 C 370,45 400,105 440,115 C 460,119 480,105 490,100"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Under-line filled area */}
              <path
                d="M 10,120 C 50,105 70,85 100,75 C 130,65 170,115 210,80 C 250,45 290,55 330,50 C 370,45 400,105 440,115 C 460,119 480,105 490,100 L 490,140 L 10,140 Z"
                fill="url(#chartGradient)"
              />

              {/* Chart point coordinates matching dates */}
              <circle cx="10" cy="120" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="100" cy="75" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="210" cy="80" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="330" cy="50" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="440" cy="115" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="490" cy="100" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
            </svg>
          </div>

          {/* X axis dates */}
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-2 px-1">
            <span>12 мая</span>
            <span>13 мая</span>
            <span>14 мая</span>
            <span>15 мая</span>
            <span>16 мая</span>
            <span>17 мая</span>
            <span>18 мая</span>
          </div>
        </div>

        {/* Instance Status ratios widget */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col justify-between transition-colors duration-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              {t('overview.instanceStatuses')}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t('overview.ratioOfChannels')}
            </p>
          </div>

          <div className="space-y-3 my-4">
            {/* Connected */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Connected
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono">
                  {connectedCount} <span className="text-[10px] text-gray-300 dark:text-slate-600">/ {totalCount}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${getPercent(connectedCount)}%` }}
                />
              </div>
            </div>

            {/* Waiting QR */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Waiting QR
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono">
                  {waitingQrCount} <span className="text-[10px] text-gray-300 dark:text-slate-600">/ {totalCount}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${getPercent(waitingQrCount)}%` }}
                />
              </div>
            </div>

            {/* Reconnecting */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Reconnecting
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono">
                  {reconnectingCount} <span className="text-[10px] text-gray-300 dark:text-slate-600">/ {totalCount}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${getPercent(reconnectingCount)}%` }}
                />
              </div>
            </div>

            {/* Disconnected */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Disconnected
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono">
                  {disconnectedCount} <span className="text-[10px] text-gray-300 dark:text-slate-600">/ {totalCount}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${getPercent(disconnectedCount)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 dark:text-slate-500 text-center font-medium bg-gray-50 dark:bg-slate-950 rounded-lg py-1">
            {t('overview.updated')}
          </div>
        </div>

        {/* QR Connect widget */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col items-center justify-between text-center transition-colors duration-200">
          <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 text-left">
              {t('addInstance.title')}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 text-left mt-0.5">
              {t('instances.clickToConnect')}
            </p>
          </div>

          {/* QR Scan Body with border lines and glowing effect */}
          <div className="my-3 relative p-2 bg-white rounded-xl border border-gray-100/80 dark:border-slate-800/80 shadow-xs flex items-center justify-center">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-600 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-600 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-600 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-600 rounded-br-sm" />

            <div className="w-28 h-28 flex items-center justify-center p-1.5 relative overflow-hidden bg-gray-50 dark:bg-slate-850 rounded-md">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                alt="WhatsApp Link QR"
                className="w-full h-full object-contain mix-blend-multiply"
              />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-bounce opacity-70" />
            </div>
          </div>

          <a 
            href="https://faq.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 hover:underline flex items-center gap-1 group"
          >
            <span>{t('instances.connectionTutorial')}</span>
            <ExternalLink className="w-3 h-3 transition-transform duration-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      {/* Grid for Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Messages Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {t('overview.recentMessages')}
              </h3>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                {t('messages.status')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-medium">
                    <th className="pb-2">{t('instances.phone')}</th>
                    <th className="pb-2">{t('messages.status')}</th>
                    <th className="pb-2 text-right">{t('messages.time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                  {visibleMessages.slice(0, 5).map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors duration-100">
                      <td className="py-3 font-medium flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        {msg.number}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={msg.status} size="sm" />
                      </td>
                      <td className="py-3 text-right font-mono text-gray-400 dark:text-slate-500 text-[11px]">{msg.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => onViewChange('messages')}
            className="w-full border-t border-gray-50 dark:border-slate-800 text-center pt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors mt-4 cursor-pointer"
          >
                        {t('overview.recentMessages')} →
          </button>
        </div>

        {/* Last Webhooks Dispatch box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {t('webhooks.title')}
              </h3>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                {t('webhooks.events')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-medium">
                    <th className="pb-2">Method</th>
                    <th className="pb-2">{t('webhooks.events')}</th>
                    <th className="pb-2 text-center">Code</th>
                    <th className="pb-2 text-right">{t('messages.time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                  {state.webhooks.slice(0, 5).map((wh) => (
                    <tr key={wh.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-850/30 transition-colors duration-100">
                      <td className="py-3 font-mono text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-sm">
                          {wh.method}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{wh.endpoint}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{wh.event}</div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-sm font-semibold font-mono text-[10px] ${
                          wh.code === 200 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                        }`}>
                          ✓ {wh.code}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-gray-400 dark:text-slate-500 text-[11px]">{wh.lastDelivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => onViewChange('webhooks')}
            className="w-full border-t border-gray-50 dark:border-slate-800 text-center pt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors mt-4 cursor-pointer"
          >
                        {t('webhooks.title')} →
          </button>
        </div>
      </div>
    </div>
  );
};
