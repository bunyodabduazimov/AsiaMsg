import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: Props) => {
  return (
    <input
      className={[
        'w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100',
        'placeholder:text-slate-500 outline-none transition',
        'focus:border-mint-400/50 focus:ring-2 focus:ring-mint-400/20',
        className ?? ''
      ].join(' ')}
      {...props}
    />
  );
};
