'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', dot = false, children, ...props }, ref) => {
    const variants = {
      default: clsx(
        'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
        'dark:bg-gray-800/80 dark:text-gray-300 dark:ring-gray-700'
      ),
      primary: clsx(
        'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200',
        'dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-800'
      ),
      success: clsx(
        'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
        'dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
      ),
      warning: clsx(
        'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
        'dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800'
      ),
      danger: clsx(
        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
        'dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800'
      ),
      info: clsx(
        'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
        'dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800'
      ),
    };

    const dotColors = {
      default: 'bg-gray-400',
      primary: 'bg-primary-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      info: 'bg-sky-500',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-md',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
