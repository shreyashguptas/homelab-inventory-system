'use client';

import { clsx } from 'clsx';
import { ThemeToggle } from './ThemeToggle';
import { Kbd } from '../keyboard/KeyboardShortcutsHelp';
import { useKeyboardShortcutsContext } from '../keyboard/KeyboardShortcutsProvider';
import { usePlatform, getModifierKeyDisplay } from '@/hooks/useKeyboardShortcuts';
import { APP_VERSION } from '@/lib/config';

export function Footer() {
  const { showHelp } = useKeyboardShortcutsContext();
  const { platform, hasKeyboard, isClient } = usePlatform();
  const modKey = getModifierKeyDisplay(platform);

  return (
    <footer className="border-t border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side - branding/copyright */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-mono text-xs">Lab Inventory</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs">v{APP_VERSION}</span>
          </div>

          {/* Right side - actions */}
          <div className="flex items-center gap-2">
            {/* Keyboard shortcuts button - only on desktop */}
            {isClient && hasKeyboard && (
              <button
                onClick={showHelp}
                className={clsx(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
                  'text-sm text-gray-500 hover:text-gray-700',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'dark:text-gray-400 dark:hover:text-gray-200',
                  'transition-colors'
                )}
                title={`Keyboard shortcuts (${modKey}/)`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
                </svg>
                <span className="hidden sm:inline text-xs">Shortcuts</span>
                <Kbd size="sm">/</Kbd>
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
