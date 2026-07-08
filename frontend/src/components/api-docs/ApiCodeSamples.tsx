import React from 'react';
import { Code2, Copy, Terminal } from 'lucide-react';
import type { ApiDocsTab } from './apiDocsData';

type Samples = Record<ApiDocsTab, { get: string; post: string }>;

type Props = {
  samples: Samples;
  activeTab: ApiDocsTab;
  onTabChange: (tab: ApiDocsTab) => void;
  title: string;
  subtitle: string;
  getLabel: string;
  postLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
};

const tabs: Array<{ id: ApiDocsTab; label: string }> = [
  { id: 'curl', label: 'cURL' },
  { id: 'js', label: 'JavaScript' },
  { id: 'php', label: 'PHP' },
  { id: 'python', label: 'Python' }
];

export const ApiCodeSamples: React.FC<Props> = ({
  samples,
  activeTab,
  onTabChange,
  title,
  subtitle,
  getLabel,
  postLabel,
  copyLabel,
  copiedLabel,
  copiedKey,
  onCopy
}) => {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Code2 className="h-4 w-4" />
          {title}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 pb-3 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-inner">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Terminal className="h-4 w-4" />
              {getLabel}
            </div>
            <button
              type="button"
              onClick={() => onCopy(samples[activeTab].get, `get-${activeTab}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === `get-${activeTab}` ? copiedLabel : copyLabel}
            </button>
          </div>
          <pre className="overflow-x-auto text-xs leading-6 text-amber-300">{samples[activeTab].get}</pre>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-inner">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-base">↪</span>
              {postLabel}
            </div>
            <button
              type="button"
              onClick={() => onCopy(samples[activeTab].post, `post-${activeTab}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedKey === `post-${activeTab}` ? copiedLabel : copyLabel}
            </button>
          </div>
          <pre className="overflow-x-auto text-xs leading-6 text-cyan-200">{samples[activeTab].post}</pre>
        </div>
      </div>
    </div>
  );
};
