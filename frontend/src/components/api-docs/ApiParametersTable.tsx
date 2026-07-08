import React from 'react';
import type { LocalizedApiDocsField } from './apiDocsData';

type Props = {
  fields: LocalizedApiDocsField[];
  title: string;
  parameterHeader: string;
  typeHeader: string;
  descriptionHeader: string;
  exampleLabel: string;
  emptyLabel: string;
};

export const ApiParametersTable: React.FC<Props> = ({
  fields,
  title,
  parameterHeader,
  typeHeader,
  descriptionHeader,
  exampleLabel,
  emptyLabel
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">{title}</div>
      {fields.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">{parameterHeader}</th>
                <th className="px-4 py-3">{typeHeader}</th>
                <th className="px-4 py-3">{descriptionHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map(field => (
                <tr key={field.name}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {field.name} {field.required ? <span className="text-rose-500">*</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {field.description}
                    {field.example ? <div className="mt-1 text-[11px] text-slate-400">{exampleLabel}: {field.example}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-slate-400">{emptyLabel}</div>
      )}
    </div>
  );
};
