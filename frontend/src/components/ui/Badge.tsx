import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}>;

const tones: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'bg-white/10 text-slate-200 ring-white/10',
  success: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  warning: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  danger: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  info: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20'
};

export const Badge = ({ tone = 'neutral', children }: Props) => {
  return (
    <span className={['inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1', tones[tone]].join(' ')}>
      {children}
    </span>
  );
};
