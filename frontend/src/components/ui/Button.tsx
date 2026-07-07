import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export const Button = ({ className, variant = 'primary', ...props }: Props) => {
  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary:
      'bg-mint-500 text-slate-950 hover:bg-mint-400 shadow-glow disabled:bg-slate-700 disabled:text-slate-400',
    secondary:
      'bg-white/10 text-slate-100 ring-1 ring-white/10 hover:bg-white/20 disabled:text-slate-500',
    ghost: 'bg-transparent text-slate-200 hover:bg-white/10'
  };

  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-mint-400/60 focus:ring-offset-0',
        variants[variant],
        className ?? ''
      ].join(' ')}
      {...props}
    />
  );
};
