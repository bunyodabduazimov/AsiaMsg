import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Globe, 
  Check, 
  Copy, 
  Play, 
  Eye, 
  EyeOff, 
  X, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Radio,
  Clock,
  CheckCircle,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { AppState, Webhook } from '../../types';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

interface WebhooksViewProps {
  state: AppState;
  onSelectWebhook: (id: string | null) => void;
  onAddWebhook: (wh: Webhook) => void;
  onToggleWebhookActive: (id: string) => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({
  state,
  onSelectWebhook,
  onAddWebhook,
  onToggleWebhookActive
}) => {
  const isRu = state.language === 'RU';

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstance, setFilterInstance] = useState('Все');
  const [filterMethod, setFilterMethod] = useState('Все');

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);
  const [testPayloadType, setTestPayloadType] = useState('message.received');
  const [testResult, setTestResult] = useState<{status: number; time: string; body: string} | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSendTestEvent = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        status: 200,
        time: '124 ms',
        body: JSON.stringify({
          success: true,
          event_id: `evt_${Math.random().toString(36).substring(2, 9)}`,
          received_at: new Date().toISOString()
        }, null, 2)
      });
    }, 1200);
  };

  const selectedWh = state.webhooks.find(w => w.id === state.selectedWebhookId) || null;

  // Options
  const instances = ['Все', 'Sales Bot', 'Support Line', 'Marketing', 'Notifications'];
  const methods = ['Все', 'POST', 'GET'];

  // Filter
  const filtered = state.webhooks.filter(wh => {
    const matchesSearch = 
      wh.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstance = filterInstance === 'Все' || wh.instance === filterInstance;
    const matchesMethod = filterMethod === 'Все' || wh.method === filterMethod;
    return matchesSearch && matchesInstance && matchesMethod;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterInstance('Все');
    setFilterMethod('Все');
    setCurrentPage(1);
  };

  // Stats
  const totalCount = state.webhooks.length;
  const activeCount = state.webhooks.filter(w => w.active).length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRu ? 'Webhooks' : 'Webhooks'}
          </h1>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">
            {isRu ? 'Настройка URL для автоматического получения событий WhatsApp' : 'Configure destination URLs for near-instantaneous WhatsApp event callbacks'}
          </p>
        </div>
        
        <button
          onClick={() => {
            const newWh: Webhook = {
              id: `wh-${Date.now()}`,
              endpoint: 'https://api.crm.com/v1/new-webhook',
              instance: 'Sales Bot',
              event: 'message.received',
              method: 'POST',
              status: 'Активен',
              code: 200,
              lastDelivery: '07.07.2026 12:00',
              active: true,
              configuredEvents: ['message.received', 'message.sent'],
              responseSpeed: '145 ms',
              signatureKey: 'whsec_e393a7fa81bf9d81d6aa02fe01844b2f',
              recentDeliveries: [
                { id: '1', method: 'POST', status: 200, speed: '145 ms', time: '07.07.2026 12:00', event: 'message.received' }
              ]
            };
            onAddWebhook(newWh);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRu ? 'Создать webhook' : 'Create Webhook'}</span>
        </button>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isRu ? "Всего webhooks" : "Total Webhooks"}
          value={totalCount}
          trend="1 с прошлой недели"
          trendDirection="up"
          trendColor="green"
          icon={<Globe className="w-4.5 h-4.5" />}
          iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title={isRu ? "Успешно (200 OK)" : "Success Rate (200 OK)"}
          value="99.4%"
          trend="0.2% с вчера"
          trendDirection="up"
          trendColor="green"
          icon={<CheckCircle className="w-4.5 h-4.5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title={isRu ? "Ошибки (5xx/4xx)" : "Failure Rate (5xx/4xx)"}
          value="0.6%"
          trend="0.1% с вчера"
          trendDirection="down"
          trendColor="red"
          icon={<AlertTriangle className="w-4.5 h-4.5" />}
          iconBg="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          title={isRu ? "Среднее время ответа" : "Avg Response Speed"}
          value="245 ms"
          trend="-12ms с вчера"
          trendDirection="up"
          trendColor="green"
          icon={<Clock className="w-4.5 h-4.5" />}
          iconBg="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
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
              placeholder={isRu ? "Поиск по URL или событию..." : "Search by URL or event..."}
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

        {/* Method select */}
        <div className="w-40">
          <span className="block text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5">{isRu ? 'Метод' : 'Method'}</span>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full bg-gray-50/60 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-gray-700 dark:text-slate-300 font-medium focus:outline-hidden focus:border-blue-500"
          >
            {methods.map(m => (
              <option key={m} value={m} className="dark:bg-slate-900">{m === 'Все' ? (isRu ? 'Все методы' : 'All Methods') : m}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-xl px-4 py-2 text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>{isRu ? 'Сбросить' : 'Reset'}</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table list block */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-8 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 font-semibold border-b border-gray-50 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 w-6"></th>
                  <th className="py-2.5">{isRu ? 'Метод' : 'Method'}</th>
                  <th className="py-2.5">{isRu ? 'URL эндпоинта' : 'Endpoint URL'}</th>
                  <th className="py-2.5">{isRu ? 'Инстанс' : 'Instance'}</th>
                  <th className="py-2.5">{isRu ? 'Конфигурированные события' : 'Events'}</th>
                  <th className="py-2.5 text-center">Code</th>
                  <th className="py-2.5 text-center">{isRu ? 'Активен' : 'Active'}</th>
                  <th className="py-2.5 text-right">{isRu ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-gray-700 dark:text-slate-300">
                {paginated.map((wh) => {
                  const isActive = state.selectedWebhookId === wh.id;

                  return (
                    <tr
                      key={wh.id}
                      onClick={() => onSelectWebhook(wh.id)}
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

                      {/* Method label */}
                      <td className="py-3.5 font-mono text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-sm">
                          {wh.method}
                        </span>
                      </td>

                      {/* URL */}
                      <td className="py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white break-all">{wh.endpoint}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{wh.event}</div>
                      </td>

                      <td className="py-3.5 text-gray-600 dark:text-slate-300 font-semibold">{wh.instance}</td>

                      {/* Events list */}
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(wh.configuredEvents || [wh.event]).slice(0, 2).map((evt, idx) => (
                            <span key={idx} className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold">
                              {evt}
                            </span>
                          ))}
                          {(wh.configuredEvents || [wh.event]).length > 2 && (
                            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-sm px-1 py-0.5 text-[9px] font-bold">
                              +{(wh.configuredEvents || [wh.event]).length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-sm font-semibold text-[10px] ${
                          wh.code === 200 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                        }`}>
                          ✓ {wh.code}
                        </span>
                      </td>

                      {/* Toggle status */}
                      <td className="py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleWebhookActive(wh.id)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                            wh.active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white shadow-3xs transition-transform ${
                            wh.active ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button 
                            onClick={() => handleCopy(wh.endpoint, wh.id)}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white rounded-md cursor-pointer">
                            <Sliders className="w-4 h-4" />
                          </button>
                        </div>
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

        {/* Right Detail Panel with Event simulation testing */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5 sticky top-24">
          {selectedWh ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                    selectedWh.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
                  }`} />
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    {selectedWh.active ? (isRu ? 'Активен' : 'Active') : (isRu ? 'Приостановлен' : 'Paused')}
                  </span>
                </div>
                <button 
                  onClick={() => onSelectWebhook(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white w-6 h-6 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white break-all">{selectedWh.endpoint}</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-wide">
                  {isRu ? 'Webhook Настройки' : 'Webhook Settings'}
                </p>
              </div>

              {/* Interactive payload event sandbox tester */}
              <div className="bg-gray-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-200/50 dark:border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    {isRu ? 'Протестировать Webhook' : 'Ping Event Sandbox'}
                  </span>
                  <Code2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] text-gray-400 dark:text-slate-500">{isRu ? 'Выберите событие' : 'Select Event'}</span>
                  <select
                    value={testPayloadType}
                    onChange={(e) => setTestPayloadType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg p-2 text-xs text-gray-600 dark:text-slate-300 focus:outline-hidden"
                  >
                    <option value="message.received">message.received</option>
                    <option value="message.sent">message.sent</option>
                    <option value="instance.status_changed">instance.status_changed</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEvent}
                  disabled={isTesting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isRu ? 'Отправка...' : 'Sending ping...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isRu ? 'Отправить тестовое событие' : 'Send Test Event'}</span>
                    </>
                  )}
                </button>

                {/* Simulated response box */}
                {testResult && (
                  <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ {testResult.status} OK</span>
                      <span className="text-gray-400 dark:text-slate-500">{testResult.time}</span>
                    </div>
                    <pre className="bg-gray-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 border border-gray-100 dark:border-slate-800 rounded-lg p-2.5 font-mono text-[9px] overflow-x-auto max-h-32 text-left">
                      {testResult.body}
                    </pre>
                  </div>
                )}
              </div>

              {/* Config fields info */}
              <div className="space-y-2 text-xs border-b border-gray-50 dark:border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Инстанс' : 'Instance'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{selectedWh.instance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">{isRu ? 'Метод' : 'Method'}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200 font-mono text-[11px]">{selectedWh.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">Формат</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200 font-mono">JSON</span>
                </div>
              </div>

              {/* Configure signature secret */}
              <div className="space-y-2 border-b border-gray-50 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block">
                  {isRu ? 'Секретная подпись (Signature key)' : 'Secret Signature key'}
                </span>
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl p-2">
                  <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400 flex-1 truncate select-all">
                    {revealSecret 
                      ? (selectedWh.signatureKey || 'whsec_e393a7fa81bf9d81d6aa02fe01844b2f')
                      : `whsec_${'•'.repeat(24)}${(selectedWh.signatureKey || 'a7f3').slice(-4)}`
                    }
                  </span>
                  <button 
                    onClick={() => setRevealSecret(!revealSecret)}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                  >
                    {revealSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => handleCopy(selectedWh.signatureKey || 'whsec_e393a7fa81bf9d81d6aa02fe01844b2f', 'sig')}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    {copiedField === 'sig' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Configured events tags */}
              <div className="space-y-2 border-b border-gray-50 dark:border-slate-800 pb-3 text-left">
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block">
                  {isRu ? 'Настроенные события' : 'Configured Events'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedWh.configuredEvents || [selectedWh.event]).map((evt, index) => (
                    <span key={index} className="bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-md px-2 py-0.5 text-[9px] font-semibold font-mono">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delivery logs timelines */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 block">{isRu ? 'Последние доставки' : 'Recent Deliveries Log'}</span>
                <div className="space-y-2.5 text-[11px] text-left">
                  {(selectedWh.recentDeliveries || [
                    { id: '1', method: 'POST', status: 200, speed: selectedWh.responseSpeed || '240ms', time: selectedWh.lastDelivery, event: selectedWh.event }
                  ]).map((delivery) => (
                    <div key={delivery.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded-sm">
                          {delivery.method}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[130px]" title={delivery.event}>
                          {delivery.event}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className={`font-bold ${delivery.status === 200 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {delivery.status}
                        </span>
                        <span className="text-gray-400 dark:text-slate-500">{delivery.speed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <Globe className="w-10 h-10 text-gray-300 dark:text-slate-700 stroke-1" />
              <p className="text-xs font-semibold">{isRu ? 'Выберите webhook из списка для просмотра параметров эндпоинта и истории доставок' : 'Select a webhook configuration to view properties and delivery logs'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
