import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Check,
  Copy,
  Download,
  FileCode2,
  Search,
  SearchCode,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { AppState, LogEntry } from '../../types';

interface LogsViewProps {
  state: AppState;
  onSelectLog: (id: string | null) => void;
  onClearLogs: () => void;
}

const itemsPerPage = 12;

const normalize = (value: string | null | undefined) => (value || '').toLowerCase();

export const LogsView: React.FC<LogsViewProps> = ({ state, onSelectLog, onClearLogs }) => {
  const isRu = state.language === 'RU';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedLog = state.logs.find(log => log.id === state.selectedLogId) || null;

  const levels = useMemo(() => ['all', 'INFO', 'WARN', 'ERROR', 'DEBUG'], []);
  const modules = useMemo(() => ['all', 'System', 'API', 'Webhook', 'WhatsApp'], []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return state.logs.filter(log => {
      const matchesSearch =
        !query ||
        normalize(log.message).includes(query) ||
        normalize(log.module).includes(query) ||
        normalize(log.resource).includes(query) ||
        normalize(log.time).includes(query) ||
        normalize(JSON.stringify(log.payload ?? '')).includes(query);

      const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
      const matchesModule = filterModule === 'all' || log.module === filterModule;

      return matchesSearch && matchesLevel && matchesModule;
    });
  }, [filterLevel, filterModule, searchQuery, state.logs]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state.logs, null, 2))}`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', 'asiamsg_system_logs.json');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterLevel('all');
    setFilterModule('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {isRu ? 'Логи' : 'Logs'}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
            {isRu
              ? 'История системных событий, запросов API и вебхуков'
              : 'Real-time feed of system background workers and API payloads'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>{isRu ? 'Экспорт логов' : 'Export Logs'}</span>
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            className="flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isRu ? 'Очистить логи' : 'Clear Logs'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-3xs dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-[200px] flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isRu ? 'Поиск' : 'Search'}
          </span>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={event => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={isRu ? 'Поиск по логам...' : 'Search logs...'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div className="w-44">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isRu ? 'Уровень лога' : 'Log Level'}
          </span>
          <select
            value={filterLevel}
            onChange={event => {
              setFilterLevel(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {levels.map(level => (
              <option key={level} value={level} className="dark:bg-slate-900">
                {level === 'all' ? (isRu ? 'Все уровни' : 'All Levels') : level}
              </option>
            ))}
          </select>
        </div>

        <div className="w-44">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isRu ? 'Модуль' : 'Module'}
          </span>
          <select
            value={filterModule}
            onChange={event => {
              setFilterModule(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            {modules.map(module => (
              <option key={module} value={module} className="dark:bg-slate-900">
                {module === 'all' ? (isRu ? 'Все модули' : 'All Modules') : module}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isRu ? 'Временной интервал' : 'Time interval'}
          </span>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            18.05.2025 - 18.05.2025
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="w-16 py-2.5">{isRu ? 'Уровень' : 'Level'}</th>
                  <th className="w-36 py-2.5">{isRu ? 'Время' : 'Time'}</th>
                  <th className="w-20 py-2.5">{isRu ? 'Модуль' : 'Module'}</th>
                  <th className="py-2.5">{isRu ? 'Сообщение лога' : 'Log Message'}</th>
                  <th className="w-28 py-2.5">{isRu ? 'ID инстанса' : 'Instance ID'}</th>
                  <th className="w-16 py-2.5 text-right">{isRu ? 'Детали' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 dark:divide-slate-800/60 dark:text-slate-300">
                {paginated.map(log => {
                  const isActive = state.selectedLogId === log.id;
                  let levelColor = 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800';
                  if (log.level === 'INFO') levelColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40';
                  if (log.level === 'WARN') levelColor = 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40';
                  if (log.level === 'ERROR') levelColor = 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40';
                  if (log.level === 'DEBUG') levelColor = 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log.id)}
                      className={`cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                        isActive ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3">
                        <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold ${levelColor}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10.5px] text-slate-400 dark:text-slate-500">
                        {log.time}
                      </td>
                      <td className="py-3 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {log.module}
                      </td>
                      <td className="py-3 break-all font-normal leading-relaxed text-slate-800 dark:text-white">
                        {log.message}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {log.resource}
                      </td>
                      <td className="py-3 text-right" onClick={event => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectLog(log.id)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <FileCode2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800/80">
            <span className="text-slate-400 dark:text-slate-500">
              {isRu
                ? `Показано ${totalItems ? (safePage - 1) * itemsPerPage + 1 : 0}–${Math.min(safePage * itemsPerPage, totalItems)} из ${totalItems}`
                : `Showing ${totalItems ? (safePage - 1) * itemsPerPage + 1 : 0}–${Math.min(safePage * itemsPerPage, totalItems)} of ${totalItems}`}
            </span>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                className="cursor-pointer rounded-lg border border-slate-100 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-3xs">
                {safePage}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={safePage === totalPages || totalPages === 0}
                className="cursor-pointer rounded-lg border border-slate-100 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky top-24 xl:col-span-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {selectedLog ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  {isRu ? 'Детали лога' : 'Log Details'}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectLog(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-xs font-bold leading-relaxed text-slate-800 dark:text-white">
                  {selectedLog.message}
                </h3>
                <span className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  {selectedLog.time}
                </span>
              </div>

              <div className="space-y-2 border-y border-slate-50 py-3 text-left text-xs dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400 dark:text-slate-500">{isRu ? 'Модуль' : 'Module'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.module}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400 dark:text-slate-500">{isRu ? 'ID инстанса' : 'Instance ID'}</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedLog.resource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400 dark:text-slate-500">{isRu ? 'Код лога' : 'Log Event Code'}</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    LOG_EVT_CRM_{selectedLog.id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400 dark:text-slate-500">Request ID</span>
                  <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    req_{selectedLog.id.slice(0, 10)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {isRu ? 'Полезная нагрузка (Payload JSON)' : 'Payload JSON Data'}
                </span>
                <pre className="max-h-52 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-left font-mono text-[9px] leading-relaxed text-emerald-700 shadow-inner select-all dark:border-slate-800 dark:bg-slate-950 dark:text-emerald-400">
                  {JSON.stringify(
                    selectedLog.payload || {
                      level: selectedLog.level,
                      timestamp: selectedLog.time,
                      module: selectedLog.module,
                      instance_id: selectedLog.resource,
                      message: selectedLog.message,
                      context: {
                        user_agent: 'ChatAPI Worker Engine 2.1',
                        source_ip: '10.124.0.51',
                        database_sync: true
                      }
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleCopy(JSON.stringify(selectedLog.payload || selectedLog, null, 2))}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isRu ? 'Скопировать JSON' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 py-2.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <SearchCode className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  <span>{isRu ? 'Найти похожие' : 'Find Similar'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-slate-400 dark:text-slate-500">
              <AlertOctagon className="h-10 w-10 stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">
                {isRu
                  ? 'Выберите запись лога для просмотра деталей'
                  : 'Select a system log row to review raw JSON data and metadata payloads'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
