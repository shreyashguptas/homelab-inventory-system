'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface KeyboardShortcutsContextValue {
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const showHelp = () => setIsHelpOpen(true);
  const hideHelp = () => setIsHelpOpen(false);

  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setIsHelpOpen(prev => !prev), // Toggle on Cmd+/
  });

  return (
    <KeyboardShortcutsContext.Provider value={{ showHelp, hideHelp, isHelpOpen }}>
      {children}
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={hideHelp} />
    </KeyboardShortcutsContext.Provider>
  );
}
