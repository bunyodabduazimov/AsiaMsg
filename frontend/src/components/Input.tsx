import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-gray-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-all duration-150 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/20 ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center text-gray-400 dark:text-slate-500">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
