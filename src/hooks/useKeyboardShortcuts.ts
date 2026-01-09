'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  meta?: boolean;  // Cmd on Mac, Ctrl on Windows/Linux
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: 'navigation' | 'actions' | 'general';
  action: () => void;
}

export type Platform = 'mac' | 'windows' | 'linux' | 'mobile' | 'unknown';

// Detect platform from user agent and other signals
function detectPlatform(): Platform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // Check for mobile devices first
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent) ||
                   ('ontouchstart' in window && navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

  if (isMobile) {
    return 'mobile';
  }

  // Check for Mac
  if (platform.includes('mac') || userAgent.includes('macintosh')) {
    return 'mac';
  }

  // Check for Windows
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }

  // Check for Linux
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

// Hook to get platform info with SSR safety
export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPlatform(detectPlatform());

    // Also listen for resize to detect if device becomes "mobile" (e.g., dev tools responsive mode)
    const handleResize = () => {
      setPlatform(detectPlatform());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    platform,
    isClient,
    isMac: platform === 'mac',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
    isMobile: platform === 'mobile',
    isDesktop: platform === 'mac' || platform === 'windows' || platform === 'linux',
    hasKeyboard: platform !== 'mobile',
  };
}

// Get modifier key display for current platform
export function getModifierKeyDisplay(platform: Platform): string {
  switch (platform) {
    case 'mac':
      return '⌘';
    case 'windows':
    case 'linux':
      return 'Ctrl';
    default:
      return 'Ctrl';
  }
}

// Get shift key display for current platform
export function getShiftKeyDisplay(platform: Platform): string {
  return platform === 'mac' ? '⇧' : 'Shift';
}

// Get alt key display for current platform
export function getAltKeyDisplay(platform: Platform): string {
  switch (platform) {
    case 'mac':
      return '⌥';
    case 'windows':
      return 'Alt';
    case 'linux':
      return 'Alt';
    default:
      return 'Alt';
  }
}

// Format shortcut for display based on platform
export function formatShortcut(
  shortcut: Pick<KeyboardShortcut, 'key' | 'meta' | 'shift' | 'alt'>,
  platform: Platform
): string {
  const parts: string[] = [];
  const isMac = platform === 'mac';

  if (shortcut.meta) {
    parts.push(getModifierKeyDisplay(platform));
  }
  if (shortcut.alt) {
    parts.push(getAltKeyDisplay(platform));
  }
  if (shortcut.shift) {
    parts.push(getShiftKeyDisplay(platform));
  }

  // Format the key
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === '/') keyDisplay = '/';
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
  if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
  if (shortcut.key === 'Enter') keyDisplay = '↵';

  parts.push(keyDisplay);

  // Mac uses no separator, Windows/Linux use +
  return parts.join(isMac ? '' : '+');
}

// Legacy function for backward compatibility
export function getModifierKey(): string {
  if (typeof window === 'undefined') return 'Ctrl';
  const platform = detectPlatform();
  return getModifierKeyDisplay(platform);
}

// All available shortcuts (for help modal)
export const SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  // Navigation
  { key: 'k', meta: true, description: 'Search', category: 'navigation' },
  { key: 'a', meta: true, shift: true, description: 'Add New Item', category: 'navigation' },
  { key: '1', meta: true, description: 'Go to Dashboard', category: 'navigation' },
  { key: '2', meta: true, description: 'Go to Inventory', category: 'navigation' },
  { key: '3', meta: true, description: 'Go to Categories', category: 'navigation' },
  { key: '4', meta: true, description: 'Go to Vendors', category: 'navigation' },
  // Actions
  { key: 'i', meta: true, shift: true, description: 'Import CSV', category: 'actions' },
  { key: 'Enter', meta: true, shift: true, description: 'Save item (on form)', category: 'actions' },
  // General
  { key: '/', meta: true, description: 'Show keyboard shortcuts', category: 'general' },
  { key: 'Escape', description: 'Close modal / Go back', category: 'general' },
];

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({ onShowHelp, enabled = true }: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const { isMobile } = usePlatform();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

    // Allow Escape to work even in inputs
    if (isInput && event.key !== 'Escape') {
      return;
    }

    const meta = event.metaKey || event.ctrlKey;
    const shift = event.shiftKey;

    // Cmd/Ctrl + K - Search (handled by QuickSearch component, but prevent default)
    if (meta && event.key === 'k') {
      // Let QuickSearch handle this
      return;
    }

    // Cmd/Ctrl + Shift + A - Add New Item
    if (meta && shift && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      router.push('/items/new');
      return;
    }

    // Cmd/Ctrl + 1 - Dashboard
    if (meta && event.key === '1') {
      event.preventDefault();
      router.push('/');
      return;
    }

    // Cmd/Ctrl + 2 - Inventory
    if (meta && event.key === '2') {
      event.preventDefault();
      router.push('/items');
      return;
    }

    // Cmd/Ctrl + 3 - Categories
    if (meta && event.key === '3') {
      event.preventDefault();
      router.push('/categories');
      return;
    }

    // Cmd/Ctrl + 4 - Vendors
    if (meta && event.key === '4') {
      event.preventDefault();
      router.push('/vendors');
      return;
    }

    // Cmd/Ctrl + Shift + I - Import CSV
    if (meta && shift && event.key === 'i') {
      event.preventDefault();
      router.push('/import');
      return;
    }

    // Cmd/Ctrl + / - Show keyboard shortcuts help
    if (meta && event.key === '/') {
      event.preventDefault();
      onShowHelp?.();
      return;
    }
  }, [router, onShowHelp]);

  useEffect(() => {
    // Don't register keyboard shortcuts on mobile
    if (!enabled || isMobile) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled, isMobile]);
}
