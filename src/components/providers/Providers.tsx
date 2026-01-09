'use client';

import { ReactNode } from 'react';
import { KeyboardShortcutsProvider } from '@/components/keyboard/KeyboardShortcutsProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <KeyboardShortcutsProvider>
      {children}
    </KeyboardShortcutsProvider>
  );
}
