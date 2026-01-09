'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

    const variants = {
      primary: clsx(
        'bg-gradient-to-b from-primary-500 to-primary-600 text-gray-950 font-semibold',
        'hover:from-primary-400 hover:to-primary-500',
        'focus:ring-primary-500/50',
        'shadow-sm hover:shadow-md hover:shadow-primary-500/20',
        'dark:from-primary-400 dark:to-primary-500 dark:hover:from-primary-300 dark:hover:to-primary-400'
      ),
      secondary: clsx(
        'bg-gray-100 text-gray-700 border border-gray-200',
        'hover:bg-gray-200 hover:border-gray-300',
        'focus:ring-gray-400/50',
        'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
        'dark:hover:bg-gray-700 dark:hover:border-gray-600'
      ),
      danger: clsx(
        'bg-gradient-to-b from-red-500 to-red-600 text-white',
        'hover:from-red-400 hover:to-red-500',
        'focus:ring-red-500/50',
        'shadow-sm hover:shadow-md hover:shadow-red-500/20',
        'dark:from-red-500 dark:to-red-600'
      ),
      ghost: clsx(
        'bg-transparent text-gray-600',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:ring-gray-400/50',
        'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-2.5 text-base rounded-lg gap-2',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
