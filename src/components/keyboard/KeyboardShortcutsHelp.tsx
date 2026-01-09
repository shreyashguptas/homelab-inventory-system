'use client';

import { Modal } from '../ui/Modal';
import { SHORTCUTS, formatShortcut, getModifierKeyDisplay, usePlatform, Platform } from '@/hooks/useKeyboardShortcuts';
import { clsx } from 'clsx';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const { platform, isMobile } = usePlatform();
  const navigationShortcuts = SHORTCUTS.filter(s => s.category === 'navigation');
  const actionShortcuts = SHORTCUTS.filter(s => s.category === 'actions');
  const generalShortcuts = SHORTCUTS.filter(s => s.category === 'general');

  // Don't render on mobile
  if (isMobile) return null;

  const modKey = getModifierKeyDisplay(platform);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-5">
        {/* Navigation */}
        <ShortcutSection
          title="Navigation"
          platform={platform}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
          shortcuts={navigationShortcuts}
        />

        {/* Actions */}
        <ShortcutSection
          title="Actions"
          platform={platform}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          shortcuts={actionShortcuts}
        />

        {/* General */}
        <ShortcutSection
          title="General"
          platform={platform}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          shortcuts={generalShortcuts}
        />

        {/* Footer hint */}
        <div className="pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-mono flex items-center justify-center gap-2">
            <span className="opacity-60">Press</span>
            <Kbd size="sm">{modKey}/</Kbd>
            <span className="opacity-60">to toggle</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}

interface ShortcutSectionProps {
  title: string;
  icon: React.ReactNode;
  shortcuts: typeof SHORTCUTS;
  platform: Platform;
}

function ShortcutSection({ title, icon, shortcuts, platform }: ShortcutSectionProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="group">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
          {icon}
        </span>
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider font-mono">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
      </div>

      {/* Shortcut items */}
      <div className="space-y-1 pl-7">
        {shortcuts.map((shortcut, index) => (
          <div
            key={shortcut.key + (shortcut.meta ? 'meta' : '') + (shortcut.shift ? 'shift' : '')}
            className={clsx(
              'flex items-center justify-between py-2 px-2.5 -mx-2.5 rounded-lg',
              'transition-colors duration-150',
              'hover:bg-gray-100/80 dark:hover:bg-gray-800/50'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {shortcut.description}
            </span>
            <Kbd>{formatShortcut(shortcut, platform)}</Kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

// Keyboard key display component - mechanical keyboard aesthetic
interface KbdProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'primary';
}

function Kbd({ children, className, size = 'md', variant = 'default' }: KbdProps) {
  const sizes = {
    sm: 'min-w-[1.25rem] h-5 px-1 text-[10px]',
    md: 'min-w-[1.5rem] h-6 px-1.5 text-xs',
  };

  const variants = {
    default: clsx(
      // Light mode - clean key look
      'bg-gray-100 text-gray-600',
      'border border-gray-300',
      'shadow-[0_1px_0_0_rgba(0,0,0,0.1)]',
      // Dark mode - simple, readable
      'dark:bg-gray-700 dark:text-gray-100',
      'dark:border-gray-600',
      'dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)]'
    ),
    primary: clsx(
      // Light mode - amber key
      'bg-primary-100 text-primary-800',
      'border border-primary-300',
      'shadow-[0_1px_0_0_rgba(0,0,0,0.1)]',
      // Dark mode - amber key, readable
      'dark:bg-primary-800/80 dark:text-primary-200',
      'dark:border-primary-600',
      'dark:shadow-[0_1px_0_0_rgba(0,0,0,0.3)]'
    ),
  };

  return (
    <kbd
      className={clsx(
        'inline-flex items-center justify-center',
        'font-mono font-medium tracking-tight',
        'rounded-[4px]',
        'transition-all duration-100',
        'select-none',
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Export Kbd for use elsewhere
export { Kbd };
