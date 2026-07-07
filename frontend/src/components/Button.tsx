import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  let baseStyle = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-100 border border-blue-600',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs',
    ghost: 'hover:bg-gray-100 text-gray-600 border border-transparent',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100',
    success: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100',
  };

  let sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    icon: 'p-2 text-sm',
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
