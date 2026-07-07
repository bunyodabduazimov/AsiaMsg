import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string; // e.g. "66.7%"
  trend?: string; // e.g. "14% с вчера" or "5%"
  trendDirection?: 'up' | 'down';
  trendColor?: 'green' | 'red';
  icon: React.ReactNode;
  iconBg: string; // Tailwind class e.g. "bg-blue-50 text-blue-600"
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  trend,
  trendDirection = 'up',
  trendColor = 'green',
  icon,
  iconBg,
}) => {
  const isTrendGreen = trendColor === 'green';
  const trendArrow = trendDirection === 'up' ? '↗' : '↘';

  const getDarkIconBg = (bgClass: string) => {
    if (bgClass.includes('bg-blue-50')) return bgClass + ' dark:bg-blue-950/40 dark:text-blue-400';
    if (bgClass.includes('bg-emerald-50')) return bgClass + ' dark:bg-emerald-950/40 dark:text-emerald-400';
    if (bgClass.includes('bg-purple-50')) return bgClass + ' dark:bg-purple-950/40 dark:text-purple-400';
    if (bgClass.includes('bg-rose-50')) return bgClass + ' dark:bg-rose-950/40 dark:text-rose-400';
    return bgClass;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-gray-400 dark:text-slate-500 block mb-1">{title}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</span>
            {subValue && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800">
                {subValue}
              </span>
            )}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${getDarkIconBg(iconBg)}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
          <span className={isTrendGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
            {trendArrow} {trend}
          </span>
          <span className="text-gray-400 dark:text-slate-500">с вчера</span>
        </div>
      )}
    </div>
  );
};
