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
        <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-gray-400 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full bg-white border border-gray-200 rounded-xl py-2.5 text-sm placeholder-gray-400 text-gray-800 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all duration-150 ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
