import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  RefreshCw,
  Search
} from 'lucide-react';
import { AppState } from '../../types';
import { useTranslation } from 'react-i18next';

interface MessagesViewProps {
  state: AppState;
  onSelectMessage: (id: string | null) => void;
  onAddMessage: (...args: unknown[]) => unknown;
  onRefreshMessages?: () => void | Promise<void>;
}

type Segment = 'all' | 'inbound' | 'outbound' | 'errors';

const itemsPerPage = 10;

const toLower = (value: string) => value.toLowerCase();

export const MessagesView: React.FC<MessagesViewProps> = ({
  state,
  onSelectMessage,
  onRefreshMessages
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [segment, setSegment] = useState<Segment>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const visibleMessagesSource = useMemo(
    () => state.messages.filter(message => message.number.toLowerCase() !== 'status@broadcast'),
    [state.messages]
  );

  const stats = useMemo(() => {
    const total = visibleMessagesSource.length;
    const inbound = visibleMessagesSource.filter(message => toLower(message.type).includes('РІС…РѕРґ')).length;
    const outbound = visibleMessagesSource.filter(message => toLower(message.type).includes('РёСЃС…РѕРґ')).length;
    const errors = visibleMessagesSource.filter(message => toLower(message.status).includes('РѕС€РёР±')).length;
    return { total, inbound, outbound, errors };
  }, [visibleMessagesSource]);

  const instanceOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const instance of state.instances) {
      names.set(instance.name, instance.name);
    }
    for (const message of visibleMessagesSource) {
      if (!names.has(message.instance)) {
        names.set(message.instance, message.instance);
      }
    }
    return Array.from(names.values());
  }, [state.instances, visibleMessagesSource]);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return visibleMessagesSource
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
          (segment === 'inbound' && toLower(message.type).includes('РІС…РѕРґ')) ||
          (segment === 'outbound' && toLower(message.type).includes('РёСЃС…РѕРґ')) ||
          (segment === 'errors' && toLower(message.status).includes('РѕС€РёР±'));

        return matchesQuery && matchesInstance && matchesStatus && matchesType && matchesSegment;
      })
      .slice()
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [searchQuery, instanceFilter, statusFilter, typeFilter, segment, visibleMessagesSource]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleMessages = filteredMessages.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, instanceFilter, statusFilter, typeFilter, segment]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearchQuery('');
    setInstanceFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setSegment('all');
    setCurrentPage(1);
  };

  const handleRowClick = (id: string) => {
    onSelectMessage(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {t('messages.title')}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {t('messages.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshMessages}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          {t('instances.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={<MessageSquare className="h-5 w-5" />} label="Total" value={stats.total} />
        <MetricCard icon={<ArrowDownLeft className="h-5 w-5" />} label={t('messages.inbound')} value={stats.inbound} />
        <MetricCard icon={<ArrowUpRight className="h-5 w-5" />} label={t('messages.outbound')} value={stats.outbound} />
        <MetricCard icon={<AlertTriangle className="h-5 w-5" />} label={t('overview.errors')} value={stats.errors} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder={t('logs.title') + '...'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={instanceFilter}
              onChange={event => setInstanceFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">{t('instances.title')}</option>
              {instanceOptions.map(instance => (
                <option key={instance} value={instance}>
                  {instance}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">{t('messages.status')}</option>
              <option value="РћС‚РїСЂР°РІР»РµРЅРѕ">{t('messages.sent')}</option>
              <option value="Р”РѕСЃС‚Р°РІР»РµРЅРѕ">{t('messages.delivered')}</option>
              <option value="РћС€РёР±РєР°">{t('common.error')}</option>
              <option value="Р’ РѕС‡РµСЂРµРґРё">Queued</option>
            </select>

            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">{t('messages.direction')}</option>
              <option value="Р’С…РѕРґСЏС‰РµРµ">{t('messages.inbound')}</option>
              <option value="РСЃС…РѕРґСЏС‰РµРµ">{t('messages.outbound')}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 pt-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'inbound' as const, label: t('messages.inbound') },
              { id: 'outbound' as const, label: t('messages.outbound') },
              { id: 'errors' as const, label: t('overview.errors') }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSegment(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  segment === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                <th className="px-5 py-4">{t('messages.time')}</th>
                <th className="px-5 py-4">{t('messages.direction')}</th>
                <th className="px-5 py-4">{t('instances.phone')}</th>
                <th className="px-5 py-4">{t('nav.instances')}</th>
                <th className="px-5 py-4">{t('messages.status')}</th>
                <th className="px-5 py-4">{t('messages.content')}</th>
                <th className="px-5 py-4">Тип</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleMessages.map(message => {
                const isSelected = state.selectedMessageId === message.id;
                const isInbound = toLower(message.type).includes('РІС…РѕРґ');
                return (
                  <tr
                    key={message.id}
                    onClick={() => handleRowClick(message.id)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{message.time}</td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                        isInbound ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {isInbound ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        {message.type}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{message.number}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{message.instance}</td>
                    <td className="px-5 py-4">
                      <StatusPill value={message.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[320px] text-sm text-slate-700">
                        <p className="line-clamp-2">
                          {message.messageText || message.attachmentName || message.attachmentType || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                      <span>{message.contentType || 'other'}</span>
                    </td>
                  </tr>
                );
              })}

              {!visibleMessages.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm font-semibold text-slate-400">
                    {t('messages.noMessages')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-400">
            {`Showing ${visibleMessages.length ? (safePage - 1) * itemsPerPage + 1 : 0}вЂ“${Math.min(safePage * itemsPerPage, filteredMessages.length)} of ${filteredMessages.length}`}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safePage === 1}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
              {safePage}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safePage === totalPages || totalPages === 0}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      <span className="text-2xl font-bold text-slate-950">{value}</span>
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const StatusPill = ({ value }: { value: string }) => {
  const lower = value.toLowerCase();
  const className = lower.includes('РѕС€РёР±')
    ? 'bg-rose-50 text-rose-700'
    : lower.includes('РґРѕСЃС‚Р°РІ')
      ? 'bg-emerald-50 text-emerald-700'
      : lower.includes('РѕС‡РµСЂРµРґ')
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-50 text-slate-700';

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}>{value}</span>;
};

