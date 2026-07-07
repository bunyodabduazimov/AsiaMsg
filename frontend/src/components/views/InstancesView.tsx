import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  RotateCcw,
  QrCode, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal, 
  Layers, 
  CheckCircle, 
  Smartphone,
  Copy,
  Check,
  Power,
  PowerOff,
  MoreVertical,
  ExternalLink,
  MessageSquareCode
} from 'lucide-react';
import { AppState, Instance } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface InstancesViewProps {
  state: AppState;
  onSelectInstance: (id: string | null) => void;
  onAddNumberClick: () => void;
  onUpdateInstanceStatus: (id: string, status: Instance['status']) => void;
}

export const InstancesView: React.FC<InstancesViewProps> = ({
  state,
  onSelectInstance,
  onAddNumberClick,
  onUpdateInstanceStatus
}) => {
  const isRu = state.language === 'RU';

  // State for search and filters
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Все');
  const [filterProvider, setFilterProvider] = useState('Все');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(['inst-01']); // Preselect first
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Unique status options, providers
  const statuses = ['Все', 'Connected', 'Waiting QR', 'Disconnected', 'Reconnecting'];
  const providers = ['Все', 'Baileys', 'Official'];

  // Filter logic
  const filtered = state.instances.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(localSearch.toLowerCase()) || 
                          item.number.toLowerCase().includes(localSearch.toLowerCase());
    const matchesStatus = filterStatus === 'Все' || item.status === filterStatus;
    const matchesProvider = filterProvider === 'Все' || item.provider === filterProvider;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Pagination logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const selectedInstance = state.instances.find(i => i.id === state.selectedInstanceId) || null;

  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginated.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginated.map(p => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(item => item !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
    onSelectInstance(id);
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setFilterStatus('Все');
    setFilterProvider('Все');
    setCurrentPage(1);
  };

  // Statistics calculation
  const totalCount = state.instances.length;
  const connectedCount = state.instances.filter(i => i.status === 'Connected').length;
  const waitingQrCount = state.instances.filter(i => i.status === 'Waiting QR').length;
  const disconnectedCount = state.instances.filter(i => i.status === 'Disconnected').length;
  const reconnectingCount = state.instances.filter(i => i.status === 'Reconnecting').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'Инстансы' : 'Instances'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {isRu ? 'Управление подключёнными WhatsApp номерами' : 'Manage connected WhatsApp telephone lines'}
          </p>
        </div>
        
        <button
          onClick={onAddNumberClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-blue-100 dark:shadow-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRu ? 'Добавить WhatsApp номер' : 'Add WhatsApp number'}</span>
        </button>
      </div>

      {/* 5 Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title={isRu ? "Всего инстансов" : "Total Instances"}
          value={totalCount}
          trend="14%"
          trendDirection="up"
          trendColor="green"
          icon={<Layers className="w-4.5 h-4.5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Connected"
          value={connectedCount}
          subValue={`${Math.round((connectedCount/totalCount)*100)}%`}
          trend="18%"
          trendDirection="up"
          trendColor="green"
          icon={<CheckCircle className="w-4.5 h-4.5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Waiting QR"
          value={waitingQrCount}
          subValue={`${Math.round((waitingQrCount/totalCount)*100)}%`}
          trend="5%"
          trendDirection="down"
          trendColor="red"
          icon={<QrCode className="w-4.5 h-4.5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Disconnected"
          value={disconnectedCount}
          subValue={`${Math.round((disconnectedCount/totalCount)*100)}%`}
          trend="33%"
          trendDirection="down"
          trendColor="red"
          icon={<PowerOff className="w-4.5 h-4.5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Reconnecting"
          value={reconnectingCount}
          subValue={`${Math.round((reconnectingCount/totalCount)*100)}%`}
          trend="33%"
          trendDirection="down"
          trendColor="red"
          icon={<RefreshCw className="w-4.5 h-4.5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-3xs flex flex-wrap gap-4 items-end">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Поиск' : 'Search'}</span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={isRu ? "Поиск по названию или номеру..." : "Search by name or number..."}
              className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>



        {/* Status select */}
        <div className="w-40">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Статус' : 'Status'}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'Все' ? (isRu ? 'Все статусы' : 'All Statuses') : s}</option>
            ))}
          </select>
        </div>

        {/* Provider select */}
        <div className="w-40">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Провайдер' : 'Provider'}</span>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {providers.map(pr => (
              <option key={pr} value={pr}>{pr === 'Все' ? (isRu ? 'Все' : 'All') : pr}</option>
            ))}
          </select>
        </div>

        {/* Static Datepicker placeholder range */}
        <div className="w-48">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Дата' : 'Date Range'}</span>
          <div className="bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl py-2 px-3.5 text-xs text-gray-500 dark:text-slate-400 font-medium flex justify-between items-center pointer-events-none">
            <span>18.05.2025 – 18.05.2025</span>
          </div>
        </div>

        {/* Reset filters */}
        <button
          onClick={handleResetFilters}
          className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl px-4 py-2 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      {/* Main Container: Split Grid for Table + DetailPanel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Table Section */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-8 space-y-4">
          {/* Action Row */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedRowIds.length === paginated.length && paginated.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-200 rounded-sm focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md">
                {isRu ? `Выбрано: ${selectedRowIds.length}` : `Selected: ${selectedRowIds.length}`}
              </span>
            </div>

            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-950 hover:bg-gray-100/80 dark:hover:bg-slate-800 border border-gray-200/50 dark:border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer transition-all">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRu ? 'Обновить' : 'Refresh'}</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 font-semibold border-b border-gray-50 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 w-8"></th>
                  <th className="py-2.5">{isRu ? 'Название' : 'Name'}</th>
                  <th className="py-2.5">{isRu ? 'Номер' : 'Number'}</th>
                  <th className="py-2.5">{isRu ? 'Провайдер' : 'Provider'}</th>
                  <th className="py-2.5">{isRu ? 'Статус' : 'Status'}</th>
                  <th className="py-2.5">{isRu ? 'Активность' : 'Activity'}</th>
                  <th className="py-2.5 text-center">{isRu ? 'Сообщений' : 'Msg'}</th>
                  <th className="py-2.5 text-right">{isRu ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                {paginated.map((item) => {
                  const isSelected = selectedRowIds.includes(item.id);
                  const isPanelActive = state.selectedInstanceId === item.id;
                  
                  // Extract initials
                  const initials = item.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);
                  const colorMap: { [key: string]: string } = {
                    'SB': 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400',
                    'SP': 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400',
                    'NT': 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400',
                    'MK': 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400',
                    'CS': 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-400',
                    'PR': 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400',
                    'HD': 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400',
                  };
                  const colorClass = colorMap[initials] || 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400';

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => onSelectInstance(item.id)}
                      className={`group hover:bg-gray-50/60 dark:hover:bg-slate-850/30 transition-colors duration-150 cursor-pointer ${
                        isPanelActive ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="w-4 h-4 text-blue-600 border-gray-200 dark:border-slate-850 rounded-sm focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Name Badge */}
                      <td className="py-3.5 font-medium flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center font-bold text-xs select-none shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{item.name}</span>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3.5 font-mono text-gray-500 dark:text-slate-400">{item.number}</td>

                      {/* Provider */}
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-sm text-[10px]">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          {item.provider}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 text-gray-400 dark:text-slate-500 font-medium">{item.lastActive}</td>

                      {/* Message Count */}
                      <td className="py-3.5 text-center font-semibold font-mono dark:text-slate-200">{item.messagesToday}</td>

                      {/* Tool Actions */}
                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onSelectInstance(item.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            title={isRu ? "Показать код / QR" : "Show QR Code"}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onUpdateInstanceStatus(item.id, 'Connected')}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title={isRu ? "Подключить" : "Connect"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onUpdateInstanceStatus(item.id, 'Disconnected')}
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title={isRu ? "Отключить" : "Disconnect"}
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800 text-xs">
            <span className="text-gray-400 dark:text-slate-500">
              {isRu 
                ? `Показано ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)} из ${totalItems}` 
                : `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems}`
              }
            </span>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-slate-500">{isRu ? 'Строк на странице' : 'Rows per page'}</span>
                <select className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-md py-1 px-1.5 text-xs text-gray-600 dark:text-slate-300 font-medium">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>

              {/* Navigation Arrows */}
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-100 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1 border rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    currentPage === 1 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-3xs' 
                      : 'border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  disabled={totalPages < 2}
                  className={`px-3 py-1 border rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    currentPage === 2 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-3xs' 
                      : 'border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-100 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 rounded-lg cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Detail Panel (DetailPanel) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5 sticky top-24">
          {selectedInstance ? (
            <>
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-50 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedInstance.name}</h3>
                  <StatusBadge status={selectedInstance.status} size="sm" />
                </div>
                <button 
                  onClick={() => onSelectInstance(null)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 w-6 h-6 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center text-sm font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* QR connection block */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl text-center flex flex-col items-center">
                {selectedInstance.status === 'Waiting QR' || selectedInstance.status === 'Disconnected' ? (
                  <>
                    <div className="w-40 h-40 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-2 flex items-center justify-center shadow-3xs relative">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                        alt="Instance QR code Link"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 mt-2.5">
                      {isRu ? 'Отсканируйте QR-код с помощью WhatsApp' : 'Scan this QR code with WhatsApp App'}
                    </p>
                    <button className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 shadow-3xs px-3 py-1 rounded-lg">
                      {isRu ? 'Показать код' : 'Show Text Code'}
                    </button>
                  </>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2.5">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-slate-200 text-xs">
                        {isRu ? 'Инстанс авторизован' : 'Instance Authenticated'}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        {isRu ? `Подключен: ${selectedInstance.lastActive}` : `Active session: ${selectedInstance.lastActive}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="space-y-2.5 text-xs">
                {/* Number */}
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-850">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Номер' : 'Number'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 dark:text-slate-200 font-mono">{selectedInstance.number}</span>
                    <button 
                      onClick={() => handleCopy(selectedInstance.number, 'number')}
                      className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      {copiedField === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Provider */}
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-850">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Провайдер' : 'Provider'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                    {selectedInstance.provider}
                  </span>
                </div>



                {/* Webhook */}
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-850">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">Webhook</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                    {isRu ? 'Активен' : 'Active'}
                  </span>
                </div>

                {/* ID Instance */}
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-850">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">ID инстанса</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-950 px-1.5 py-0.5 rounded-sm select-all">
                      inst_{selectedInstance.id}HZ8K8G4Q3Y7V9P
                    </span>
                    <button 
                      onClick={() => handleCopy(`inst_${selectedInstance.id}HZ8K8G4Q3Y7V9P`, 'id')}
                      className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Created */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Создан' : 'Created'}</span>
                  <span className="font-medium text-gray-500 dark:text-slate-400 font-mono text-[11px]">
                    {selectedInstance.createdDate || '12.05.2025 14:22:10'}
                  </span>
                </div>
              </div>

              {/* Quick Actions Buttons */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500">{isRu ? 'Быстрые действия' : 'Quick Actions'}</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-gray-600 dark:text-slate-400">
                  {/* Action 1 */}
                  <a 
                    href="https://web.whatsapp.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{isRu ? 'Открыть' : 'Open'}</span>
                  </a>

                  {/* Action 2 */}
                  <button 
                    onClick={() => {
                      onUpdateInstanceStatus(selectedInstance.id, 'Reconnecting');
                      setTimeout(() => onUpdateInstanceStatus(selectedInstance.id, 'Connected'), 2000);
                    }}
                    className="p-2 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>{isRu ? 'Перезапустить' : 'Reboot'}</span>
                  </button>

                  {/* Action 3 */}
                  <button 
                    onClick={() => {
                      onUpdateInstanceStatus(selectedInstance.id, 'Waiting QR');
                    }}
                    className="p-2 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isRu ? 'Обновить QR' : 'Reset QR'}</span>
                  </button>

                  {/* Action 4 */}
                  <button 
                    onClick={() => onUpdateInstanceStatus(selectedInstance.id, 'Disconnected')}
                    className="p-2 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PowerOff className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span>{isRu ? 'Отключить' : 'Shut down'}</span>
                  </button>
                </div>
              </div>

              {/* History events */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">{isRu ? 'Последняя активность' : 'Recent Activity'}</span>
                  <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">
                    {isRu ? 'Смотреть все' : 'View all'}
                  </button>
                </div>

                <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50 dark:before:bg-slate-800 text-left">
                  {/* Event 1 */}
                  <div className="flex gap-3 text-xs relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-slate-200">{isRu ? 'Соединение установлено' : 'Connection Established'}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">18.05.2025 14:32:45</div>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="flex gap-3 text-xs relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                      →
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-slate-200">{isRu ? 'Сообщение отправлено' : 'Message Sent'}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Клиент: +7 900 555-33-22</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">18.05.2025 14:31:24</div>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="flex gap-3 text-xs relative z-10">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                      ←
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-slate-200">{isRu ? 'Сообщение получено' : 'Message Received'}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Клиент: +7 900 555-33-22</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">18.05.2025 14:30:11</div>
                    </div>
                  </div>

                  {/* Event 4 */}
                  <div className="flex gap-3 text-xs relative z-10">
                    <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                      ↻
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-slate-200">{isRu ? 'Синхронизация контактов' : 'Contacts Synced'}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Контактов: 245</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">18.05.2025 14:28:03</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <Smartphone className="w-10 h-10 text-gray-300 dark:text-slate-700 stroke-1" />
              <p className="text-xs font-semibold">{isRu ? 'Выберите инстанс из таблицы для просмотра детальной информации' : 'Select an instance from the table to inspect details'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
