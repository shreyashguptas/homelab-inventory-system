'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

interface SpecificationsEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export function SpecificationsEditor({ value, onChange }: SpecificationsEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const entries = Object.entries(value);

  const handleAdd = () => {
    if (!newKey.trim()) return;

    onChange({
      ...value,
      [newKey.trim()]: newValue.trim(),
    });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (key: string) => {
    const { [key]: _, ...rest } = value;
    onChange(rest);
  };

  const handleUpdate = (key: string, newVal: string) => {
    onChange({
      ...value,
      [key]: newVal,
    });
  };

  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex gap-2 items-center">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={key}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <Input
                  value={val}
                  onChange={(e) => handleUpdate(key, e.target.value)}
                  placeholder="Value"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(key)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g., voltage)"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value (e.g., 5V)"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>
        <Button type="button" variant="secondary" size="md" onClick={handleAdd}>
          Add
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Add technical specifications like voltage, dimensions, resistance, etc.
      </p>
    </div>
  );
}
