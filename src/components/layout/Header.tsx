'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { QuickSearch } from '../search/QuickSearch';
import { Kbd } from '../keyboard/KeyboardShortcutsHelp';
import { usePlatform, getModifierKeyDisplay } from '@/hooks/useKeyboardShortcuts';

const navigation = [
  { name: 'Dashboard', href: '/', shortcut: '1' },
  { name: 'Manage', href: '/manage', shortcut: '2' },
];

export function Header() {
  const pathname = usePathname();
  const { platform, hasKeyboard, isClient } = usePlatform();
  const modKey = getModifierKeyDisplay(platform);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 dark:bg-gray-950/90 dark:border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4 sm:gap-6 lg:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8 text-primary-500 relative"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 hidden sm:block tracking-tight">
              Lab<span className="text-primary-500">Inventory</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50'
                  )}
                  title={`${modKey}${item.shortcut}`}
                >
                  {isActive && (
                    <span className="absolute inset-x-1 -bottom-[1px] h-0.5 bg-primary-500 rounded-full" />
                  )}
                  <span className="flex items-center gap-2">
                    {item.name}
                    {isClient && hasKeyboard && (
                      <Kbd size="sm">{item.shortcut}</Kbd>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer - only on desktop */}
          <div className="hidden md:block flex-1" />

          {/* Search - takes remaining space on mobile, fixed width on desktop */}
          <div className="flex-1 min-w-0 md:flex-none md:w-48 lg:w-64">
            <QuickSearch />
          </div>

          {/* Add Item Button - hidden on mobile (MobileNav has prominent Add button) */}
          <Link
            href="/items/new"
            className={clsx(
              'hidden md:inline-flex items-center justify-center gap-2 flex-shrink-0',
              'px-4 py-2 text-sm font-semibold rounded-lg',
              'bg-gradient-to-b from-primary-500 to-primary-600 text-gray-950',
              'hover:from-primary-400 hover:to-primary-500',
              'shadow-sm hover:shadow-md hover:shadow-primary-500/20',
              'transition-all duration-150',
              'dark:from-primary-400 dark:to-primary-500'
            )}
            title={`Add Item (${modKey}⇧A)`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Item</span>
            {isClient && hasKeyboard && (
              <span className="hidden lg:inline-flex gap-0.5">
                <Kbd size="sm" variant="primary">⇧</Kbd>
                <Kbd size="sm" variant="primary">A</Kbd>
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
