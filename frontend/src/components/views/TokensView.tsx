import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  X, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { AppState, ApiToken } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface TokensViewProps {
  state: AppState;
  onSelectToken: (id: string | null) => void;
  onAddToken: (token: ApiToken) => void;
  onRevokeToken: (id: string) => void;
}

export const TokensView: React.FC<TokensViewProps> = ({
  state,
  onSelectToken,
  onAddToken,
  onRevokeToken
}) => {
  const isRu = state.language === 'RU';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstance, setFilterInstance] = useState('Все');
  const [filterStatus, setFilterStatus] = useState('Все');

  const [revealTokenId, setRevealTokenId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const selectedToken = state.tokens.find(t => t.id === state.selectedTokenId) || null;

  // Options
  const instances = ['Все', 'Sales Bot', 'Support Line', 'Marketing', 'Notifications', 'HR Desk'];
  const statuses = ['Все', 'Активен', 'Истекает скоро', 'Отозван'];

  // Apply filters
  const filtered = state.tokens.filter(token => {
    const matchesSearch = 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.tokenKey.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInstance = filterInstance === 'Все' || token.instance === filterInstance;
    const matchesStatus = filterStatus === 'Все' || token.status === filterStatus;

    return matchesSearch && matchesInstance && matchesStatus;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstance('Все');
    setFilterStatus('Все');
    setCurrentPage(1);
  };

  // Stats
  const totalCount = state.tokens.length;
  const activeCount = state.tokens.filter(t => t.status === 'Активен').length;
  const expiringCount = state.tokens.filter(t => t.status === 'Истекает скоро').length;
  const revokedCount = state.tokens.filter(t => t.status === 'Отозван').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'API токены' : 'API Tokens'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
            {isRu ? 'Управляйте токенами доступа к API и настраивайте права для интеграций' : 'Configure secret integration credentials and manage permission scopes'}
          </p>
        </div>
        
        <button
          onClick={() => {
            const newToken: ApiToken = {
              id: `tok-${Date.now()}`,
              name: isRu ? 'Новая интеграция CRM' : 'New CRM Integration',
              instance: 'Sales Bot',
              scopes: ['messages:send', 'contacts:read'],
              lastUsed: '—',
              created: '07.07.2026 12:00',
              expires: '07.08.2026',
              status: 'Активен',
              tokenKey: `amsg_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              messagesCount: 0,
              webhooksCalled: 0
            };
            onAddToken(newToken);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRu ? 'Создать токен' : 'Create Token'}</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isRu ? "Всего токенов" : "Total Tokens"}
          value={totalCount}
          trend="3 с прошлого месяца"
          trendDirection="up"
          trendColor="green"
          icon={<Key className="w-4.5 h-4.5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title={isRu ? "Активные" : "Active"}
          value={activeCount}
          trend="2 с прошлой недели"
          trendDirection="up"
          trendColor="green"
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title={isRu ? "Истекают скоро" : "Expiring Soon"}
          value={expiringCount}
          subValue={isRu ? "Срок ≤ 7 дней" : "Term ≤ 7d"}
          icon={<RefreshCw className="w-4.5 h-4.5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title={isRu ? "Отозванные" : "Revoked"}
          value={revokedCount}
          trend="1 с прошлой недели"
          trendDirection="down"
          trendColor="red"
          icon={<Ban className="w-4.5 h-4.5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
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
              placeholder={isRu ? "Поиск по названию или токену..." : "Search by name or token..."}
              className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </div>



        {/* Instance select */}
        <div className="w-40">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Инстанс' : 'Instance'}</span>
          <select
            value={filterInstance}
            onChange={(e) => setFilterInstance(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {instances.map(i => (
              <option key={i} value={i} className="dark:bg-slate-900">{i === 'Все' ? (isRu ? 'Все инстансы' : 'All Instances') : i}</option>
            ))}
          </select>
        </div>

        {/* Status select */}
        <div className="w-40">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Статус' : 'Status'}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {statuses.map(s => (
              <option key={s} value={s} className="dark:bg-slate-900">{s === 'Все' ? (isRu ? 'Все статусы' : 'All Statuses') : s}</option>
            ))}
          </select>
        </div>

        {/* Period placeholder range */}
        <div className="w-48">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Дата' : 'Date Range'}</span>
          <div className="bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-500 dark:text-slate-400 font-medium">
            18.05.2025 – 18.06.2025
          </div>
        </div>

        <button
          onClick={handleResetFilters}
          className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl px-4 py-2 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      {/* Grid container with detailed split lists */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table list block */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-8 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 font-semibold border-b border-gray-50 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 w-6"></th>
                  <th className="py-2.5">{isRu ? 'Название' : 'Name'}</th>
                  <th className="py-2.5">{isRu ? 'Инстанс' : 'Instance'}</th>
                  <th className="py-2.5">{isRu ? 'Права доступа (Scopes)' : 'Permission Scopes'}</th>
                  <th className="py-2.5">{isRu ? 'Посл. использование' : 'Last Active'}</th>
                  <th className="py-2.5">{isRu ? 'Создан' : 'Created'}</th>
                  <th className="py-2.5">{isRu ? 'Статус' : 'Status'}</th>
                  <th className="py-2.5 text-right">{isRu ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                {paginated.map((tok) => {
                  const isActive = state.selectedTokenId === tok.id;
                  
                  return (
                    <tr
                      key={tok.id}
                      onClick={() => onSelectToken(tok.id)}
                      className={`group hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer ${
                        isActive ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-200 dark:border-slate-800 rounded-sm focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 font-semibold text-gray-900 dark:text-white">{tok.name}</td>
                      <td className="py-3.5 text-gray-600 dark:text-slate-300 font-semibold">{tok.instance}</td>

                      {/* Scopes */}
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {tok.scopes.slice(0, 2).map((sc, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 rounded-sm text-[9px] font-semibold border border-gray-100 dark:border-slate-800">
                              {sc}
                            </span>
                          ))}
                          {tok.scopes.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-sm text-[9px] font-bold">
                              +{tok.scopes.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 text-gray-400 dark:text-slate-500 font-medium font-mono text-[10px]">{tok.lastUsed}</td>
                      <td className="py-3.5 text-gray-400 dark:text-slate-500 font-medium font-mono text-[10px]">{tok.created.split(' ')[0]}</td>

                      {/* Status */}
                      <td className="py-3.5">
                        <StatusBadge status={tok.status} size="sm" />
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button 
                            onClick={() => handleCopy(tok.tokenKey, tok.id)}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onRevokeToken(tok.id)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
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
                className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 bg-blue-600 border border-blue-600 text-white rounded-lg font-semibold text-xs shadow-3xs">
                {currentPage}
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5 sticky top-24">
          {selectedToken ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold border border-emerald-100 dark:border-emerald-900/40">
                    {selectedToken.status}
                  </span>
                </div>
                <button 
                  onClick={() => onSelectToken(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-6 h-6 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedToken.name}</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{isRu ? 'Менеджер API ключей' : 'API Key details & metrics'}</p>
              </div>

              {/* Token secret copy box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 block uppercase">
                  {isRu ? 'Токен (скопируйте и сохраните)' : 'Token key (copy & save)'}
                </label>
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl p-2.5">
                  <span className="font-mono text-[11px] text-gray-600 dark:text-slate-300 flex-1 truncate select-all">
                    {revealTokenId === selectedToken.id 
                      ? selectedToken.tokenKey 
                      : `amsg_live_${'•'.repeat(28)}${selectedToken.tokenKey.slice(-4)}`
                    }
                  </span>
                  
                  <button 
                    onClick={() => setRevealTokenId(revealTokenId === selectedToken.id ? null : selectedToken.id)}
                    className="p-1 hover:bg-gray-200/50 dark:hover:bg-slate-800 rounded text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                  >
                    {revealTokenId === selectedToken.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button 
                    onClick={() => handleCopy(selectedToken.tokenKey, 'secret')}
                    className="p-1 hover:bg-gray-200/50 dark:hover:bg-slate-800 rounded text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    {copiedField === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Instance */}
              <div className="space-y-2 text-xs border-b border-gray-50 dark:border-slate-800 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Инстанс' : 'Instance'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                    {selectedToken.instance}
                  </span>
                </div>
              </div>

              {/* Scopes block */}
              <div className="space-y-2 border-b border-gray-50 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block">
                  {isRu ? 'Права доступа (Scopes)' : 'Permission Scopes'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedToken.scopes.map((sc, idx) => (
                    <span key={idx} className="bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-800 rounded-md px-2 py-1 text-[10px] font-semibold font-mono">
                      {sc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Date active infos */}
              <div className="space-y-2 text-xs border-b border-gray-50 dark:border-slate-800 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Создан' : 'Created'}</span>
                  <span className="font-semibold font-mono text-gray-700 dark:text-slate-300">{selectedToken.created}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Последнее использование' : 'Last used'}</span>
                  <span className="font-semibold font-mono text-gray-700 dark:text-slate-300">{selectedToken.lastUsed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Истекает' : 'Expires'}</span>
                  <span className="font-semibold text-gray-700 dark:text-slate-300 font-mono">
                    {selectedToken.expires} <span className="text-gray-400 dark:text-slate-500 text-[10px]">({isRu ? 'через 24 дня' : 'in 24 days'})</span>
                  </span>
                </div>
              </div>

              {/* API usage limits meters */}
              <div className="bg-gray-50 dark:bg-slate-950 p-3 rounded-xl space-y-2.5 text-xs">
                <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                  {isRu ? 'Использование' : 'Usage'}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-slate-400">{isRu ? 'Сообщений через API' : 'Messages sent via API'}</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    {(selectedToken.messagesCount || 0).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-slate-400">{isRu ? 'Webhooks вызвано' : 'Webhooks callbacks'}</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    {(selectedToken.webhooksCalled || 0).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>

              {/* Detailed panel bottom action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleCopy(selectedToken.tokenKey, 'bot_secret')}
                  className="py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-[10px] rounded-xl text-gray-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>{isRu ? 'Скопировать' : 'Copy Key'}</span>
                </button>
                <button type="button" className="py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-[10px] rounded-xl text-gray-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isRu ? 'Обновить' : 'Regenerate'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => onRevokeToken(selectedToken.id)}
                  className="py-2.5 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/40 font-semibold text-[10px] rounded-xl text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>{isRu ? 'Отозвать' : 'Revoke'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <Key className="w-10 h-10 text-gray-300 dark:text-slate-700 stroke-1" />
              <p className="text-xs font-semibold">{isRu ? 'Выберите API токен для просмотра прав доступа и статистики использования' : 'Select an API token to inspect credential permissions and analytics'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
