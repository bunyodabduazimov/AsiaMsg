import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  CheckCheck, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Smile,
  Paperclip,
  Check,
  Eye,
  CornerUpLeft,
  MoreVertical,
  HelpCircle
} from 'lucide-react';
import { AppState, Message } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface MessagesViewProps {
  state: AppState;
  onSelectMessage: (id: string | null) => void;
  onAddMessage: (msg: Message) => void;
  onSendMessageClick?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  state,
  onSelectMessage,
  onAddMessage,
  onSendMessageClick,
}) => {
  const isRu = state.language === 'RU';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstance, setFilterInstance] = useState('Все');
  const [filterStatus, setFilterStatus] = useState('Все');
  const [filterType, setFilterType] = useState('Все');
  
  // Segment tabs
  const [activeSegment, setActiveSegment] = useState<'all' | 'inbound' | 'outbound' | 'templates'>('all');

  // Detail panel tabs
  const [activePanelTab, setActivePanelTab] = useState<'chat' | 'details' | 'history'>('chat');
  
  // Send state
  const [composeText, setComposeText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Auto scroll chat to bottom when active message changes or replies are sent
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.selectedMessageId, activePanelTab]);

  const handleComposeSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim() || !state.selectedMessageId) return;

    const currentMsg = state.messages.find(m => m.id === state.selectedMessageId);
    if (!currentMsg) return;

    // Create mock outbound reply message
    const newReply: Message = {
      id: `msg-reply-${Date.now()}`,
      number: currentMsg.number,
      instance: currentMsg.instance,
      type: 'Исходящее',
      status: 'Доставлено',
      time: '18.05.2025 14:35:00', // Mock time
      messageText: composeText,
      details: 'Отправлено пользователем из чата AsiaMsg',
      statusHistory: [
        { status: 'Создано', time: '18.05.2025 14:34:55' },
        { status: 'Отправлено', time: '18.05.2025 14:34:58' },
        { status: 'Доставлено', time: '18.05.2025 14:35:00' }
      ]
    };

    onAddMessage(newReply);
    setComposeText('');
    setTimeout(() => {
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Get conversation messages with selected client phone
  const activeMessage = state.messages.find(m => m.id === state.selectedMessageId);
  const conversation = activeMessage 
    ? state.messages.filter(m => m.number === activeMessage.number).reverse() // chronological order
    : [];

  // Dropdown options
  const instances = ['Все', 'Sales Bot', 'Support Line', 'Marketing', 'Notifications'];
  const statuses = ['Все', 'Доставлено', 'Отправлено', 'Ошибка', 'В очереди'];
  const types = ['Все', 'Входящее', 'Исходящее'];

  // Apply search & filters
  const filtered = state.messages.filter(msg => {
    const matchesSearch = 
      msg.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.messageText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInstance = filterInstance === 'Все' || msg.instance === filterInstance;
    const matchesStatus = filterStatus === 'Все' || msg.status === filterStatus;
    const matchesType = filterType === 'Все' || msg.type === filterType;

    // Segment tab override
    let matchesSegment = true;
    if (activeSegment === 'inbound') matchesSegment = msg.type === 'Входящее';
    if (activeSegment === 'outbound') matchesSegment = msg.type === 'Исходящее';
    if (activeSegment === 'templates') matchesSegment = false; // Mock template placeholder

    return matchesSearch && matchesInstance && matchesStatus && matchesType && matchesSegment;
  });

  // Pagination logic
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstance('Все');
    setFilterStatus('Все');
    setFilterType('Все');
    setActiveSegment('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'Сообщения' : 'Messages'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {isRu ? 'Управление сообщениями и переписками WhatsApp' : 'Overview of sent and received WhatsApp client chats'}
          </p>
        </div>
        
        <button
          onClick={onSendMessageClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-blue-100 dark:shadow-none cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isRu ? 'Отправить сообщение' : 'Send Message'}</span>
        </button>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isRu ? "Всего сообщений" : "Total Messages"}
          value="24 812"
          trend="18%"
          trendDirection="up"
          trendColor="green"
          icon={<MessageSquare className="w-4.5 h-4.5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title={isRu ? "Отправлено сегодня" : "Sent Today"}
          value="1 248"
          trend="22%"
          trendDirection="up"
          trendColor="green"
          icon={<Send className="w-4.5 h-4.5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title={isRu ? "Доставлено" : "Delivered"}
          value="23 152"
          subValue="93.3%"
          trend="16%"
          trendDirection="up"
          trendColor="green"
          icon={<CheckCheck className="w-4.5 h-4.5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title={isRu ? "Ошибки" : "Errors"}
          value="156"
          subValue="0.6%"
          trend="8%"
          trendDirection="up"
          trendColor="red"
          icon={<X className="w-4.5 h-4.5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-3xs flex flex-wrap gap-4 items-end">
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Поиск' : 'Search'}</span>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRu ? "Поиск по номеру, тексту или ID..." : "Search by telephone, text or ID..."}
              className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>



        {/* Instance select */}
        <div className="w-36">
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
        <div className="w-36">
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

        {/* Type select */}
        <div className="w-36">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Тип' : 'Type'}</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {types.map(t => (
              <option key={t} value={t} className="dark:bg-slate-900">{t === 'Все' ? (isRu ? 'Все типы' : 'All Types') : t}</option>
            ))}
          </select>
        </div>

        {/* Period placeholder range */}
        <div className="w-44">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Период' : 'Period'}</span>
          <div className="bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-500 dark:text-slate-400 font-medium pointer-events-none">
            18.05.2025 – 18.06.2025
          </div>
        </div>

        {/* Reset filters */}
        <button
          onClick={handleResetFilters}
          className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl px-4 py-2 text-xs font-medium cursor-pointer transition-all flex items-center gap-1 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      {/* Main Grid: Split column into Table + Active Chat details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Messages List and segment tabs (col-span-8) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-8 space-y-4">
          {/* Segmented control bar */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
            <div className="flex bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100/60 dark:border-slate-800 gap-1 text-xs">
              <button
                onClick={() => setActiveSegment('all')}
                className={`px-3 py-1.5 font-semibold rounded-lg cursor-pointer transition-all ${
                  activeSegment === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-3xs' 
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {isRu ? 'Все сообщения' : 'All Messages'}
              </button>
              <button
                onClick={() => setActiveSegment('inbound')}
                className={`px-3 py-1.5 font-semibold rounded-lg cursor-pointer transition-all ${
                  activeSegment === 'inbound' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-3xs' 
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {isRu ? 'Входящие' : 'Inbound'}
              </button>
              <button
                onClick={() => setActiveSegment('outbound')}
                className={`px-3 py-1.5 font-semibold rounded-lg cursor-pointer transition-all ${
                  activeSegment === 'outbound' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-3xs' 
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {isRu ? 'Исходящие' : 'Outbound'}
              </button>
              <button
                onClick={() => setActiveSegment('templates')}
                className={`px-3 py-1.5 font-semibold rounded-lg cursor-pointer transition-all ${
                  activeSegment === 'templates' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-3xs' 
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                {isRu ? 'Шаблоны' : 'Templates'}
              </button>
            </div>

            <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRu ? 'Обновить' : 'Refresh'}</span>
            </button>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 font-semibold border-b border-gray-50 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 w-6"></th>
                  <th className="py-2.5">{isRu ? 'Номер' : 'Number'}</th>
                  <th className="py-2.5">{isRu ? 'Инстанс' : 'Instance'}</th>
                  <th className="py-2.5">{isRu ? 'Тип' : 'Type'}</th>
                  <th className="py-2.5">{isRu ? 'Статус' : 'Status'}</th>
                  <th className="py-2.5">{isRu ? 'Время' : 'Time'}</th>
                  <th className="py-2.5 text-right">{isRu ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                {paginated.map((msg) => {
                  const isActive = state.selectedMessageId === msg.id;

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => onSelectMessage(msg.id)}
                      className={`group hover:bg-gray-50/50 dark:hover:bg-slate-850/20 cursor-pointer transition-all ${
                        isActive ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-200 dark:border-slate-800 rounded-sm focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-emerald-500 font-bold font-mono">✆</span>
                        {msg.number}
                      </td>

                      <td className="py-3.5 text-gray-600 dark:text-slate-300 font-semibold">{msg.instance}</td>

                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          msg.type === 'Входящее' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                        }`}>
                          {msg.type}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <StatusBadge status={msg.status} size="sm" />
                      </td>

                      <td className="py-3.5 text-gray-400 dark:text-slate-500 font-mono text-[11px]">{msg.time}</td>

                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end opacity-75 group-hover:opacity-100">
                          <button 
                            onClick={() => onSelectMessage(msg.id)}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                            title={isRu ? "Открыть переписку" : "Open Chat"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400">
                            <CornerUpLeft className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500">
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

          {/* Table pagination footer */}
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
                <select className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-md py-1 px-1.5 text-xs text-gray-600 dark:text-slate-400 font-medium">
                  <option className="dark:bg-slate-900">10</option>
                  <option className="dark:bg-slate-900">20</option>
                  <option className="dark:bg-slate-900">50</option>
                </select>
              </div>

              {/* Page arrows */}
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 disabled:opacity-30 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="px-3 py-1 border rounded-lg font-semibold text-xs bg-blue-600 border-blue-600 text-white shadow-3xs dark:shadow-none"
                >
                  {currentPage}
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 disabled:opacity-30 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chat Переписка widget (col-span-4) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between sticky top-24 h-[580px] overflow-hidden">
          {activeMessage ? (
            <>
              {/* Chat Top header */}
              <div className="p-4 border-b border-gray-50 dark:border-slate-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                    ✆
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{activeMessage.number}</h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                      {isRu ? 'Клиент • RU' : 'Client • RU'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={activeMessage.status} size="sm" />
                  <button 
                    onClick={() => onSelectMessage(null)}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 w-6 h-6 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sub-tabs menu inside the panel: Чат, Детали, История статусов */}
              <div className="px-4 border-b border-gray-50 dark:border-slate-800 flex gap-4 text-xs shrink-0">
                <button
                  onClick={() => setActivePanelTab('chat')}
                  className={`pb-2.5 font-semibold border-b-2 cursor-pointer transition-all ${
                    activePanelTab === 'chat' 
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
                >
                  {isRu ? 'Чат' : 'Chat'}
                </button>
                <button
                  onClick={() => setActivePanelTab('details')}
                  className={`pb-2.5 font-semibold border-b-2 cursor-pointer transition-all ${
                    activePanelTab === 'details' 
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
                >
                  {isRu ? 'Детали' : 'Details'}
                </button>
                <button
                  onClick={() => setActivePanelTab('history')}
                  className={`pb-2.5 font-semibold border-b-2 cursor-pointer transition-all ${
                    activePanelTab === 'history' 
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
                >
                  {isRu ? 'История статусов' : 'Status History'}
                </button>
              </div>

              {/* Chat panel main body scroll */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-slate-950/40 space-y-3.5 min-h-0">
                {activePanelTab === 'chat' && (
                  <>
                    <div className="text-center">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-3 py-1 rounded-full shadow-3xs">
                        18 июня 2025
                      </span>
                    </div>

                    {conversation.map((msgItem) => {
                      const isInbound = msgItem.type === 'Входящее';
                      return (
                        <div 
                          key={msgItem.id} 
                          className={`flex flex-col max-w-[85%] gap-1 ${
                            isInbound ? 'mr-auto items-start' : 'ml-auto items-end'
                          }`}
                        >
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isInbound 
                              ? 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-800 rounded-tl-sm' 
                              : 'bg-blue-600 text-white rounded-tr-sm'
                          }`}>
                            <p className="whitespace-pre-wrap">{msgItem.messageText || 'Без текста'}</p>
                          </div>
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono flex items-center gap-1">
                            {msgItem.time.split(' ')[1] || '14:20'}
                            {!isInbound && <span className="text-emerald-500">✓✓</span>}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </>
                )}

                {activePanelTab === 'details' && (
                  <div className="space-y-3.5 text-xs text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-100/60 dark:border-slate-800 rounded-xl p-4 shadow-3xs">
                    <div>
                      <span className="text-gray-400 dark:text-slate-500 block mb-1">{isRu ? 'ID Сообщения' : 'Message ID'}</span>
                      <code className="bg-gray-50 dark:bg-slate-950 px-2 py-1 rounded-md text-[10px] text-gray-500 dark:text-slate-400 font-mono border border-gray-100/10 dark:border-slate-800">
                        msg_{activeMessage.id}A7F2D991
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-slate-500 block mb-1">{isRu ? 'Инстанс-отправитель' : 'Sender Instance'}</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{activeMessage.instance}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 dark:text-slate-500 block mb-1">{isRu ? 'Технические детали доставки' : 'Delivery details'}</span>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{activeMessage.details || 'Доставлено до адресата успешно.'}</p>
                    </div>
                  </div>
                )}

                {activePanelTab === 'history' && (
                  <div className="space-y-4 bg-white dark:bg-slate-900 border border-gray-100/60 dark:border-slate-800 rounded-xl p-4 shadow-3xs text-left">
                    <h4 className="font-semibold text-xs text-gray-800 dark:text-white mb-2">{isRu ? 'События жизненного цикла' : 'Lifecycle Milestones'}</h4>
                    <div className="relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-800 space-y-4">
                      {(activeMessage.statusHistory || [
                        { status: 'Создано', time: activeMessage.time },
                        { status: 'Отправлено', time: activeMessage.time },
                        { status: 'Доставлено', time: activeMessage.time }
                      ]).map((hist, idx) => (
                        <div key={idx} className="flex gap-3 text-xs relative z-10">
                          <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[9px] font-extrabold shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-slate-200">{hist.status}</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{hist.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat composition compose bar (shrink-0) */}
              <div className="p-3 border-t border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                {activePanelTab === 'chat' ? (
                  <form onSubmit={handleComposeSend} className="relative flex items-center">
                    <div className="absolute left-2.5 flex items-center gap-1.5 text-gray-400">
                      <button type="button" className="p-1 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <Smile className="w-4.5 h-4.5" />
                      </button>
                      <button type="button" className="p-1 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <Paperclip className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      placeholder={isRu ? "Введите сообщение..." : "Type a message..."}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-full py-2.5 pl-20 pr-12 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                    />

                    <button
                      type="submit"
                      disabled={!composeText.trim()}
                      className="absolute right-1.5 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 rotate-45 -translate-x-0.5" />
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-2 text-gray-400 dark:text-slate-500 font-medium text-[10px]">
                    {isRu ? 'Для отправки перейдите на вкладку Чат' : 'Switch to Chat tab to type reply'}
                  </div>
                )}
                
                {/* Chat footer metadata */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-gray-400 dark:text-slate-500 font-medium border-t border-gray-50 dark:border-slate-800 mt-3 pt-2.5 px-1.5">
                  <div className="flex justify-between">
                    <span>{isRu ? 'Время создания' : 'Created time'}</span>
                    <span className="text-gray-700 dark:text-slate-300 font-mono">{activeMessage.time.split(' ')[1]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRu ? 'Канал' : 'Channel'}</span>
                    <span className="text-gray-700 dark:text-slate-300 font-semibold">WhatsApp</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRu ? 'Шаблон' : 'Template'}</span>
                    <span className="text-gray-700 dark:text-slate-300 font-semibold">welcome_msg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isRu ? 'Язык' : 'Language'}</span>
                    <span className="text-gray-700 dark:text-slate-300 font-semibold">ru</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-32 text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-slate-700 stroke-1" />
              <p className="text-xs font-semibold px-6 leading-relaxed">
                {isRu ? 'Выберите сообщение из списка для открытия чата переписки' : 'Select a message to inspect the client conversation log'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
