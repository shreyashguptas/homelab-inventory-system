'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4',
        'bg-gray-950/60 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
    >
      <div
        className={clsx(
          'w-full max-h-[90vh] flex flex-col',
          'bg-white rounded-xl shadow-2xl',
          'dark:bg-gray-900/95 dark:backdrop-blur-xl',
          'border border-gray-200/50 dark:border-gray-700/50',
          'animate-in zoom-in-95 slide-in-from-bottom-2 duration-200',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={clsx(
                'p-2 -m-1 rounded-lg',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:hover:text-gray-300 dark:hover:bg-gray-800',
                'transition-colors touch-manipulation'
              )}
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
