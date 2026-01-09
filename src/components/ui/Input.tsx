'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  multiline?: false;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline: true;
}

type CombinedProps = InputProps | TextareaProps;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CombinedProps>(
  ({ className, label, error, multiline, ...props }, ref) => {
    const baseStyles = clsx(
      'w-full px-3 py-2 text-sm',
      'bg-white border rounded-lg',
      'text-gray-900 placeholder-gray-400',
      'transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      // Dark mode
      'dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500',
      'dark:border-gray-700 dark:disabled:bg-gray-900',
      'dark:focus:ring-primary-400/30 dark:focus:border-primary-400'
    );

    const inputStyles = clsx(
      baseStyles,
      error
        ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500 dark:border-red-500'
        : 'border-gray-300 dark:border-gray-700',
      className
    );

    const id = props.id || props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-primary-500 ml-1">*</span>}
          </label>
        )}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={id}
            className={inputStyles}
            rows={(props as TextareaProps).rows || 3}
            {...(props as TextareaProps)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={id}
            className={inputStyles}
            {...(props as InputProps)}
          />
        )}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
