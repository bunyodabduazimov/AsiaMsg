import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  className?: string;
}>;

export const Card = ({ children, className }: Props) => {
  return (
    <div
      className={[
        'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl',
        className ?? ''
      ].join(' ')}
    >
      {children}
    </div>
  );
};
