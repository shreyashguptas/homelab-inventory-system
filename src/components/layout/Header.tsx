'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { QuickSearch } from '../search/QuickSearch';
import { ThemeToggle } from './ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Inventory', href: '/items' },
  { name: 'Categories', href: '/categories' },
  { name: 'Vendors', href: '/vendors' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 dark:bg-gray-950/90 dark:border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg
                className="h-8 w-8 text-primary-500 relative"
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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
                >
                  {isActive && (
                    <span className="absolute inset-x-1 -bottom-[1px] h-0.5 bg-primary-500 rounded-full" />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Search and actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <QuickSearch />
            </div>
            <ThemeToggle />
            <Link
              href="/items/new"
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg',
                'bg-gradient-to-b from-primary-500 to-primary-600 text-gray-950',
                'hover:from-primary-400 hover:to-primary-500',
                'shadow-sm hover:shadow-md hover:shadow-primary-500/20',
                'transition-all duration-150',
                'dark:from-primary-400 dark:to-primary-500'
              )}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Item</span>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden pb-3">
          <QuickSearch />
        </div>

        {/* Mobile navigation */}
        <nav className="flex md:hidden gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
