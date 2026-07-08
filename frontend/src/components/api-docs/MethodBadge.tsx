import React from 'react';

type MethodBadgeProps = {
  method: 'GET' | 'POST';
  className?: string;
};

const styles: Record<MethodBadgeProps['method'], string> = {
  GET: 'bg-sky-500 text-white',
  POST: 'bg-emerald-500 text-white'
};

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, className }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${styles[method]} ${className ?? ''}`.trim()}>
    {method}
  </span>
);

