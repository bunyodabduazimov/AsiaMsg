import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  Upload,
  X
} from 'lucide-react';
import { AppState, Message } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface MessagesViewProps {
  state: AppState;
  onSelectMessage: (id: string | null) => void;
  onAddMessage: (msg: Message) => Promise<Message | void> | Message | void;
  onRefreshMessages?: () => void | Promise<void>;
  onSendMessageClick?: () => void;
}

type Segment = 'all' | 'inbound' | 'outbound' | 'errors';
type ComposeType = 'text' | 'file';

type ComposeState = {
  instanceId: string;
  remoteJid: string;
  type: ComposeType;
  messageText: string;
  attachmentName: string;
  attachmentType: string;
  attachmentData: string;
};

const itemsPerPage = 8;

const formatShort = (value: string) => value.replace(/\s+/g, ' ').trim();

const createMessageTime = () => new Date().toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

export const MessagesView: React.FC<MessagesViewProps> = ({
  state,
  onSelectMessage,
  onAddMessage,
  onRefreshMessages,
  onSendMessageClick,
}) => {
  const isRu = state.language === 'RU';
  const [searchQuery, setSearchQuery] = useState('');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [segment, setSegment] = useState<Segment>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [compose, setCompose] = useState<ComposeState>({
    instanceId: state.instances[0]?.id || '',
    remoteJid: '',
    type: 'text',
    messageText: '',
    attachmentName: '',
    attachmentType: '',
    attachmentData: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = state.messages.length;
    const inbound = state.messages.filter(message => message.type === 'Входящее').length;
    const outbound = state.messages.filter(message => message.type === 'Исходящее').length;
    const errors = state.messages.filter(message => message.status === 'Ошибка').length;
    return { total, inbound, outbound, errors };
  }, [state.messages]);

  const instanceOptions = useMemo(() => {
    return state.instances.map(instance => ({ id: instance.id, name: instance.name }));
  }, [state.instances]);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return state.messages
      .filter(message => {
        const matchesQuery =
          !query ||
          message.id.toLowerCase().includes(query) ||
          message.number.toLowerCase().includes(query) ||
          message.instance.toLowerCase().includes(query) ||
          message.messageText.toLowerCase().includes(query);

        const matchesInstance = instanceFilter === 'all' || message.instance === instanceFilter;
        const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
        const matchesType = typeFilter === 'all' || message.type === typeFilter;

        const matchesSegment =
          segment === 'all' ||
          (segment === 'inbound' && message.type === 'Входящее') ||
          (segment === 'outbound' && message.type === 'Исходящее') ||
          (segment === 'errors' && message.status === 'Ошибка');

        return matchesQuery && matchesInstance && matchesStatus && matchesType && matchesSegment;
      })
      .slice()
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [searchQuery, instanceFilter, statusFilter, typeFilter, segment, state.messages]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleMessages = filteredMessages.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const activeMessage = useMemo(() => {
    const selected = state.selectedMessageId
      ? filteredMessages.find(message => message.id === state.selectedMessageId)
      : null;

    return selected || filteredMessages[0] || null;
  }, [filteredMessages, state.selectedMessageId]);

  const conversation = useMemo(() => {
    if (!activeMessage) return [];

    return state.messages
      .filter(message => message.number === activeMessage.number)
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activeMessage, state.messages]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessage?.id, conversation.length, composeOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, instanceFilter, statusFilter, typeFilter, segment]);

  useEffect(() => {
    if (compose.instanceId || !state.instances[0]) return;
    setCompose(prev => ({ ...prev, instanceId: state.instances[0].id }));
  }, [compose.instanceId, state.instances]);

  const openCompose = () => {
    setCompose({
      instanceId: state.instances[0]?.id || '',
      remoteJid: activeMessage?.number || '',
      type: 'text',
      messageText: '',
      attachmentName: '',
      attachmentType: '',
      attachmentData: ''
    });
    setSelectedFile(null);
    setComposeOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setInstanceFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setSegment('all');
    setCurrentPage(1);
  };

  const handleFilePick = (file: File | null) => {
    setSelectedFile(file);

    if (!file) {
      setCompose(prev => ({
        ...prev,
        attachmentName: '',
        attachmentType: '',
        attachmentData: ''
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] || '' : result;
      setCompose(prev => ({
        ...prev,
        attachmentName: file.name,
        attachmentType: file.type,
        attachmentData: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCompose = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!compose.instanceId || !compose.remoteJid.trim() || !compose.messageText.trim()) return;
    if (compose.type === 'file' && !compose.attachmentData) return;

    const instanceName = instanceOptions.find(item => item.id === compose.instanceId)?.name || compose.instanceId;
    const message: Message = {
      id: `msg-${Date.now()}`,
      number: compose.remoteJid.trim(),
      instance: instanceName,
      instanceId: compose.instanceId,
      type: 'Исходящее',
      status: 'Отправлено',
      time: createMessageTime(),
      messageText: compose.messageText.trim(),
      details: selectedFile
        ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
        : compose.remoteJid.trim(),
      attachmentName: selectedFile?.name,
      attachmentType: selectedFile?.type,
      attachmentSize: selectedFile?.size,
      attachmentData: compose.attachmentData,
      statusHistory: [
        { status: 'Создано', time: createMessageTime() },
        { status: 'Отправлено', time: createMessageTime() }
      ]
    };

    try {
      setSending(true);
      const created = await Promise.resolve(onAddMessage(message));
      onSelectMessage((created as Message | undefined)?.id || message.id);
      setComposeOpen(false);
      setSelectedFile(null);
      setCompose(prev => ({
        ...prev,
        remoteJid: '',
        messageText: '',
        attachmentName: '',
        attachmentType: ''
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isRu ? 'Сообщения' : 'Messages'}
          </h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {isRu ? 'Данные читаются из базы и синхронизируются с backend' : 'Data is loaded from the database and synced with backend'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCompose}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {isRu ? 'Отправить сообщение' : 'Send message'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={isRu ? 'Всего' : 'Total'}
          value={stats.total.toLocaleString('ru-RU')}
          trend="—"
          trendDirection="up"
          trendColor="green"
          icon={<MessageSquare className="h-4.5 w-4.5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title={isRu ? 'Входящие' : 'Inbound'}
          value={stats.inbound.toLocaleString('ru-RU')}
          trend="—"
          trendDirection="up"
          trendColor="green"
          icon={<ChevronLeft className="h-4.5 w-4.5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title={isRu ? 'Исходящие' : 'Outbound'}
          value={stats.outbound.toLocaleString('ru-RU')}
          trend="—"
          trendDirection="up"
          trendColor="green"
          icon={<Send className="h-4.5 w-4.5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title={isRu ? 'Ошибки' : 'Errors'}
          value={stats.errors.toLocaleString('ru-RU')}
          trend="—"
          trendDirection="down"
          trendColor="red"
          icon={<CheckCheck className="h-4.5 w-4.5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isRu ? 'Поиск по номеру, тексту или ID...' : 'Search by number, text or ID...'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={isRu ? 'Очистить поиск' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
            {isRu ? 'Сбросить' : 'Reset'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-4">
          {([
            { id: 'all', label: isRu ? 'Все' : 'All' },
            { id: 'inbound', label: isRu ? 'Входящие' : 'Inbound' },
            { id: 'outbound', label: isRu ? 'Исходящие' : 'Outbound' },
            { id: 'errors', label: isRu ? 'Ошибки' : 'Errors' }
          ] as const).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSegment(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                segment === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="ml-auto flex flex-wrap gap-2">
            <select
              value={instanceFilter}
              onChange={e => setInstanceFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">{isRu ? 'Все инстансы' : 'All instances'}</option>
              {state.instances.map(instance => (
                <option key={instance.id} value={instance.name}>
                  {instance.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">{isRu ? 'Все статусы' : 'All statuses'}</option>
              <option value="Отправлено">{isRu ? 'Отправлено' : 'Sent'}</option>
              <option value="Доставлено">{isRu ? 'Доставлено' : 'Delivered'}</option>
              <option value="Ошибка">{isRu ? 'Ошибка' : 'Error'}</option>
              <option value="В очереди">{isRu ? 'В очереди' : 'Queued'}</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="all">{isRu ? 'Все типы' : 'All types'}</option>
              <option value="Входящее">{isRu ? 'Входящее' : 'Inbound'}</option>
              <option value="Исходящее">{isRu ? 'Исходящее' : 'Outbound'}</option>
            </select>
          </div>
        </div>

        <div className="grid min-h-[640px] gap-0 border-t border-slate-100 xl:grid-cols-[1.08fr_0.92fr] dark:border-slate-800">
          <section className="border-b border-slate-100 xl:border-b-0 xl:border-r dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-400">
                {isRu
                  ? `Показано ${filteredMessages.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–${Math.min(safePage * itemsPerPage, filteredMessages.length)} из ${filteredMessages.length}`
                  : `Showing ${filteredMessages.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–${Math.min(safePage * itemsPerPage, filteredMessages.length)} of ${filteredMessages.length}`}
              </div>

              <button
                type="button"
                onClick={() => {
                  void onRefreshMessages?.();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {isRu ? 'Обновить' : 'Refresh'}
              </button>
            </div>

            {visibleMessages.length === 0 ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-10 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {isRu ? 'Сообщения не найдены' : 'No messages found'}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {isRu ? 'Попробуйте изменить фильтры или поиск' : 'Try changing filters or search'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleMessages.map(message => {
                  const isActive = state.selectedMessageId === message.id;

                  return (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => onSelectMessage(message.id)}
                      className={`w-full px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        isActive ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-sm">
                          {message.number.replace(/\D/g, '').slice(-2) || 'WA'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {message.number}
                              </div>
                              <div className="mt-1 truncate text-xs text-slate-400">
                                {message.instance}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <StatusBadge status={message.status} size="sm" />
                              <span className="text-[10px] font-medium text-slate-400">{message.time}</span>
                            </div>
                          </div>

                          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {formatShort(message.messageText)}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              message.type === 'Входящее'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            }`}>
                              {message.type}
                            </span>
                            {message.attachmentName && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                {message.attachmentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-400 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 font-semibold text-white">
                  {safePage}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <span>
                {isRu ? 'Страница сообщений' : 'Message page'}
              </span>
            </div>
          </section>

          <section className="sticky top-24 bg-slate-50/50 dark:bg-slate-950/30">
            {activeMessage ? (
              <div className="flex h-full min-h-[640px] flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeMessage.number}</h2>
                    <p className="mt-1 text-xs text-slate-400">{activeMessage.instance}</p>
                  </div>

                  <StatusBadge status={activeMessage.status} size="sm" />
                </div>

                <div className="grid gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {isRu ? 'Время' : 'Time'}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{activeMessage.time}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {isRu ? 'Тип' : 'Type'}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{activeMessage.type}</div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                  <div className="text-center">
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      {isRu ? 'Переписка' : 'Conversation'}
                    </span>
                  </div>

                  {conversation.map(message => {
                    const isInbound = message.type === 'Входящее';

                    return (
                      <div key={message.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isInbound
                            ? 'rounded-tl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                            : 'rounded-tr-md bg-blue-600 text-white'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.messageText || (isRu ? 'Без текста' : 'No text')}</div>
                          {message.attachmentName && (
                            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                              isInbound ? 'bg-slate-100 text-slate-500' : 'bg-white/15 text-white/90'
                            }`}>
                              <Paperclip className="h-3 w-3" />
                              {message.attachmentName}
                            </div>
                          )}
                          <div className={`mt-2 flex items-center justify-between gap-3 text-[10px] ${isInbound ? 'text-slate-400' : 'text-blue-100'}`}>
                            <span>{message.time}</span>
                            <span>{message.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={chatBottomRef} />
                </div>

                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={openCompose}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    {isRu ? 'Ответить / отправить' : 'Reply / send'}
                  </button>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openCompose}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <Smile className="h-3.5 w-3.5" />
                      {isRu ? 'Шаблон' : 'Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectMessage(null)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <X className="h-3.5 w-3.5" />
                      {isRu ? 'Снять выбор' : 'Clear selection'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[640px] flex-col items-center justify-center px-6 py-10 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {isRu ? 'Выберите диалог' : 'Select a conversation'}
                </h3>
                <p className="mt-2 max-w-sm text-xs text-slate-400">
                  {isRu ? 'Справа появится чат и форма ответа' : 'The chat and reply form will appear here'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isRu ? 'Отправить сообщение' : 'Send message'}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {isRu ? 'Заполните поля и отправьте сообщение из интерфейса' : 'Fill in the fields and send from the interface'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompose} className="space-y-4 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">{isRu ? 'Кому' : 'To'}</span>
                  <input
                    value={compose.remoteJid}
                    onChange={e => setCompose(prev => ({ ...prev, remoteJid: e.target.value }))}
                    placeholder="+992..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">{isRu ? 'Инстанс' : 'Instance'}</span>
                  <select
                    value={compose.instanceId}
                    onChange={e => setCompose(prev => ({ ...prev, instanceId: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {instanceOptions.length === 0 ? (
                      <option value="">{isRu ? 'Нет инстансов' : 'No instances'}</option>
                    ) : (
                      instanceOptions.map(instance => (
                        <option key={instance.id} value={instance.id}>
                          {instance.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">{isRu ? 'Текст' : 'Text'}</span>
                  <textarea
                    value={compose.messageText}
                    onChange={e => setCompose(prev => ({ ...prev, messageText: e.target.value }))}
                    placeholder={isRu ? 'Введите сообщение...' : 'Type a message...'}
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">{isRu ? 'Тип' : 'Type'}</span>
                  <select
                    value={compose.type}
                    onChange={e => setCompose(prev => ({ ...prev, type: e.target.value as ComposeType }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="text">{isRu ? 'Текст' : 'Text'}</option>
                    <option value="file">{isRu ? 'Файл' : 'File'}</option>
                  </select>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => handleFilePick(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <Upload className="h-4 w-4" />
                      {isRu ? 'Добавить файл' : 'Add file'}
                    </button>
                    <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                      <div>{selectedFile ? selectedFile.name : (isRu ? 'Файл не выбран' : 'No file selected')}</div>
                      <div>{isRu ? 'Файл будет сохранён в payload сообщения' : 'The file will be stored in the message payload'}</div>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? (isRu ? 'Отправка...' : 'Sending...') : (isRu ? 'Отправить' : 'Send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
