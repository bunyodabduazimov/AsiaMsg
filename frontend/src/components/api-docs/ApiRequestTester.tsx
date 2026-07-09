import React from 'react';
import type { LocalizedApiDocsField } from './apiDocsData';

type Props = {
  fields: LocalizedApiDocsField[];
  instances: Array<{
    id: string;
    name: string;
    number: string;
  }>;
  values: Record<string, string>;
  selectedInstanceId: string;
  onFieldChange: (name: string, value: string) => void;
  onInstanceChange: (instanceId: string) => void;
  instanceSelectLabel: string;
  instanceSelectPlaceholder: string;
  sendLabel: string;
  sendingLabel: string;
  isSending: boolean;
  onSendClick: () => void;
};

const isTextareaField = (name: string) => name === 'messageText' || name === 'vcard';
const isBooleanField = (type: string) => type === 'boolean';
const inputTypeFor = (name: string) => {
  if (name === 'latitude' || name === 'longitude' || name === 'webhookRetryCount') return 'number';
  if (name === 'date') return 'date';
  return 'text';
};

export const ApiRequestTester: React.FC<Props> = ({
  fields,
  instances,
  values,
  selectedInstanceId,
  onFieldChange,
  onInstanceChange,
  instanceSelectLabel,
  instanceSelectPlaceholder,
  sendLabel,
  sendingLabel,
  isSending,
  onSendClick
}) => {
  const visibleFields = fields.filter(field => field.name !== 'messageType' && field.name !== 'instanceId');

  return (
    <section className="rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{instanceSelectLabel}</span>
          <select
            value={selectedInstanceId}
            onChange={e => onInstanceChange(e.target.value)}
            disabled={isSending || instances.length === 0}
            className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">{instanceSelectPlaceholder}</option>
            {instances.map(instance => (
              <option key={instance.id} value={instance.id}>
                {instance.name} - {instance.number}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-400">instanceId * string</div>
        </label>

        {visibleFields.map(field => {
          const value = values[field.name] ?? '';
          const label = field.description;
          const hint = `${field.name}${field.required ? ' *' : ''} ${field.type}`;

          return (
            <label key={field.name} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
              {isBooleanField(field.type) ? (
                <select
                  value={value}
                  onChange={e => onFieldChange(field.name, e.target.value)}
                  disabled={isSending}
                  className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">— не задано —</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : isTextareaField(field.name) ? (
                <textarea
                  value={value}
                  onChange={e => onFieldChange(field.name, e.target.value)}
                  disabled={isSending}
                  rows={field.name === 'vcard' ? 6 : 4}
                  placeholder={field.example}
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              ) : (
                <input
                  value={value}
                  onChange={e => onFieldChange(field.name, e.target.value)}
                  disabled={isSending}
                  type={inputTypeFor(field.name)}
                  placeholder={field.example}
                  className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              )}
              <div className="text-xs text-slate-400">{hint}</div>
            </label>
          );
        })}

        <button
          type="button"
          onClick={onSendClick}
          disabled={isSending}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? sendingLabel : sendLabel}
        </button>
      </div>
    </section>
  );
};
