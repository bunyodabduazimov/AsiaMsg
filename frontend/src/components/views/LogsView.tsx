import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  FileCode2,
  AlertOctagon,
  Copy,
  Check,
  SearchCode
} from 'lucide-react';
import { AppState, LogEntry } from '../../types';
import { StatusBadge } from '../StatusBadge';

interface LogsViewProps {
  state: AppState;
  onSelectLog: (id: string | null) => void;
  onClearLogs: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({
  state,
  onSelectLog,
  onClearLogs
}) => {
  const isRu = state.language === 'RU';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('Все');
  const [filterModule, setFilterModule] = useState('Все');
  const [copied, setCopied] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "asiamasg_system_logs.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedLog = state.logs.find(l => l.id === state.selectedLogId) || null;

  // Options
  const levels = ['Все', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
  const modules = ['Все', 'System', 'API', 'Webhook', 'WhatsApp'];

  // Filter
  const filtered = state.logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.instanceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'Все' || log.level === filterLevel;
    const matchesModule = filterModule === 'Все' || log.module === filterModule;
    return matchesSearch && matchesLevel && matchesModule;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterLevel('Все');
    setFilterModule('Все');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'Логи' : 'Logs'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
            {isRu ? 'История системных событий, запросов API и вебхуков' : 'Real-time feed of system background workers and API payloads'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>{isRu ? 'Экспорт логов' : 'Export Logs'}</span>
          </button>
          
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isRu ? 'Очистить логи' : 'Clear Logs'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-3xs flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Поиск' : 'Search'}</span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRu ? "Поиск по логам..." : "Search logs..."}
              className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Level select */}
        <div className="w-44">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Уровень лога' : 'Log Level'}</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {levels.map(l => (
              <option key={l} value={l} className="dark:bg-slate-900">{l === 'Все' ? (isRu ? 'Все уровни' : 'All Levels') : l}</option>
            ))}
          </select>
        </div>

        {/* Module select */}
        <div className="w-44">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Модуль' : 'Module'}</span>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {modules.map(m => (
              <option key={m} value={m} className="dark:bg-slate-900">{m === 'Все' ? (isRu ? 'Все модули' : 'All Modules') : m}</option>
            ))}
          </select>
        </div>

        {/* Period placeholder range */}
        <div className="w-48">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Временной интервал' : 'Time interval'}</span>
          <div className="bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
            18.05.2025 – 18.05.2025
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl px-4 py-2 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      {/* Table grid layout split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table logs block */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-8 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 font-semibold border-b border-gray-50 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 w-16">{isRu ? 'Уровень' : 'Level'}</th>
                  <th className="py-2.5 w-36">{isRu ? 'Время' : 'Time'}</th>
                  <th className="py-2.5 w-20">{isRu ? 'Модуль' : 'Module'}</th>
                  <th className="py-2.5">{isRu ? 'Сообщение лога' : 'Log Message'}</th>
                  <th className="py-2.5 w-28">{isRu ? 'ID инстанса' : 'Instance ID'}</th>
                  <th className="py-2.5 text-right w-16">{isRu ? 'Детали' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                {paginated.map((log) => {
                  const isActive = state.selectedLogId === log.id;
                  
                  // Level badges
                  let levelColor = 'bg-gray-50 dark:bg-slate-850 text-gray-600 dark:text-slate-405';
                  if (log.level === 'INFO') levelColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
                  if (log.level === 'WARN') levelColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
                  if (log.level === 'ERROR') levelColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40';
                  if (log.level === 'DEBUG') levelColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log.id)}
                      className={`group hover:bg-gray-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-all ${
                        isActive ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Level */}
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded-sm font-bold text-[9px] ${levelColor}`}>
                          {log.level}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 text-gray-400 dark:text-slate-500 font-mono text-[10.5px]">{log.timestamp}</td>

                      {/* Module */}
                      <td className="py-3 text-gray-600 dark:text-slate-400 font-semibold text-[10px]">{log.module}</td>

                      {/* Message text */}
                      <td className="py-3 text-gray-800 dark:text-white font-normal leading-relaxed break-all">
                        {log.message}
                      </td>

                      {/* Instance ID */}
                      <td className="py-3 text-gray-400 dark:text-slate-500 font-mono text-[10px]">{log.instanceId}</td>

                      {/* Actions */}
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectLog(log.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <FileCode2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800/80 text-xs">
            <span className="text-gray-400 dark:text-slate-500">
              {isRu 
                ? `Показано ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)} из ${totalItems}` 
                : `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}`
              }
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 bg-blue-600 border border-blue-600 text-white rounded-lg font-semibold text-xs shadow-3xs">
                {currentPage}
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Detail JSON payload panel */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5 sticky top-24">
          {selectedLog ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-800">
                <span className="text-xs bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-2.5 py-0.5 rounded-md text-gray-600 dark:text-slate-400 font-bold">
                  {isRu ? 'Детали лога' : 'Log Details'}
                </span>
                <button 
                  onClick={() => onSelectLog(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-6 h-6 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Log message */}
              <div className="space-y-1 text-left">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white leading-relaxed">{selectedLog.message}</h3>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{selectedLog.timestamp}</span>
              </div>

              {/* Info grid */}
              <div className="space-y-2 text-xs border-t border-b border-gray-50 dark:border-slate-800 py-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Модуль' : 'Module'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedLog.module}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'ID инстанса' : 'Instance ID'}</span>
                  <span className="font-semibold font-mono text-gray-800 dark:text-slate-200">{selectedLog.instanceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Код лога' : 'Log Event Code'}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    LOG_EVT_CRM_{selectedLog.id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">Request ID</span>
                  <span className="font-semibold font-mono text-gray-500 dark:text-slate-400 text-[10px]">
                    req_{Math.random().toString(36).substring(2, 14)}
                  </span>
                </div>
              </div>

              {/* Payload code box */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block">
                  {isRu ? 'Полезная нагрузка (Payload JSON)' : 'Payload JSON Data'}
                </span>
                <div className="relative">
                  <pre className="bg-gray-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] p-3.5 rounded-xl overflow-x-auto max-h-52 leading-relaxed text-left border border-gray-100 dark:border-slate-800 shadow-inner select-all">
                    {JSON.stringify(selectedLog.payload || {
                      level: selectedLog.level,
                      timestamp: selectedLog.timestamp,
                      module: selectedLog.module,
                      instance_id: selectedLog.instanceId,
                      message: selectedLog.message,
                      context: {
                        user_agent: "AsiaMsg Worker Engine 2.1",
                        source_ip: "10.124.0.51",
                        database_sync: true
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleCopy(JSON.stringify(selectedLog.payload || selectedLog, null, 2))}
                  className="py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-[10px] rounded-xl text-gray-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isRu ? 'Скопировать JSON' : 'Copy JSON'}</span>
                </button>
                <button className="py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-[10px] rounded-xl text-gray-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <SearchCode className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>{isRu ? 'Найти похожие' : 'Find Similar'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <AlertOctagon className="w-10 h-10 text-gray-300 dark:text-slate-700 stroke-1" />
              <p className="text-xs font-semibold">{isRu ? 'Выберите запись лога для инспектирования подробностей системной операции' : 'Select a system log row to review raw JSON data and metadata payloads'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
