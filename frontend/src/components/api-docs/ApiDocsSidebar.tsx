import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import type { LocalizedApiDocsEndpoint, LocalizedApiDocsGroup } from './apiDocsData';

type Props = {
  groups: LocalizedApiDocsGroup[];
  endpointsByGroup: Map<string, LocalizedApiDocsEndpoint[]>;
  selectedEndpointId: string;
  onSelectEndpoint: (id: string) => void;
  openGroups: Record<string, boolean>;
  onToggleGroup: (groupId: string) => void;
};

export const ApiDocsSidebar: React.FC<Props> = ({
  groups,
  endpointsByGroup,
  selectedEndpointId,
  onSelectEndpoint,
  openGroups,
  onToggleGroup
}) => {
  return (
    <aside className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-1">
        {groups.map(group => {
          const items = endpointsByGroup.get(group.id) ?? [];
          const isOpen = openGroups[group.id];

          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => onToggleGroup(group.id)}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <span className="text-slate-500">{group.icon}</span>
                  {group.title}
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="mt-2 space-y-2 pl-2">
                  {items.map(endpoint => {
                    const isActive = selectedEndpointId === endpoint.id;
                    return (
                      <button
                        key={endpoint.id}
                        type="button"
                        onClick={() => onSelectEndpoint(endpoint.id)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <MethodBadge method={endpoint.method} />
                        <span className="truncate">{endpoint.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
